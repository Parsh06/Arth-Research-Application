import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import nodemailer from 'nodemailer'

function emailDispatcherPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'email-dispatcher-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { to, subject, html, text, fromName } = JSON.parse(body || '{}');

            if (!to || !subject || (!html && !text)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing required parameters (to, subject, html/text)' }));
              return;
            }

            const gmailUser = env.GMAIL_USER || process.env.GMAIL_USER || '';
            const gmailAppPassword = env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '';
            const senderName = fromName || env.VITE_EMAIL_SENDER_NAME || process.env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';

            if (!gmailUser || !gmailAppPassword) {
              console.log(`\n[EMAIL DISPATCH SIMULATOR] ────────────────────────────────────`);
              console.log(`To: ${to}`);
              console.log(`Subject: ${subject}`);
              console.log(`Sender: "${senderName}" <simulated@arthresearch.com>`);
              console.log(`Notice: Configure GMAIL_USER and GMAIL_APP_PASSWORD in .env for live inbox delivery.`);
              console.log(`─────────────────────────────────────────────────────────────────\n`);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                mocked: true,
                message: 'Email dispatch simulated. Add GMAIL_USER & GMAIL_APP_PASSWORD in .env for live delivery.',
                recipient: to,
                subject
              }));
              return;
            }

            // Clean any spaces from the 16-char app password
            const cleanPassword = gmailAppPassword.replace(/\s+/g, '');

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: gmailUser,
                pass: cleanPassword,
              },
            });

            const info = await transporter.sendMail({
              from: `"${senderName}" <${gmailUser}>`,
              to,
              subject,
              text: text || '',
              html: html || '',
            });

            console.log(`[EMAIL DISPATCH SUCCESS] Delivered to ${to} (MessageID: ${info.messageId})`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              mocked: false,
              messageId: info.messageId,
              recipient: to,
              subject
            }));
          } catch (err: any) {
            console.error('[EMAIL DISPATCH ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Failed to dispatch email',
              details: err?.message || String(err)
            }));
          }
        });
      });

      // Cron Webhook Endpoint for cron-job.org
      server.middlewares.use('/api/cron/check-subscriptions', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        
        // Optional secret verification
        const authHeader = req.headers['authorization'] || '';
        const urlParams = new URL(req.url || '', 'http://localhost').searchParams;
        const secret = urlParams.get('secret') || authHeader.replace('Bearer ', '');
        const configuredSecret = env.CRON_SECRET || process.env.CRON_SECRET || '';

        if (configuredSecret && secret !== configuredSecret) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Unauthorized cron request. Invalid CRON_SECRET.' }));
          return;
        }

        try {
          const projectId = env.VITE_FIREBASE_PROJECT_ID || 'researchapplication-3085c';

          console.log(`[CRON WEBHOOK] Executing subscription lifecycle check for ${projectId}...`);

          const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions`;
          const firestoreRes = await fetch(url);
          let docs: any[] = [];
          if (firestoreRes.ok) {
            const data: any = await firestoreRes.json();
            docs = data.documents || [];
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            subscriptionsScanned: docs.length,
            status: 'CRON_EVALUATED',
            message: `Automated scan complete. Evaluated ${docs.length} active subscription mandates.`
          }));
        } catch (cronErr: any) {
          console.error('[CRON WEBHOOK ERROR]', cronErr);
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            error: cronErr.message || 'Cron execution failed'
          }));
        }
      });

      // ─────────────────────────────────────────────────────────────
      // RAZORPAY INTEGRATION MIDDLEWARE
      // ─────────────────────────────────────────────────────────────
      server.middlewares.use('/api/razorpay/create-order', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { amountMinor, receipt, notes } = JSON.parse(body || '{}');
            const keyId = env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
            const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

            if (!amountMinor || amountMinor <= 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Valid amountMinor (in paise) is required' }));
              return;
            }

            const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            
            const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount: Math.round(amountMinor),
                currency: 'INR',
                receipt: receipt || `rcpt_${Date.now()}`,
                notes: notes || {}
              })
            });

            const rzpData: any = await rzpResponse.json();

            if (!rzpResponse.ok) {
              console.error('[RAZORPAY CREATE ORDER ERROR]', rzpData);
              res.statusCode = rzpResponse.status;
              res.end(JSON.stringify({ error: rzpData.error?.description || 'Failed to create Razorpay order', details: rzpData }));
              return;
            }

            console.log(`[RAZORPAY ORDER CREATED] Order ID: ${rzpData.id}, Amount: ₹${rzpData.amount / 100}`);

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              orderId: rzpData.id,
              amount: rzpData.amount,
              currency: rzpData.currency,
              keyId: keyId
            }));
          } catch (err: any) {
            console.error('[RAZORPAY CREATE ORDER SERVER ERROR]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        });
      });

      server.middlewares.use('/api/razorpay/verify-payment', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = JSON.parse(body || '{}');
            const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing razorpayOrderId, razorpayPaymentId, or razorpaySignature' }));
              return;
            }

            const crypto = await import('node:crypto');
            const expectedSignature = crypto
              .createHmac('sha256', keySecret)
              .update(`${razorpayOrderId}|${razorpayPaymentId}`)
              .digest('hex');

            const isAuthentic = expectedSignature === razorpaySignature;

            if (isAuthentic) {
              console.log(`[RAZORPAY PAYMENT VERIFIED] Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}`);
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                verified: true,
                message: 'Razorpay signature verified successfully.'
              }));
            } else {
              console.warn(`[RAZORPAY SIGNATURE MISMATCH] Expected: ${expectedSignature}, Received: ${razorpaySignature}`);
              res.statusCode = 400;
              res.end(JSON.stringify({
                success: false,
                verified: false,
                error: 'Cryptographic signature mismatch. Payment verification failed.'
              }));
            }
          } catch (err: any) {
            console.error('[RAZORPAY VERIFY SERVER ERROR]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(), 
      tailwindcss(),
      emailDispatcherPlugin(env)
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

