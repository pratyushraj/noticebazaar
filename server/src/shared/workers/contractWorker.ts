/**
 * Contract Worker
 * 
 * Handles contract generation jobs.
 * 
 * @module shared/workers/contractWorker
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Contract generation options
 */
interface ContractOptions {
  collaborationId: string;
  userId: string;
  format: 'pdf' | 'docx';
}

/**
 * Contract generation result
 */
interface ContractResult {
  contractId: string;
  fileUrl: string;
  fileName: string;
}

/**
 * Supabase client (lazy initialized)
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase client
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseClient;
}

/**
 * Generate a contract document
 */
export async function generateContract(options: ContractOptions): Promise<ContractResult> {
  const { collaborationId, userId, format } = options;
  const supabase = getSupabaseClient();

  // 1. Fetch collaboration details
  const { data: collaboration, error: collabError } = await supabase
    .from('collaborations')
    .select(`
      *,
      creator:profiles!collaborations_creator_id_fkey(*),
      brand:profiles!collaborations_brand_id_fkey(*),
      deal_terms(*)
    `)
    .eq('id', collaborationId)
    .single();

  if (collabError || !collaboration) {
    throw new Error(`Collaboration not found: ${collaborationId}`);
  }

  // 2. Verify user has access
  const hasAccess = 
    collaboration.creator_id === userId || 
    collaboration.brand_id === userId;

  if (!hasAccess) {
    throw new Error('User does not have access to this collaboration');
  }

  // 3. Generate contract document
  let contractBuffer: Buffer;
  let fileName: string;
  let mimeType: string;

  if (format === 'pdf') {
    const { generatePdfContract } = await import('../../services/pdfGenerator');
    contractBuffer = await generatePdfContract(collaboration);
    fileName = `contract_${collaborationId}_${Date.now()}.pdf`;
    mimeType = 'application/pdf';
  } else {
    const { generateDocxContract } = await import('../../services/docxContractGenerator');
    contractBuffer = await generateDocxContract(collaboration);
    fileName = `contract_${collaborationId}_${Date.now()}.docx`;
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // 4. Upload to storage
  const filePath = `contracts/${userId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, contractBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload contract: ${uploadError.message}`);
  }

  // 5. Get public URL
  const { data: urlData } = supabase.storage
    .from('contracts')
    .getPublicUrl(filePath);

  // 6. Create contract record
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      collaboration_id: collaborationId,
      generated_by: userId,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_name: fileName,
      format,
      status: 'generated',
    })
    .select()
    .single();

  if (contractError || !contract) {
    throw new Error(`Failed to create contract record: ${contractError?.message}`);
  }

  // 7. Update collaboration with contract reference
  await supabase
    .from('collaborations')
    .update({ contract_id: contract.id })
    .eq('id', collaborationId);

  return {
    contractId: contract.id,
    fileUrl: urlData.publicUrl,
    fileName,
  };
}

/**
 * Regenerate a contract (after changes)
 */
export async function regenerateContract(contractId: string): Promise<ContractResult> {
  const supabase = getSupabaseClient();

  // Fetch existing contract
  const { data: existingContract, error } = await supabase
    .from('contracts')
    .select('*, collaborations(*)')
    .eq('id', contractId)
    .single();

  if (error || !existingContract) {
    throw new Error(`Contract not found: ${contractId}`);
  }

  // Generate new version
  return generateContract({
    collaborationId: existingContract.collaboration_id,
    userId: existingContract.generated_by,
    format: existingContract.format,
  });
}

export default {
  generateContract,
  regenerateContract,
};
