import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed Origins Patterns for CORS Validation
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.web\.app$/,
  /^https:\/\/[a-z0-9-]+\.firebaseapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/(www\.)?arthresearch\.com$/
];

/**
 * Validates and applies strict CORS headers based on the request origin.
 * Returns true if request is OPTIONS (preflight) and terminates response.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string) || '';
  const isAllowed = !origin || ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin)) || process.env.NODE_ENV !== 'production';

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Check-Token, X-Requested-With, X-CSRF-Token, Accept, Accept-Version');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Safely parses request body regardless of whether Vercel delivers it as JSON object, Buffer, or string.
 */
export function parseRequestBody(body: any): any {
  if (!body) return {};
  if (typeof body === 'object') return body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
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
  if (internalError) {
    console.error(`[API ERROR ${status}]`, userMessage, internalError);
  }
  return res.status(status).json({
    success: false,
    error: userMessage
  });
}

