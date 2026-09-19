// scripts/runSubscriptionCron.js
/**
 * Standalone Automated Cron Runner for Subscription Lifecycles
 * Compatible with cron-job.org, Node cron, or GitHub Actions.
 * Queries Firestore via REST API, identifies 7-day warnings & expired mandates,
 * pulls verified investor names and emails from Firestore, and dispatches via Gmail SMTP.
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || 'researchapplication-3085c';
const GMAIL_USER = env.GMAIL_USER || 'jainparsh06@gmail.com';
const GMAIL_PASS = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const SENDER_NAME = env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';
const APP_URL = env.VITE_APP_URL || 'https://arthresearch.com';

import { buildSubscriptionExpiryWarningEmail, buildSubscriptionExpiredEmail } from '../src/templates/emails/billingTemplates.ts';

async function main() {
  console.log('------------------------------------------------------------');
  console.log(`⏰ ARTH RESEARCH SUBSCRIPTION CRON EXECUTION: ${new Date().toISOString()}`);
  console.log(`📡 Project ID:  ${PROJECT_ID}`);
  console.log(`📧 Dispatcher:  ${SENDER_NAME} <${GMAIL_USER}>`);
  console.log('------------------------------------------------------------\n');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/subscriptions`;
  
  let docs = [];
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      docs = data.documents || [];
    } else {
      console.log(`[Cron] Firestore REST API returned status ${res.status}. Checking local / empty catalog.`);
    }
  } catch (err) {
    console.warn(`[Cron] Could not query Firestore REST:`, err.message);
  }

  console.log(`Scanned ${docs.length} subscription records in Firestore.`);
  let warningsCount = 0;
  let expiredCount = 0;

  for (const doc of docs) {
    const fields = doc.fields || {};
    const subId = doc.name.split('/').pop();
    const userId = fields.userId?.stringValue;
    const planName = fields.planName?.stringValue || 'Institutional Strategy';
    const status = fields.status?.stringValue || 'active';
    const expiresAt = Number(fields.expiresAt?.integerValue || fields.expiresAt?.doubleValue || 0);
    const warningSent = fields.warningEmailSentAt?.stringValue;
    const expiredSent = fields.expiredNoticeSentAt?.stringValue;

    if (!userId || !expiresAt) continue;

    const now = Date.now();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    // Fetch user details from Firestore REST
    let userEmail = '';
    let userName = 'Valued Investor';

    try {
      const userRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`);
      if (userRes.ok) {
        const uData = await userRes.json();
        userEmail = uData.fields?.email?.stringValue || '';
        userName = uData.fields?.displayName?.stringValue || 'Valued Investor';
      }
    } catch (e) {
      console.warn(`[Cron] Could not fetch user ${userId}:`, e.message);
    }

    if (!userEmail) continue;

    // 1. Check 7-Day Warning
    if (status === 'active' && daysLeft > 0 && daysLeft <= 7 && !warningSent) {
      const formattedExpiry = new Date(expiresAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const email = buildSubscriptionExpiryWarningEmail({
        userName,
        planName,
        expiryDateFormatted: `${formattedExpiry} (${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining)`,
        renewalUrl: `${APP_URL}/plans`
      });

      await transporter.sendMail({
        from: `"${SENDER_NAME}" <${GMAIL_USER}>`,
        to: userEmail,
        subject: email.subject,
        html: email.html
      });

      console.log(`   ✅ Sent 7-Day Warning to ${userEmail} (${planName})`);
      warningsCount++;
    }

    // 2. Check Expired Notice
    if (now >= expiresAt && (status === 'active' || !expiredSent)) {
      const formattedExpired = new Date(expiresAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (!expiredSent) {
        const email = buildSubscriptionExpiredEmail({
          userName,
          planName,
          expiredDateFormatted: formattedExpired,
          renewalUrl: `${APP_URL}/plans`
        });

        await transporter.sendMail({
          from: `"${SENDER_NAME}" <${GMAIL_USER}>`,
          to: userEmail,
          subject: email.subject,
          html: email.html
        });

        console.log(`   ✅ Sent Expired Notice to ${userEmail} (${planName})`);
        expiredCount++;
      }
    }
  }

  console.log('\n============================================================');
  console.log(`🏁 CRON EXECUTION COMPLETE:`);
  console.log(`   - Subscriptions Scanned: ${docs.length}`);
  console.log(`   - 7-Day Warnings Sent:   ${warningsCount}`);
  console.log(`   - Expired Notices Sent:  ${expiredCount}`);
  console.log('============================================================\n');
}

main().catch(console.error);
