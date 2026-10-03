import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed Origins Patterns for CORS & Origin Validation
export const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.web\.app$/,
  /^https:\/\/[a-z0-9-]+\.firebaseapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/(www\.)?arthresearch\.com$/
];

// Blocked Automated Testing Tools, Scrapers, and CLI HTTP Clients
export const BLOCKED_USER_AGENTS = [
  'postman',
  'postmanruntime',
  'insomnia',
  'curl',
  'wget',
  'python-requests',
  'python-urllib',
  'httpie',
  'aiohttp',
  'go-http-client',
  'apache-httpclient',
  'okhttp',
  'restsharp',
  'thunder client',
  'libwww-perl',
  'node-fetch',
  'axios'
];

// In-memory IP Rate Limiting Store
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Checks in-memory sliding window rate limits per client IP address.
 * Returns true if rate limit is exceeded and response is terminated.
 */
export function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  bucket: string,
  maxRequests: number,
  windowMs: number
): boolean {
  let bucketMap = rateLimitStores.get(bucket);
  if (!bucketMap) {
    bucketMap = new Map();
    rateLimitStores.set(bucket, bucketMap);
  }

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'anonymous_client';

  const now = Date.now();
  const entry = bucketMap.get(clientIp);

  if (entry && now < entry.resetAt) {
    if (entry.count >= maxRequests) {
      sendSafeError(res, 429, 'Rate limit exceeded. Please wait before retrying.');
      return true;
    }
    entry.count++;
  } else {
    bucketMap.set(clientIp, { count: 1, resetAt: now + windowMs });
  }

  // Periodic memory cleanup if store grows large
  if (bucketMap.size > 2000) {
    for (const [ip, item] of bucketMap.entries()) {
      if (now > item.resetAt) {
        bucketMap.delete(ip);
      }
    }
  }

  return false;
}

/**
 * Validates and applies strict CORS headers based on the request origin.
 * Returns true if request is OPTIONS (preflight) and terminates response.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string) || '';
  const isAllowed = origin && ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));
  const isDev = process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1';

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isDev && !origin) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-App-Check-Token, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, x-arth-client, X-Arth-Client'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Defense-in-depth gatekeeper for all client-facing serverless endpoints.
 * Blocks:
 * 1. Postman, curl, Insomnia, CLI tools, and automated scrapers via User-Agent blacklist
 * 2. Unauthenticated callers lacking custom application signature `x-arth-client`
 * 3. Invalid or spoofed Origin / Referer domains in production
 * 4. High-frequency abusive callers via integrated IP rate limiting
 * Returns true if the request was rejected and response terminated.
 */
export function validateClientRequest(
  req: VercelRequest,
  res: VercelResponse,
  options?: { rateLimit?: { key: string; max: number; windowMs: number } }
): boolean {
  // 1. Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return true;
  }

  // 2. User-Agent Validation (Blocks Postman, curl, Insomnia, bots, scrapers)
  const userAgent = ((req.headers['user-agent'] as string) || '').toLowerCase().trim();
  if (!userAgent) {
    sendSafeError(res, 403, 'Access forbidden: Direct API access is restricted');
    return true;
  }

  const isBlocked = BLOCKED_USER_AGENTS.some(blocked => userAgent.includes(blocked));
  if (isBlocked) {
    sendSafeError(res, 403, 'Access forbidden: Automated tooling is restricted');
    return true;
  }

  // 3. Client Signature Handshake Validation
  // Legitimate frontend requests send `x-arth-client: web-client-v1`
  const arthClientHeader = (req.headers['x-arth-client'] as string) || '';
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  // In production, enforce client signature
  if (isProd && arthClientHeader !== 'web-client-v1') {
    sendSafeError(res, 403, 'Access forbidden: Direct API access is restricted');
    return true;
  }

  // 4. Origin & Referer Validation in Production
  if (isProd) {
    const origin = (req.headers.origin as string) || '';
    const referer = (req.headers.referer as string) || '';
    const matchesOrigin = origin && ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));
    const matchesReferer = referer && ALLOWED_ORIGIN_PATTERNS.some(p => p.test(referer));

    if (!matchesOrigin && !matchesReferer) {
      sendSafeError(res, 403, 'Access forbidden: Request origin not authorized');
      return true;
    }
  }

  // 5. Rate Limiting if configured
  if (options?.rateLimit) {
    const isLimited = checkRateLimit(
      req,
      res,
      options.rateLimit.key,
      options.rateLimit.max,
      options.rateLimit.windowMs
    );
    if (isLimited) return true;
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
 * Standardized Safe JSON Error Formatter
 * Prevents stack trace, database connection strings, or system path disclosures.
 */
export function sendSafeError(res: VercelResponse, status: number, userMessage: string, internalError?: any) {
  if (internalError) {
    // Log privately to Vercel/Node server output only; never disclose to client
    console.error(`[API ERROR ${status}]`, userMessage, internalError?.message || internalError);
  }
  return res.status(status).json({
    success: false,
    error: userMessage
  });
}

