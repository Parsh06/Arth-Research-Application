import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed Origins for CORS Validation
const ALLOWED_ORIGINS = [
  'https://arthresearch.com',
  'https://www.arthresearch.com',
  'https://arthresearch.web.app',
  'https://arthresearch.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

/**
 * Validates and applies strict CORS headers based on the request origin.
 * Returns true if request is OPTIONS (preflight) and terminates response.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string) || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production';

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Check-Token, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * SSRF Protection: Validates that an outbound URL uses HTTPS and does not target internal / loopback networks.
 */
export function isSafeOutboundUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    
    // Disallow loopback, cloud metadata, and RFC 1918 private address ranges
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Standardized Safe JSON Error Formatter (Prevents stack trace / database path disclosure)
 */
export function sendSafeError(res: VercelResponse, status: number, userMessage: string, internalError?: any) {
  if (internalError && process.env.NODE_ENV !== 'production') {
    console.error(`[API ERROR ${status}]`, userMessage, internalError);
  }
  return res.status(status).json({
    success: false,
    error: userMessage
  });
}
