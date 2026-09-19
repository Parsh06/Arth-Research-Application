// scripts/dispatchAllTestEmails.js
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
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

const gmailUser = env.GMAIL_USER || 'jainparsh06@gmail.com';
const gmailPassword = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''); // strip spaces in app password
const senderName = env.VITE_EMAIL_SENDER_NAME || 'Arth Research Private Desk';
const recipient = 'jainparsh06@gmail.com';

console.log('------------------------------------------------------------');
console.log('🚀 ARTH RESEARCH INSTITUTIONAL EMAIL TEST DISPATCHER');
console.log(`📧 Sender:    ${senderName} <${gmailUser}>`);
console.log(`🎯 Recipient: ${recipient}`);
console.log('------------------------------------------------------------\n');

if (!gmailUser || !gmailPassword) {
  console.error('❌ Error: GMAIL_USER or GMAIL_APP_PASSWORD missing in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPassword
  }
});

// Import the catalog from built/compiled template source
import { EMAIL_TEMPLATES_CATALOG } from '../src/templates/emails/index.ts';

async function run() {
  console.log(`Found ${EMAIL_TEMPLATES_CATALOG.length} templates to dispatch.\n`);
  
  let successCount = 0;
  let failCount = 0;

  for (const template of EMAIL_TEMPLATES_CATALOG) {
    const { subject, html } = template.generateSample(recipient);
    console.log(`[${template.number}/17] Dispatching: [${template.category}] ${template.title}...`);
    
    try {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${gmailUser}>`,
        to: recipient,
        subject: subject,
        html: html
      });
      console.log(`   ✅ Sent! Message ID: ${info.messageId}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failCount++;
    }

    // Small delay between sends to respect Gmail rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n============================================================');
  console.log(`🏁 DISPATCH SUMMARY:`);
  console.log(`   ✅ Successfully Delivered: ${successCount}`);
  console.log(`   ❌ Failed:                 ${failCount}`);
  console.log('============================================================\n');
}

run().catch(console.error);
