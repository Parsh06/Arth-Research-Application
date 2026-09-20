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
          const projectId = env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
          if (!projectId) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'VITE_FIREBASE_PROJECT_ID environment variable is missing' }));
            return;
          }

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

      server.middlewares.use('/api/razorpay/fetch-payment', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const urlParams = new URL(req.url || '', 'http://localhost').searchParams;
          const rawId = (urlParams.get('paymentId') || urlParams.get('orderId') || '').trim();

          if (!rawId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Valid paymentId (pay_xxx) or orderId (order_xxx) is required' }));
            return;
          }

          const keyId = env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
          const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

          if (!keyId || !keySecret) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Razorpay API credentials not configured in .env' }));
            return;
          }

          const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

          let p: any;

          if (rawId.startsWith('order_')) {
            const orderPaymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${rawId}/payments`, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });

            const orderPaymentsData: any = await orderPaymentsRes.json();
            if (!orderPaymentsRes.ok) {
              res.statusCode = orderPaymentsRes.status;
              res.end(JSON.stringify({
                error: orderPaymentsData.error?.description || 'Failed to fetch payments for order',
                details: orderPaymentsData
              }));
              return;
            }

            const items: any[] = orderPaymentsData.items || [];
            if (items.length === 0) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `No payment attempts found on Razorpay for order ${rawId}` }));
              return;
            }

            p = items.find((item: any) => item.status === 'captured') ||
                items.find((item: any) => item.status === 'authorized') ||
                items[0];
          } else {
            const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${rawId}`, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });

            p = await rzpResponse.json();

            if (!rzpResponse.ok) {
              res.statusCode = rzpResponse.status;
              res.end(JSON.stringify({
                error: p.error?.description || 'Failed to fetch payment details',
                details: p
              }));
              return;
            }
          }

          const method: string = p.method || 'unknown';

          const normaliseMode = (m: string) => {
            const map: Record<string, string> = {
              card: 'CARD',
              upi: 'UPI',
              netbanking: 'NETBANKING',
              wallet: 'WALLET',
              emi: 'EMI',
              nach: 'NACH',
              cardless_emi: 'CARDLESS EMI'
            };
            return map[m] || (m ? m.toUpperCase() : 'UNKNOWN');
          };

          const buildLabel = (obj: any) => {
            switch (obj.method) {
              case 'card': {
                const network = obj.card?.network || 'Card';
                const last4 = obj.card?.last4 ? ` •••• ${obj.card.last4}` : '';
                const type = obj.card?.type ? ` (${obj.card.type})` : '';
                return `${network}${last4}${type}`;
              }
              case 'upi':
                return obj.vpa ? `UPI — ${obj.vpa}` : 'UPI';
              case 'netbanking':
                return obj.bank ? `Net Banking — ${obj.bank}` : 'Net Banking';
              case 'wallet':
                return obj.wallet ? `Wallet — ${obj.wallet}` : 'Wallet';
              case 'emi':
                return obj.bank ? `EMI — ${obj.bank}` : 'EMI';
              default:
                return obj.method ? obj.method.replace(/_/g, ' ').toUpperCase() : 'Unknown';
            }
          };

          const result = {
            success: true,
            paymentId: p.id,
            orderId: p.order_id || '',
            method,
            status: p.status,
            captured: p.captured || false,
            international: p.international || false,
            amountMinor: p.amount,
            currency: p.currency || 'INR',
            amountRefundedMinor: p.amount_refunded || 0,
            refundStatus: p.refund_status || null,
            paymentMode: normaliseMode(method),
            paymentMethod: buildLabel(p),
            customerEmail: p.email || '',
            customerContact: p.contact || '',
            bank: p.bank || '',
            wallet: p.wallet || '',
            vpa: p.vpa || '',
            cardNetwork: p.card?.network || '',
            cardLast4: p.card?.last4 || '',
            cardName: p.card?.name || '',
            cardIssuer: p.card?.issuer || '',
            cardType: p.card?.type || '',
            cardSubType: p.card?.sub_type || '',
            cardInternational: p.card?.international || false,
            cardEmi: p.card?.emi || false,
            emiDuration: p.emi_duration || null,
            emiPlan: p.emi_plan ? {
              issuer: p.emi_plan.issuer,
              duration: p.emi_plan.duration,
              interest: p.emi_plan.interest,
              type: p.emi_plan.type
            } : null,
            razorpayFeeMinor: p.fee || 0,
            razorpayTaxMinor: p.tax || 0,
            acquirerData: {
              authCode: p.acquirer_data?.auth_code || '',
              bankTransactionId: p.acquirer_data?.bank_transaction_id || '',
              rrn: p.acquirer_data?.rrn || '',
              upiTransactionId: p.acquirer_data?.upi_transaction_id || '',
              vpaTxnId: p.acquirer_data?.vpa_txn_id || ''
            },
            errorCode: p.error_code || '',
            errorDescription: p.error_description || '',
            errorSource: p.error_source || '',
            errorStep: p.error_step || '',
            errorReason: p.error_reason || '',
            razorpayCreatedAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : ''
          };

          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (fetchErr: any) {
          console.error('[RAZORPAY FETCH PAYMENT SERVER ERROR]', fetchErr);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: fetchErr.message || 'Internal server error while fetching payment' }));
        }
      });

      server.middlewares.use('/api/razorpay/refund', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { paymentId, amountMinor, reason } = JSON.parse(body || '{}');

            if (!paymentId || !paymentId.startsWith('pay_')) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Valid paymentId (pay_xxx) is required' }));
              return;
            }

            const keyId = env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
            const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

            if (!keyId || !keySecret) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Razorpay API credentials not configured in .env' }));
              return;
            }

            const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const refundBody: Record<string, any> = { speed: 'normal' };
            if (amountMinor && amountMinor > 0) refundBody.amount = Math.round(amountMinor);
            if (reason) refundBody.notes = { reason };

            const rzpRefundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
              method: 'POST',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify(refundBody)
            });

            const refundData: any = await rzpRefundRes.json();
            if (!rzpRefundRes.ok) {
              res.statusCode = rzpRefundRes.status;
              res.end(JSON.stringify({
                error: refundData.error?.description || 'Refund request failed',
                details: refundData
              }));
              return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              refundId: refundData.id,
              paymentId: refundData.payment_id,
              amountMinor: refundData.amount,
              currency: refundData.currency,
              status: refundData.status,
              speed: refundData.speed_processed || refundData.speed_requested,
              createdAt: refundData.created_at ? new Date(refundData.created_at * 1000).toISOString() : ''
            }));
          } catch (refundErr: any) {
            console.error('[RAZORPAY REFUND SERVER ERROR]', refundErr);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: refundErr.message || 'Internal server error while processing refund' }));
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
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
            }
          }
        }
      }
    },
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : {},
  };
});

