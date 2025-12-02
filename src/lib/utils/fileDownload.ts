/**
 * Safely extracts filename from a URL
 * @param url - The file URL
 * @returns Clean filename or default "contract.pdf"
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const clean = pathname.split('/').filter(Boolean).pop();
    return clean || 'contract.pdf';
  } catch {
    return 'contract.pdf';
  }
}

/**
 * Downloads a file from a URL
 * @param url - The file URL to download
 * @param filename - Optional custom filename (will be extracted from URL if not provided)
 * @returns Promise that resolves when download is triggered
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    // For Supabase public storage URLs, use direct download link to avoid CORB
    const isSupabasePublic = url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
    
    if (isSupabasePublic) {
      // Use direct link download for public Supabase storage
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || getFilenameFromUrl(url);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      return;
    }

    // For other URLs, use fetch with CORS mode
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || getFilenameFromUrl(url);
    
    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    throw error;
  }
}

/**
 * Checks if a URL points to a PDF file
 * @param url - The file URL
 * @returns True if URL appears to be a PDF
 */
export function isPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.pdf') || pathname.includes('.pdf');
  } catch {
    return false;
  }
}

/**
 * Checks if device is mobile
 * @returns True if mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

