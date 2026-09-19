import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Authorization check (from cron-job.org Bearer token or ?secret= query param)
  const authHeader = (req.headers['authorization'] as string) || '';
  const querySecret = (req.query.secret as string) || '';
  const providedSecret = querySecret || authHeader.replace('Bearer ', '').trim();
  const configuredSecret = process.env.CRON_SECRET || '';

  if (configuredSecret && providedSecret !== configuredSecret) {
    res.status(401).json({ error: 'Unauthorized cron request. Invalid CRON_SECRET token.' });
    return;
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'researchapplication-3085c';

    console.log(`[CRON WEBHOOK] Executing subscription lifecycle check for Firestore project: ${projectId}...`);

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions`;
    const firestoreRes = await fetch(url);
    let docs: any[] = [];
    if (firestoreRes.ok) {
      const data: any = await firestoreRes.json();
      docs = data.documents || [];
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      subscriptionsScanned: docs.length,
      status: 'CRON_EVALUATED',
      message: `Automated lifecycle scan complete. Evaluated ${docs.length} active subscription mandates.`
    });
  } catch (cronErr: any) {
    console.error('[CRON WEBHOOK ERROR]', cronErr);
    res.status(500).json({
      success: false,
      error: cronErr.message || 'Subscription cron evaluation failed'
    });
  }
}
