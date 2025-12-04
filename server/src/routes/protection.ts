// Protection/Contract Analysis API routes

import { Router } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyzeContract } from '../services/contractAnalysis';
import { generateReportPdf } from '../services/pdfGenerator';

const router = Router();

// POST /protection/analyze - Analyze contract and generate report
router.post('/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { contract_url, deal_id } = req.body;

    if (!contract_url) {
      return res.status(400).json({ error: 'contract_url required' });
    }

    // Download contract file
    const contractResponse = await fetch(contract_url);
    if (!contractResponse.ok) {
      throw new Error('Failed to download contract file');
    }
    const contractBuffer = Buffer.from(await contractResponse.arrayBuffer());

    // Analyze contract
    const analysis = await analyzeContract(contractBuffer);

    // Generate PDF report
    const pdfBuffer = await generateReportPdf(analysis);
    
    // Upload PDF to storage
    const pdfPath = `protection-reports/${userId}/${Date.now()}_analysis_report.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(pdfPath);

    // Save protection report
    const { data: report, error: reportError } = await supabase
      .from('protection_reports')
      .insert({
        deal_id: deal_id || null,
        contract_file_url: contract_url,
        protection_score: analysis.protectionScore,
        overall_risk: analysis.overallRisk,
        analysis_json: analysis,
        pdf_report_url: urlData.publicUrl
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Save issues and verified items
    if (analysis.issues && analysis.issues.length > 0) {
      await supabase.from('protection_issues').insert(
        analysis.issues.map((issue: any) => ({
          report_id: report.id,
          severity: issue.severity,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          clause_reference: issue.clause,
          recommendation: issue.recommendation
        }))
      );
    }

    if (analysis.verified && analysis.verified.length > 0) {
      await supabase.from('protection_verified').insert(
        analysis.verified.map((item: any) => ({
          report_id: report.id,
          category: item.category,
          title: item.title,
          description: item.description,
          clause_reference: item.clause
        }))
      );
    }

    res.json({ data: report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /protection/:id/report.pdf - Get signed PDF download URL
router.get('/:id/report.pdf', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: report, error } = await supabase
      .from('protection_reports')
      .select('*, deal:brand_deals!deal_id(creator_id)')
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify access
    if (report.deal?.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!report.pdf_report_url) {
      return res.status(404).json({ error: 'PDF report not available' });
    }

    // Generate signed download URL
    const path = report.pdf_report_url.split('/').slice(-2).join('/');
    const { generateSignedDownloadUrl } = await import('../services/storage');
    const signedUrl = await generateSignedDownloadUrl(path, 3600);

    res.redirect(signedUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

