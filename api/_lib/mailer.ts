import nodemailer from 'nodemailer';
import { adminDb } from './firebaseAdmin.js';

export interface ServerInvoiceEmailParams {
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  paymentId: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  validityDays: number;
  totalMinor: number;
  priceMinor: number;
  taxMinor: number;
  gatewayFeeMinor: number;
  invoiceNumber: string;
  paymentMode: string;
  paymentMethod: string;
  paidAt: string;
}

export async function sendServerPaymentConfirmationEmail(params: ServerInvoiceEmailParams): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER || '';
  const rawAppPassword = process.env.GMAIL_APP_PASSWORD || '';
  const cleanAppPassword = rawAppPassword.replace(/\s+/g, '');

  if (!gmailUser || !cleanAppPassword) {
    console.warn('[ServerMailer] GMAIL_USER or GMAIL_APP_PASSWORD not configured. Skipping server-side email.');
    return false;
  }

  // Idempotency: Check if email has already been dispatched for this order
  try {
    const orderDoc = await adminDb.collection('orders').doc(params.orderId).get();
    if (orderDoc.exists && orderDoc.data()?.emailSent) {
      console.log(`[ServerMailer] Email already dispatched for order ${params.orderId}. Skipping duplicate.`);
      return true;
    }
  } catch (err) {
    console.warn('[ServerMailer] Failed to check order emailSent flag:', err);
  }

  const appBaseUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://arthresearch.web.app';
  const setupPortfolioUrl = `${appBaseUrl}/setup-portfolio?planId=${params.planId}&subscriptionId=${params.subscriptionId}&orderId=${params.orderId}`;
  const historyUrl = `${appBaseUrl}/history`;

  const totalFormatted = '₹' + (params.totalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const baseFormatted = '₹' + (params.priceMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const taxFormatted = '₹' + (params.taxMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dateFormatted = new Date(params.paidAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const subject = `Payment Confirmed & Mandate Activated • ${params.planName} • [${params.invoiceNumber}]`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; }
    table { border-collapse: collapse; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);">
          <!-- Top Accent Stripe -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #D97706 0%, #0F172A 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px 18px 32px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-family: Georgia, serif; font-size: 19px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px;">ARTH RESEARCH</span>
                    <span style="display: block; font-size: 9.5px; font-family: monospace; color: #D97706; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Quantitative Advisory Desk</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: 600; background-color: #DCFCE7; color: #166534; border: 1px solid #BBF7D0;">
                      PAYMENT CONFIRMED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.3px;">
                Advisory Mandate Active & Confirmed
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Dear <strong>${params.userName || 'Valued Investor'}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
                We have successfully recorded your subscription payment for <strong>${params.planName}</strong>. Your statutory GST Tax Invoice summary has been registered under invoice number <strong>${params.invoiceNumber}</strong>.
              </p>

              <!-- Critical Next Step Box -->
              <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 13px; font-weight: 700; color: #92400E; margin-bottom: 4px;">
                  ⚠️ Required Action: Complete Your Portfolio Setup
                </div>
                <div style="font-size: 12px; color: #78350F; line-height: 1.6; margin-bottom: 12px;">
                  Even if you closed your browser or lost connectivity during payment, your advisory mandate is fully secured. Please log in and submit your executed stock positions to begin research analyst clearance.
                </div>
                <div>
                  <a href="${setupPortfolioUrl}" style="display: inline-block; background-color: #D97706; color: #FFFFFF; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 18px; border-radius: 6px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);">
                    Initialize Portfolio Setup &rarr;
                  </a>
                </div>
              </div>

              <!-- Invoice Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
                <tr style="background-color: #0F172A;">
                  <td style="padding: 10px 16px; font-size: 11px; font-family: monospace; font-weight: 700; color: #F59E0B; text-transform: uppercase;">
                    TAX INVOICE DETAILS
                  </td>
                  <td align="right" style="padding: 10px 16px; font-size: 11px; font-family: monospace; color: #94A3B8;">
                    ${dateFormatted}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B;">Invoice Number</td>
                  <td align="right" style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #0F172A; font-family: monospace;">${params.invoiceNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B;">Subscribed Mandate</td>
                  <td align="right" style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #0F172A;">${params.planName} (${params.validityDays} Days)</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B;">Base Advisory Fee</td>
                  <td align="right" style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #0F172A; font-family: monospace;">${baseFormatted}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B;">GST (18% Statutory)</td>
                  <td align="right" style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #0F172A; font-family: monospace;">${taxFormatted}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B;">Payment Method / Gateway Ref</td>
                  <td align="right" style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #475569; font-family: monospace;">${params.paymentMethod} (${params.paymentId})</td>
                </tr>
                <tr style="background-color: #0F172A;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #FFFFFF;">Total Settled</td>
                  <td align="right" style="padding: 12px 16px; font-size: 15px; font-weight: 700; color: #34D399; font-family: monospace;">${totalFormatted}</td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${setupPortfolioUrl}" style="display: block; background-color: #0F172A; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-align: center; margin-bottom: 10px;">
                      Configure Strategy Portfolio Holdings &rarr;
                    </a>
                    <a href="${historyUrl}" style="display: inline-block; font-size: 11.5px; color: #64748B; text-decoration: underline;">
                      View Invoices & Billing History in Terminal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">
                <strong>Arth Research Private Desk</strong> &bull; Non-Custodial Algorithmic Advisory Services.
              </p>
              <p style="margin: 0;">
                Investment in securities market are subject to market risks. Read all scheme related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Dear ${params.userName || 'Investor'},\n\n` +
    `Your advisory subscription payment for ${params.planName} has been confirmed.\n\n` +
    `Invoice Number: ${params.invoiceNumber}\n` +
    `Amount Paid: ${totalFormatted}\n` +
    `Payment Method: ${params.paymentMethod} (${params.paymentId})\n` +
    `Validity: ${params.validityDays} Days\n\n` +
    `CRITICAL NEXT STEP: Please configure your executed portfolio holdings at:\n` +
    `${setupPortfolioUrl}\n\n` +
    `Arth Research Private Desk`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: cleanAppPassword
      }
    });

    const senderName = process.env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';
    await transporter.sendMail({
      from: `"${senderName}" <${gmailUser}>`,
      to: params.userEmail,
      subject,
      text,
      html
    });

    console.log(`[ServerMailer] Payment confirmation email successfully delivered to ${params.userEmail} for order ${params.orderId}`);

    // Mark email as sent on order doc
    try {
      await adminDb.collection('orders').doc(params.orderId).update({
        emailSent: true,
        emailSentAt: new Date().toISOString()
      });
    } catch {
      // Non-critical update
    }

    return true;
  } catch (error) {
    console.error('[ServerMailer] Failed to send payment confirmation email:', error);
    return false;
  }
}
