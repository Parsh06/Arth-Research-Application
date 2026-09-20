import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { applyCors, parseRequestBody, sendSafeError } from './_lib/security.js';
import { sendEmailSchema } from './_lib/schemas.js';
import { requireAuth } from './_lib/auth.js';

// Simple in-memory rate limiting map for email dispatch (per IP, 1-minute window)
const emailRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  // Zero-Trust Authentication Guard
  const user = await requireAuth(req, res);
  if (!user) {
    return; // Response already handled with 401
  }

  // Rate limiting check
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const clientRate = emailRateLimitMap.get(clientIp);

  if (clientRate && now < clientRate.resetAt) {
    if (clientRate.count >= 15) {
      return sendSafeError(res, 429, 'Too many email dispatch requests. Please wait a minute before retrying.');
    }
    clientRate.count++;
  } else {
    emailRateLimitMap.set(clientIp, { count: 1, resetAt: now + 60 * 1000 });
  }

  try {
    const rawBody = parseRequestBody(req.body);
    const parseResult = sendEmailSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return sendSafeError(res, 400, `Invalid email payload: ${issueMsg}`);
    }

    const { to, subject, html, text, fromName, attachments } = parseResult.data;

    const gmailUser = process.env.GMAIL_USER || '';
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';
    const senderName = fromName || process.env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';

    if (!gmailUser || !gmailAppPassword) {
      console.warn('[EMAIL WARNING] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment.');
      res.status(200).json({
        success: true,
        mocked: true,
        message: 'Email dispatch simulated. Set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel environment variables for live delivery.',
        recipient: to,
        subject
      });
      return;
    }

    // Clean any whitespace from the 16-character app password
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
      ...(attachments && Array.isArray(attachments) ? { attachments } : {})
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Delivered to ${to} (MessageID: ${info.messageId})`);

    res.status(200).json({
      success: true,
      mocked: false,
      messageId: info.messageId,
      recipient: to,
      subject
    });
  } catch (err: any) {
    console.error('[EMAIL DISPATCH ERROR]', err);
    res.status(500).json({
      error: 'Failed to dispatch email',
      details: err?.message || String(err)
    });
  }
}
