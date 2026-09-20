// src/config/api.ts

/**
 * Backend API Configuration
 * Supports decoupled deployment where:
 * - Frontend SPA runs on Firebase Hosting (or CDN)
 * - Backend APIs run as Serverless Functions on Vercel
 * - Local development proxies directly to Vite dev server
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();

// In local browser development (localhost/127.0.0.1), always use relative paths
// so the Vite dev server middleware handles all /api endpoints natively.
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost ? '' : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

/**
 * Resolves a given API route path to either the full Vercel backend URL or local relative route
 * @param path e.g. '/api/send-email' or '/send-email'
 * @returns Fully qualified URL or relative path
 */
export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = cleanPath.startsWith('/api/') ? cleanPath : `/api${cleanPath}`;

  if (!API_BASE_URL || isLocalhost) {
    // Relative path for local development Vite middleware
    return normalizedPath;
  }

  // Full URL for decoupled cross-origin production setup (Firebase -> Vercel)
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Resilient API fetch wrapper with timeout and standard header defaults
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const url = getApiEndpoint(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(id);

    let data: any = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawText: text };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Backend might be unreachable.`);
    }
    throw error;
  }
}
