import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

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
    const now = Date.now();
    console.log('[CRON WEBHOOK] Executing subscription lifecycle check via Firebase Admin SDK...');

    const subsSnap = await adminDb.collection('subscriptions').get();
    
    let activeCount = 0;
    let expiredCount = 0;
    let warningCount = 0;

    subsSnap.docs.forEach(doc => {
      const data = doc.data() || {};
      const status = (data.status || 'inactive').toLowerCase();
      
      let expiresAt = 0;
      if (typeof data.expiresAt === 'number') {
        expiresAt = data.expiresAt;
      } else if (typeof data.expiresAt === 'string') {
        expiresAt = new Date(data.expiresAt).getTime();
      }

      if (status === 'active') {
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
      subscriptionsScanned: subsSnap.size,
      metrics: {
        activeMandates: activeCount,
        warningCandidates: warningCount,
        expiredMandates: expiredCount
      },
      status: 'CRON_EVALUATED',
      message: `Automated lifecycle scan complete. Evaluated ${subsSnap.size} subscription mandate(s). Next evaluation in 15 minutes.`
    });
  } catch (cronErr: any) {
    console.error('[CRON WEBHOOK ERROR]', cronErr);
    res.status(500).json({
      success: false,
      error: cronErr.message || 'Subscription cron evaluation failed'
    });
  }
}
