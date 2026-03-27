/**
 * Validation logic for contract data
 * Extracted from ContractUploadFlow.tsx for testability
 */

import type { ValidationResult, KeyTerms } from './types';

/**
 * Validate creator contact information
 * @param name - Creator name
 * @param email - Creator email
 * @param phone - Creator phone (optional)
 * @returns ValidationResult with isValid and message
 */
export function validateCreatorContactInfo(
  name: string,
  email: string,
  phone?: string
): ValidationResult {
  // Check name
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: 'Please enter your full name' };
  }
  
  // Check email
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  // Check phone if provided
  if (phone && phone.trim()) {
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
  }
  
  return { isValid: true, message: 'Contact information is valid' };
}

/**
 * Validate a contract file
 * @param file - File object with name, size, type
 * @param maxSizeMB - Maximum file size in MB (default 10)
 * @returns ValidationResult
 */
export function validateContractFile(
  file: { name: string; size: number; type: string },
  maxSizeMB: number = 10
): ValidationResult {
  // Check file existence
  if (!file) {
    return { isValid: false, message: 'Please select a file' };
  }
  
  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    return { isValid: false, message: 'File name is required' };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, message: `File size exceeds ${maxSizeMB}MB limit` };
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return { isValid: false, message: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, or images' };
  }
  
  return { isValid: true, message: 'File is valid' };
}

/**
 * Validate key terms from contract analysis
 * @param keyTerms - Key terms object
 * @returns Validation result with missing critical terms
 */
export function validateKeyTerms(keyTerms: KeyTerms | undefined | null): {
  isValid: boolean;
  missingTerms: string[];
  warnings: string[];
} {
  if (!keyTerms) {
    return {
      isValid: false,
      missingTerms: ['All terms'],
      warnings: ['No contract terms could be extracted']
    };
  }
  
  const criticalTerms = ['dealValue', 'paymentTerms', 'deliverables'];
  const recommendedTerms = ['usageRights', 'exclusivity', 'termination'];
  
  const missingCritical: string[] = [];
  const missingRecommended: string[] = [];
  const warnings: string[] = [];
  
  // Check critical terms
  for (const term of criticalTerms) {
    if (!keyTerms[term]) {
      missingCritical.push(term);
    }
  }
  
  // Check recommended terms
  for (const term of recommendedTerms) {
    if (!keyTerms[term]) {
      missingRecommended.push(term);
    }
  }
  
  // Generate warnings
  if (missingCritical.length > 0) {
    warnings.push(`Critical terms missing: ${missingCritical.join(', ')}`);
  }
  
  if (missingRecommended.length > 0) {
    warnings.push(`Recommended terms to clarify: ${missingRecommended.join(', ')}`);
  }
  
  // Check for risky values
  if (keyTerms.exclusivity?.toLowerCase().includes('exclusive')) {
    warnings.push('Exclusivity clause detected - review scope carefully');
  }
  
  if (keyTerms.usageRights?.toLowerCase().includes('perpetual')) {
    warnings.push('Perpetual usage rights detected - consider time limits');
  }
  
  return {
    isValid: missingCritical.length === 0,
    missingTerms: [...missingCritical, ...missingRecommended],
    warnings
  };
}

/**
 * Validate negotiation request form
 * @param changes - Requested changes
 * @param reason - Reason for changes
 * @returns ValidationResult
 */
export function validateNegotiationRequest(
  changes: string[],
  reason: string
): ValidationResult {
  if (!changes || changes.length === 0) {
    return { isValid: false, message: 'Please select at least one change to request' };
  }
  
  if (!reason || reason.trim().length < 10) {
    return { isValid: false, message: 'Please provide a reason for your request (min 10 characters)' };
  }
  
  if (reason.trim().length > 1000) {
    return { isValid: false, message: 'Reason is too long (max 1000 characters)' };
  }
  
  return { isValid: true, message: 'Negotiation request is valid' };
}

/**
 * Validate WhatsApp message before sending
 * @param message - Message to validate
 * @param maxLength - Maximum message length (default 4096)
 * @returns ValidationResult
 */
export function validateWhatsAppMessage(
  message: string,
  maxLength: number = 4096
): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { isValid: false, message: 'Message cannot be empty' };
  }
  
  if (message.length > maxLength) {
    return { isValid: false, message: `Message exceeds ${maxLength} character limit` };
  }
  
  // Check for invalid characters
  const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
  if (invalidChars.test(message)) {
    return { isValid: false, message: 'Message contains invalid characters' };
  }
  
  return { isValid: true, message: 'Message is valid' };
}

/**
 * Validate brand contact information
 * @param brandName - Brand name
 * @param brandEmail - Brand email
 * @param brandPhone - Brand phone (optional)
 * @returns ValidationResult
 */
export function validateBrandContactInfo(
  brandName: string,
  brandEmail: string,
  brandPhone?: string
): ValidationResult {
  // Check brand name
  if (!brandName || brandName.trim().length < 2) {
    return { isValid: false, message: 'Please enter brand/company name' };
  }
  
  // Check email
  if (!brandEmail || !brandEmail.trim()) {
    return { isValid: false, message: 'Brand email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(brandEmail)) {
    return { isValid: false, message: 'Please enter a valid brand email address' };
  }
  
  // Check phone if provided
  if (brandPhone && brandPhone.trim()) {
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(brandPhone.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Please enter a valid brand phone number' };
    }
  }
  
  return { isValid: true, message: 'Brand contact information is valid' };
}

/**
 * Check if contract is ready for analysis
 * @param fileUploaded - Whether file is uploaded
 * @param creatorInfoValid - Whether creator info is valid
 * @param brandInfoValid - Whether brand info is valid
 * @returns ValidationResult
 */
export function isReadyForAnalysis(
  fileUploaded: boolean,
  creatorInfoValid: boolean,
  brandInfoValid: boolean
): ValidationResult {
  if (!fileUploaded) {
    return { isValid: false, message: 'Please upload a contract file' };
  }
  
  if (!creatorInfoValid) {
    return { isValid: false, message: 'Please complete your contact information' };
  }
  
  if (!brandInfoValid) {
    return { isValid: false, message: 'Please provide brand contact information' };
  }
  
  return { isValid: true, message: 'Ready for analysis' };
}

/**
 * Validate analysis results
 * @param results - Analysis results object
 * @returns Whether results are valid and usable
 */
export function validateAnalysisResults(results: unknown): {
  isValid: boolean;
  hasRiskScore: boolean;
  hasIssues: boolean;
  hasKeyTerms: boolean;
  summary: string;
} {
  if (!results || typeof results !== 'object') {
    return {
      isValid: false,
      hasRiskScore: false,
      hasIssues: false,
      hasKeyTerms: false,
      summary: 'No analysis results provided'
    };
  }
  
  const r = results as Record<string, unknown>;
  
  const hasRiskScore = typeof r.riskScore === 'number' && r.riskScore >= 0 && r.riskScore <= 100;
  const hasIssues = Array.isArray(r.issues) && r.issues.length > 0;
  const hasKeyTerms = r.keyTerms && typeof r.keyTerms === 'object' && Object.keys(r.keyTerms as object).length > 0;
  
  const isValid = hasRiskScore || hasIssues || hasKeyTerms;
  
  let summary = 'Analysis results: ';
  const parts: string[] = [];
  
  if (hasRiskScore) parts.push(`Risk score: ${r.riskScore}`);
  if (hasIssues) parts.push(`${(r.issues as unknown[]).length} issues found`);
  if (hasKeyTerms) parts.push('Key terms extracted');
  
  summary += parts.join(', ') || 'No significant data extracted';
  
  return {
    isValid,
    hasRiskScore,
    hasIssues,
    hasKeyTerms,
    summary
  };
}
