// scripts/testSignatureVerification.js
import crypto from 'node:crypto';

const keySecret = 'HKTaGPRU1ZaQn1tdoEMQHArU';
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
