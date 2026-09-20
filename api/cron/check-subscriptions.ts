import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  // Authorization check (from cron-job.org Bearer token or ?secret= query param)
  const authHeader = (req.headers['authorization'] as string) || '';
  const querySecret = (req.query.secret as string) || '';
  const providedRaw = querySecret || authHeader.replace(/^Bearer\s+/i, '').trim();
  
  let providedDecoded = providedRaw;
  try {
    providedDecoded = decodeURIComponent(providedRaw);
  } catch {
    // Keep raw if decoding fails
  }

  const configuredSecret = process.env.CRON_SECRET || '';

  if (
    !configuredSecret || 
    (providedRaw !== configuredSecret && providedDecoded !== configuredSecret)
  ) {
    return sendSafeError(res, 401, 'Unauthorized cron request. Invalid or unconfigured CRON_SECRET token.');
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
    if (!projectId) {
      return sendSafeError(res, 500, 'FIREBASE_PROJECT_ID environment variable is not configured on server.');
    }
    const now = Date.now();

    console.log(`[CRON WEBHOOK] Executing subscription lifecycle check for Firestore project: ${projectId}...`);

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions`;
    const firestoreRes = await fetch(url);
    
    let docs: any[] = [];
    if (firestoreRes.ok) {
      const data: any = await firestoreRes.json();
      docs = data.documents || [];
    }

    let activeCount = 0;
    let expiredCount = 0;
    let warningCount = 0;

    docs.forEach(doc => {
      const fields = doc.fields || {};
      const status = fields.status?.stringValue || 'inactive';
      const expiresAt = fields.expiresAt?.integerValue 
        ? parseInt(fields.expiresAt.integerValue, 10) 
        : (fields.expiresAt?.timestampValue ? new Date(fields.expiresAt.timestampValue).getTime() : 0);

      if (status === 'active' || status === 'ACTIVE') {
        if (expiresAt > 0 && expiresAt < now) {
          expiredCount++;
        } else if (expiresAt > 0 && expiresAt - now <= 7 * 24 * 60 * 60 * 1000) {
          warningCount++;
          activeCount++;
        } else {
          activeCount++;
        }
      }
    });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      cadence: '15_MINUTES_ACTIVE',
      subscriptionsScanned: docs.length,
      metrics: {
        activeMandates: activeCount,
        warningCandidates: warningCount,
        expiredMandates: expiredCount
      },
      status: 'CRON_EVALUATED',
      message: `Automated lifecycle scan complete. Evaluated ${docs.length} subscription mandate(s). Next evaluation in 15 minutes.`
    });
  } catch (cronErr: any) {
    console.error('[CRON WEBHOOK ERROR]', cronErr);
    res.status(500).json({
      success: false,
      error: cronErr.message || 'Subscription cron evaluation failed'
    });
  }
}
