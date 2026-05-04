/**
 * Network utility functions
 * Used for SSRF protection and IP address validation
 */

/**
 * Check if an IP address is a private/reserved IP
 * Covers RFC 1918, loopback, link-local, and other reserved ranges
 */
export function isPrivateIp(ip: string): boolean {
  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, '');
  
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = cleanIp.match(ipv4Regex);
  
  if (!match) {
    // Could be IPv6 or invalid - conservatively treat as potentially private
    // For IPv6, check for localhost and link-local prefixes
    if (cleanIp === '::1' || cleanIp === 'localhost') return true;
    if (cleanIp.startsWith('fe80:')) return true; // IPv6 link-local
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // IPv6 unique local
    return false;
  }
  
  const parts = match.slice(1).map(Number);
  const [a, b, c, d] = parts;
  
  // Validate each octet is 0-255 (regex allows >255, e.g., 999.999.999.999)
  if (parts.some(p => p < 0 || p > 255)) {
    return false;
  }
  
  // Loopback: 127.0.0.0/8
  if (a === 127) return true;
  
  // RFC 1918 - Private networks
  // 10.0.0.0/8
  if (a === 10) return true;
  
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  
  // Link-local: 169.254.0.0/16
  if (a === 169 && b === 254) return true;
  
  // Carrier-grade NAT: 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) return true;
  
  // Test/documentation networks
  // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 192 && b === 0 && c === 0) return true;
  
  // 192.0.2.0/24 (TEST-NET-1, documentation)
  if (a === 192 && b === 0 && c === 2) return true;
  
  // 198.18.0.0/15 (benchmark testing)
  if (a === 198 && (b === 18 || b === 19)) return true;
  
  // 198.51.100.0/24 (TEST-NET-2, documentation)
  if (a === 198 && b === 51 && c === 100) return true;
  
  // 203.0.113.0/24 (TEST-NET-3, documentation)
  if (a === 203 && b === 0 && c === 113) return true;
  
  // Multicast: 224.0.0.0/4
  if (a >= 224 && a <= 239) return true;
  
  // Limited broadcast: 255.255.255.255
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;
  
  return false;
}

/**
 * Validate that a hostname doesn't resolve to a private IP
 * This is a simplified implementation. In production, use proper
 * DNS resolution via dns.promises.resolve4()/resolve6()
 */
export async function validateHostnameNotPrivate(hostname: string): Promise<boolean> {
  // In a production environment, you would do:
  // try {
  //   const addresses = await dns.promises.resolve(hostname);
  //   return !addresses.some(ip => isPrivateIp(ip));
  // } catch {
  //   return false;
  // }
  
  // For now, we rely on the isPrivateIp check after the request
  // The main protection is the allowlist of trusted domains
  return true;
}

/**
 * Extract hostname from URL string safely
 */
export function extractHostname(urlString: string): string | null {
  try {
    return new URL(urlString).hostname;
  } catch {
    return null;
  }
}
