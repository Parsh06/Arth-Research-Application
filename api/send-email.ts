import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  try {
    const { to, subject, html, text, fromName, attachments } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      res.status(400).json({ error: 'Missing required parameters (to, subject, html or text)' });
      return;
    }

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
