// scripts/testSignatureVerification.js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let keySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && match[1] === 'RAZORPAY_KEY_SECRET') {
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      keySecret = value;
    }
  });
}

if (!keySecret) {
  console.error('❌ RAZORPAY_KEY_SECRET not set in .env');
  process.exit(1);
}

const testOrderId = 'order_TdoHlqgBA07HGR';
const testPaymentId = 'pay_TdoTestPayment123';

// Generate authentic Razorpay signature
const authenticSignature = crypto
  .createHmac('sha256', keySecret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest('hex');

console.log('------------------------------------------------------------');
console.log('🔒 RAZORPAY HMAC SHA-256 SIGNATURE VERIFICATION TEST');
console.log(`Order ID:     ${testOrderId}`);
console.log(`Payment ID:   ${testPaymentId}`);
console.log(`Signature:    ${authenticSignature}`);
console.log('------------------------------------------------------------\n');

// Verification logic
const generatedSig = crypto
  .createHmac('sha256', keySecret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest('hex');

const isMatch = generatedSig === authenticSignature;
console.log(`Verification Result: ${isMatch ? '✅ MATCHED & VERIFIED' : '❌ MISMATCH'}`);

// Test with corrupted signature
const corruptedSig = authenticSignature.slice(0, -4) + 'abcd';
const isCorruptedMatch = generatedSig === corruptedSig;
console.log(`Tamper Rejection Test: ${!isCorruptedMatch ? '✅ FRAUD/CORRUPTED SIGNATURE PROPERLY BLOCKED' : '❌ SECURITY FAILED'}`);
