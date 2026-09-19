// scripts/testRazorpayAPI.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let keyId = process.env.VITE_RAZORPAY_KEY_ID || '';
let keySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (match[1] === 'VITE_RAZORPAY_KEY_ID') keyId = value;
      if (match[1] === 'RAZORPAY_KEY_SECRET') keySecret = value;
    }
  });
}

if (!keyId || !keySecret) {
  console.error('❌ VITE_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env');
  process.exit(1);
}

console.log('------------------------------------------------------------');
console.log('💳 TESTING RAZORPAY TEST API CREDENTIALS');
console.log(`🔑 Key ID:     ${keyId}`);
console.log(`🔒 Key Secret: ${keySecret.slice(0, 4)}...${keySecret.slice(-4)}`);
console.log('------------------------------------------------------------\n');

async function testRazorpay() {
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  
  const payload = {
    amount: 11799900, // ₹1,17,999.00 in paise
    currency: 'INR',
    receipt: `rcpt_test_${Date.now()}`,
    notes: {
      strategy: 'Institutional Alpha Flagship',
      test: 'true'
    }
  };

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      console.log('✅ Razorpay Test API Verification SUCCESSFUL!');
      console.log(`   Order ID:  ${data.id}`);
      console.log(`   Amount:    ₹${data.amount / 100}`);
      console.log(`   Currency:  ${data.currency}`);
      console.log(`   Status:    ${data.status}`);
      console.log(`   Receipt:   ${data.receipt}`);
    } else {
      console.error('❌ Razorpay API Rejected:', data);
    }
  } catch (err) {
    console.error('❌ Network / Request Error:', err.message);
  }
}

testRazorpay();
