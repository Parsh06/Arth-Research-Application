import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendSafeError } from './security.js';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  role?: string;
}

const ADMIN_ROLES = ['super_admin', 'admin', 'research_admin', 'support_admin'];

/**
 * Extracts and verifies the Firebase ID Token from the Authorization header.
 * Calls Google Identity Toolkit API to cryptographically validate the JWT signature and expiration.
 */
export async function verifyFirebaseToken(req: VercelRequest): Promise<{ valid: boolean; user?: AuthenticatedUser; error?: string }> {
  const authHeader = (req.headers['authorization'] as string) || (req.headers['x-firebase-auth-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();

  // Allow machine-to-machine admin secret bypass for internal scripts/cron
  const masterSecret = process.env.CRON_SECRET || process.env.ADMIN_API_KEY || '';
  const adminSecretHeader = (req.headers['x-admin-key'] as string) || '';
  if (masterSecret && adminSecretHeader && adminSecretHeader === masterSecret) {
    return {
      valid: true,
      user: {
        uid: 'system_admin_key',
        email: process.env.GMAIL_USER || 'admin@arthresearch.com',
        role: 'super_admin'
      }
    };
  }

  if (!token) {
    return { valid: false, error: 'Authentication required. Authorization Bearer token is missing.' };
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '';
  if (!apiKey) {
    console.error('[AUTH ERROR] Firebase API key not configured in environment.');
    return { valid: false, error: 'Server authentication configuration error.' };
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken: token })
    });

    const data: any = await res.json();

    if (!res.ok || !data.users || data.users.length === 0) {
      const msg = data.error?.message || 'Invalid or expired authentication token';
      return { valid: false, error: msg };
    }

    const googleUser = data.users[0];
    const uid = googleUser.localId;
    const email = googleUser.email || '';

    // Fetch user role from Firestore if possible, or fallback to email check
    let role = 'user';
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
    
    // Check known master admin emails
    const adminEmail = (process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER || '').toLowerCase();
    if (email && adminEmail && email.toLowerCase() === adminEmail) {
      role = 'super_admin';
    } else if (projectId) {
      try {
        const firestoreRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (firestoreRes.ok) {
          const docData: any = await firestoreRes.json();
          const docRole = docData.fields?.role?.stringValue;
          if (docRole) {
            role = docRole.toLowerCase();
          }
        }
      } catch (fErr) {
        // Non-blocking fallback
      }
    }

    return {
      valid: true,
      user: {
        uid,
        email,
        emailVerified: googleUser.emailVerified,
        displayName: googleUser.displayName,
        role
      }
    };
  } catch (err: any) {
    console.error('[AUTH VERIFICATION ERROR]', err);
    return { valid: false, error: 'Failed to verify authentication credentials' };
  }
}

/**
 * Middleware: Requires a valid logged-in user. Responds with 401 if unauthenticated.
 */
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthenticatedUser | null> {
  const result = await verifyFirebaseToken(req);
  if (!result.valid || !result.user) {
    sendSafeError(res, 401, result.error || 'Unauthorized: Access requires a valid authenticated user session.');
    return null;
  }
  return result.user;
}

/**
 * Middleware: Requires an administrative user (super_admin, admin, research_admin, support_admin).
 * Responds with 401 if unauthenticated, or 403 if user lacks administrative privileges.
 */
export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<AuthenticatedUser | null> {
  const result = await verifyFirebaseToken(req);
  if (!result.valid || !result.user) {
    sendSafeError(res, 401, result.error || 'Unauthorized: Administrative access requires login.');
    return null;
  }

  const role = result.user.role || 'user';
  if (!ADMIN_ROLES.includes(role)) {
    sendSafeError(res, 403, 'Forbidden: This operation requires administrative privileges.');
    return null;
  }

  return result.user;
}
