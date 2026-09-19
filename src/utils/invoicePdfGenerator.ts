// src/utils/invoicePdfGenerator.ts
import { jsPDF } from 'jspdf';
import { formatINR } from './money';

export interface InvoiceData {
  invoiceNumber: string;
  paymentDate: string;
  paymentId: string;
  orderId?: string;
  userName: string;
  userEmail: string;
  planName: string;
  validityDays: number;
  basePriceMinor: number;
  discountMinor: number;
  discountPercent?: number;
  taxMinor: number;
  gatewayFeeMinor: number;
  totalMinor: number;
}

export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(199, 163, 90); // #C7A35A (Gold Accent Bar)
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Brand Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ARTH RESEARCH', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 163, 90);
  doc.text('INSTITUTIONAL QUANTITATIVE RESEARCH & ADVISORY', margin, 21);

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFontSize(8);
  doc.text('SEBI Registration No: INH00001234 | GSTIN: 27AABCA1234F1Z5', margin, 27);

  // Top Right Invoice Label
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TAX INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Original for Recipient', pageWidth - margin, 21, { align: 'right' });
  doc.text('SAC Code: 998311', pageWidth - margin, 27, { align: 'right' });

  // 2. Metadata Grid (Invoice details & Client details)
  let currentY = 44;

  // Left Box: Billed To
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.roundedRect(margin, currentY, contentWidth / 2 - 4, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth / 2 - 4, 34, 2, 2, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILLED TO (SUBSCRIBER)', margin + 4, currentY + 7);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.userName || 'Valued Client', margin + 4, currentY + 15);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(data.userEmail, margin + 4, currentY + 21);
  doc.text('Verified Identity: Compliant User', margin + 4, currentY + 27);

  // Right Box: Invoice Meta
  const rightBoxX = margin + contentWidth / 2 + 4;
  const rightBoxW = contentWidth / 2 - 4;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightBoxX, currentY, rightBoxW, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, currentY, rightBoxW, 34, 2, 2, 'S');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INVOICE & TRANSACTION DETAILS', rightBoxX + 4, currentY + 7);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  
  doc.text('Invoice Ref:', rightBoxX + 4, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceNumber, rightBoxX + 28, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date of Issue:', rightBoxX + 4, currentY + 20);
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentDate, rightBoxX + 28, currentY + 20);

  doc.setTextColor(71, 85, 105);
  doc.text('Payment Ref:', rightBoxX + 4, currentY + 26);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentId, rightBoxX + 28, currentY + 26);
  doc.setFont('helvetica', 'normal');

  currentY += 42;

  // 3. Line Items Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, contentWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SR', margin + 3, currentY + 5.5);
  doc.text('SERVICE DESCRIPTION & PARTICULARS', margin + 15, currentY + 5.5);
  doc.text('SAC', margin + 110, currentY + 5.5);
  doc.text('VALIDITY', margin + 130, currentY + 5.5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // Line Item Row: Base Plan
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, 14, 'F');
  doc.rect(margin, currentY, contentWidth, 14, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('1', margin + 3, currentY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Quantitative Advisory Mandate: ${data.planName}`, margin + 15, currentY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Systematic research signals, position weights & risk rebalancing telemetry', margin + 15, currentY + 10.5);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('998311', margin + 110, currentY + 6);
  doc.text(`${data.validityDays} Days`, margin + 130, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.basePriceMinor), pageWidth - margin - 3, currentY + 6, { align: 'right' });

  currentY += 14;

  // Line Item: Discount if applicable
  if (data.discountMinor > 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.rect(margin, currentY, contentWidth, 8, 'S');

    doc.setTextColor(22, 101, 52); // Green
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('2', margin + 3, currentY + 5.5);
    doc.text(`Promotional Voucher Concession (${data.discountPercent || 0}% Off)`, margin + 15, currentY + 5.5);
    doc.text('-', margin + 110, currentY + 5.5);
    doc.text('-', margin + 130, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${formatINR(data.discountMinor)}`, pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

    currentY += 8;
  }

  currentY += 4;

  // 4. Calculations Summary (Right-aligned Box)
  const calcBoxW = 90;
  const calcBoxX = pageWidth - margin - calcBoxW;

  const taxableAmountMinor = Math.max(0, data.basePriceMinor - data.discountMinor);

  const calcLines = [
    { label: 'Taxable Service Value:', value: formatINR(taxableAmountMinor), bold: false },
    { label: 'CGST (9%):', value: formatINR(Math.round(data.taxMinor / 2)), bold: false },
    { label: 'SGST / UTGST (9%):', value: formatINR(data.taxMinor - Math.round(data.taxMinor / 2)), bold: false },
    { label: 'Total GST Liability (18%):', value: formatINR(data.taxMinor), bold: false },
    { label: 'Payment Gateway & Tech Surcharge (3%):', value: formatINR(data.gatewayFeeMinor), bold: false },
    { label: 'Total Paid & Settled:', value: formatINR(data.totalMinor), bold: true, isTotal: true }
  ];

  calcLines.forEach((line) => {
    if (line.isTotal) {
      doc.setFillColor(15, 23, 42);
      doc.rect(calcBoxX, currentY, calcBoxW, 9, 'F');
      doc.setTextColor(199, 163, 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(line.label, calcBoxX + 3, currentY + 6);
      doc.text(line.value, pageWidth - margin - 3, currentY + 6, { align: 'right' });
      currentY += 11;
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
      doc.setFontSize(8);
      doc.text(line.label, calcBoxX + 3, currentY + 4);
      doc.setTextColor(15, 23, 42);
      doc.text(line.value, pageWidth - margin - 3, currentY + 4, { align: 'right' });
      currentY += 6;
    }
  });

  // Left Box: Payment Status Stamp & Regulatory Certification
  const stampY = currentY - (calcLines.length * 6 + 15);
  doc.setFillColor(240, 253, 244); // Green tint
  doc.roundedRect(margin, stampY, contentWidth - calcBoxW - 8, 36, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, stampY, contentWidth - calcBoxW - 8, 36, 2, 2, 'S');

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('✔ PAYMENT VERIFIED & SETTLED', margin + 4, stampY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Payment Gateway: Razorpay Standard Checkout', margin + 4, stampY + 14);
  doc.text(`Gateway Reference ID: ${data.paymentId}`, margin + 4, stampY + 19);
  doc.text('Settlement Method: UPI / Netbanking / Credit & Debit Card', margin + 4, stampY + 24);
  doc.text('Mandate Status: Cleared for Analyst Verification', margin + 4, stampY + 29);

  // 5. Statutory Disclaimers & Signoff
  const footerY = pageHeight - 38;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STATUTORY DISCLOSURE & MANDATE TERMS:', margin, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '1. Arth Research is registered with SEBI as a Research Analyst (Reg: INH00001234). All recommendations are algorithmic and quantitative.',
    margin,
    footerY + 9.5
  );
  doc.text(
    '2. Advisory fees are non-refundable once mandate model signals are provisioned. Client assets remain 100% self-custodied in their verified Demat account.',
    margin,
    footerY + 13.5
  );
  doc.text(
    '3. This is a computer-generated statutory Tax Invoice issued under Section 31 of the CGST Act, 2017 and requires no physical signature.',
    margin,
    footerY + 17.5
  );

  // Bottom Copyright Strip
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('Arth Research Private Desk • support@arthresearch.com • https://arthresearch.web.app', pageWidth / 2, pageHeight - 4, {
    align: 'center'
  });

  return doc;
}

export function getInvoicePdfBase64(data: InvoiceData): string {
  const doc = generateInvoicePdf(data);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1]; // returns raw base64 string
}

export function downloadInvoicePdf(data: InvoiceData, filename?: string): void {
  const doc = generateInvoicePdf(data);
  doc.save(filename || `tax_invoice_${data.invoiceNumber}.pdf`);
}
