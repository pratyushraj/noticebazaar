import JSZip from 'jszip';
import { downloadFile } from './fileDownload';

export interface DealDocument {
  url: string | null;
  name: string;
  type: 'contract' | 'invoice' | 'deliverable' | 'issue' | 'other';
}

export interface DealZipBundleOptions {
  dealTitle: string;
  documents: DealDocument[];
  deliverables?: Array<{ title: string; dueDate?: string; status?: string }>;
  issueHistory?: Array<{ id: string; type: string; message: string; timestamp: string }>;
}

/**
 * Build a ZIP bundle of all deal documents
 */
export async function buildDealZipBundle(options: DealZipBundleOptions): Promise<Blob> {
  const zip = new JSZip();
  const { dealTitle, documents, deliverables, issueHistory } = options;

  // Sanitize deal title for filename
  const sanitizedTitle = dealTitle
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .substring(0, 50);

  // Add documents
  for (const doc of documents) {
    if (!doc.url) continue;

    try {
      const response = await fetch(doc.url, {
        mode: 'cors',
        credentials: 'omit',
      });
      if (!response.ok) continue;

      const blob = await response.blob();
      const folder = doc.type === 'contract' ? 'contracts' : doc.type === 'invoice' ? 'invoices' : 'documents';
      zip.file(`${folder}/${doc.name}`, blob);
    } catch (error) {
      console.warn(`Failed to fetch ${doc.name}:`, error);
      // Continue with other documents
    }
  }

  // Add deliverables as JSON
  if (deliverables && deliverables.length > 0) {
    const deliverablesJson = JSON.stringify(deliverables, null, 2);
    zip.file('deliverables.json', deliverablesJson);
  }

  // Add issue history as JSON
  if (issueHistory && issueHistory.length > 0) {
    const issuesJson = JSON.stringify(issueHistory, null, 2);
    zip.file('issue-history.json', issuesJson);
  }

  // Add README
  const readme = `Deal Documents Bundle
====================

Deal: ${dealTitle}
Generated: ${new Date().toISOString()}

Contents:
- contracts/: Contract files
- invoices/: Invoice files
- documents/: Other documents
- deliverables.json: Deliverables list
- issue-history.json: Issue report history

This bundle contains all documents and data related to this deal.
`;
  zip.file('README.txt', readme);

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download deal documents as ZIP
 */
export async function downloadDealZipBundle(
  options: DealZipBundleOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    onProgress?.(0);
    
    const toast = (await import('sonner')).toast;
    const progressToast = toast.loading('Preparing your document bundle…', {
      description: 'This may take a moment.',
    });

    onProgress?.(25);
    const blob = await buildDealZipBundle(options);
    onProgress?.(75);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Deal-${options.dealTitle.replace(/[^a-z0-9]/gi, '-').substring(0, 50)}-Documents.zip`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    onProgress?.(100);

    toast.dismiss(progressToast);
    toast.success('Document bundle downloaded!', {
      description: `All documents saved as ZIP file.`,
    });
  } catch (error: any) {
    const toast = (await import('sonner')).toast;
    toast.error('Failed to create document bundle', {
      description: error.message || 'Could not bundle documents. Please try again.',
    });
    throw error;
  }
}

