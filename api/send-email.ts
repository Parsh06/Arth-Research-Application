import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { applyCors, parseRequestBody, sendSafeError } from './_lib/security.js';
import { sendEmailSchema } from './_lib/schemas.js';
import { requireAuth } from './_lib/auth.js';

// In-memory rate limiting map for email dispatch (per IP, 1-minute window)
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
    if (clientRate.count >= 25) {
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

    // ANTI-OPEN-RELAY GUARD: Non-admins can only send emails to themselves or official support inboxes
    const userRole = user.role || 'user';
    const isAdmin = ['super_admin', 'admin', 'research_admin', 'support_admin'].includes(userRole);
    
    const authorizedSupportEmails = [
      (process.env.SUPPORT_EMAIL || '').toLowerCase().trim(),
      (process.env.GMAIL_USER || '').toLowerCase().trim(),
      (process.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
      'support@arthadvisory.com',
      'support@arthresearch.com',
      'admin@arthresearch.com',
      'jainparsh06@gmail.com'
    ].filter(Boolean);

    if (!isAdmin) {
      const targetEmail = to.toLowerCase().trim();
      const userOwnEmail = (user.email || '').toLowerCase().trim();
      const isSendingToSelf = Boolean(userOwnEmail && targetEmail === userOwnEmail);
      const isSendingToSupport = authorizedSupportEmails.includes(targetEmail);

      if (!isSendingToSelf && !isSendingToSupport) {
        return sendSafeError(res, 403, 'Forbidden: Non-administrative accounts may only dispatch notifications to their own registered email or the official support desk.');
      }
    }

    const gmailUser = process.env.GMAIL_USER || '';
    const rawAppPassword = process.env.GMAIL_APP_PASSWORD || '';
    const cleanAppPassword = rawAppPassword.replace(/\s+/g, '');
    const senderName = fromName || process.env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';

    if (!gmailUser || !cleanAppPassword) {
      console.warn('[EMAIL WARNING] GMAIL_USER or GMAIL_APP_PASSWORD not set in environment.');
      res.status(200).json({
        success: true,
        mocked: true,
        message: 'Email dispatch simulated. Set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables for live delivery.',
        recipient: to,
        subject
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: cleanAppPassword
      }
    });

    const mailOptions: any = {
      from: `"${senderName}" <${gmailUser}>`,
      to,
      subject,
      text: text || '',
      html: html || undefined
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        encoding: att.content.length > 500 && !att.content.includes('\n') ? 'base64' : undefined
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCHED] ID: ${info.messageId} -> ${to} [${subject}]`);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      recipient: to
    });
  } catch (err: any) {
    console.error('[EMAIL ERROR]', err);
    res.status(500).json({ error: err.message || 'Internal server error during email dispatch' });
  }
}
