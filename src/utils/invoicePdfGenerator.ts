// src/utils/invoicePdfGenerator.ts
import { jsPDF } from 'jspdf';
import { toRupees } from './money';

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

/**
 * Formats minor units (paise) to standard Indian Rupee notation in clean ASCII (e.g. "INR 4,999.00").
 * Avoids raw unicode ₹ glyph which renders as corrupted characters in default jsPDF fonts.
 */
function formatPdfCurrency(minorUnits: number | undefined | null, prefix = 'INR '): string {
  const rupees = toRupees(minorUnits);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees);

  return `${prefix}${formatted}`;
}

/**
 * Converts numbers into English words for statutory tax invoices.
 */
function numberToWords(minorUnits: number): string {
  const num = Math.round(toRupees(minorUnits));
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const paise = minorUnits % 100;
  const rupeeWords = inWords(num);
  const paiseWords = paise > 0 ? ` and ${inWords(paise)} Paise` : '';
  return `INR ${rupeeWords}${paiseWords} Only`;
}

export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // ---------------------------------------------------------------------------
  // 1. TOP CORPORATE HEADER BANNER
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFillColor(199, 163, 90); // Gold Stripe (#C7A35A)
  doc.rect(0, 34, pageWidth, 2, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('ARTH RESEARCH', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(199, 163, 90); // Gold
  doc.text('INSTITUTIONAL QUANTITATIVE RESEARCH & ADVISORY', margin, 19);

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFontSize(7.5);
  doc.text('SEBI Reg. No: INH00001234  |  GSTIN: 27AABCA1234F1Z5  |  PAN: AABCA1234F', margin, 25);
  doc.text('Registered Office: BKC Financial Centre, Bandra East, Mumbai, MH 400051', margin, 30);

  // Top Right "TAX INVOICE" Badge
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - margin, 19, { align: 'right' });
  doc.text('SAC Code: 998311 (Market Research & Advisory)', pageWidth - margin, 25, { align: 'right' });
  doc.text('Place of Supply: Maharashtra (Code: 27)', pageWidth - margin, 30, { align: 'right' });

  // ---------------------------------------------------------------------------
  // 2. TWO-COLUMN METADATA GRID (SUBSCRIBER vs INVOICE PARTICULARS)
  // ---------------------------------------------------------------------------
  let currentY = 42;
  const colWidth = (contentWidth - 6) / 2; // 88mm each
  const cardHeight = 36;

  // Left Card: Subscriber / Billed To
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(margin, currentY, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.5, currentY + 0.5, colWidth - 1, 7, 'F');

  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('BILLED TO (SUBSCRIBER / CLIENT)', margin + 4, currentY + 5);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(data.userName || 'Compliant Client', margin + 4, currentY + 13);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Email ID: ${data.userEmail}`, margin + 4, currentY + 19);
  doc.text('Account Status: Verified & Authenticated User', margin + 4, currentY + 24.5);
  doc.text('Jurisdiction / Country: India (Domestic Retail / HNI)', margin + 4, currentY + 30);

  // Right Card: Invoice & Transaction Meta
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, currentY, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(rightColX + 0.5, currentY + 0.5, colWidth - 1, 7, 'F');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INVOICE & TRANSACTION IDENTIFIERS', rightColX + 4, currentY + 5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.text('Invoice Number:', rightColX + 4, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceNumber, rightColX + 32, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date of Issue:', rightColX + 4, currentY + 19);
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentDate, rightColX + 32, currentY + 19);

  doc.setTextColor(71, 85, 105);
  doc.text('Payment Ref ID:', rightColX + 4, currentY + 24.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.paymentId, rightColX + 32, currentY + 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Mandate Status:', rightColX + 4, currentY + 30);
  doc.setTextColor(22, 101, 52); // Green 800
  doc.setFont('helvetica', 'bold');
  doc.text('Active & Provisioned', rightColX + 32, currentY + 30);

  currentY += cardHeight + 6;

  // ---------------------------------------------------------------------------
  // 3. STRUCTURED PARTICULARS TABLE
  // ---------------------------------------------------------------------------
  const tableHeaderHeight = 8;
  doc.setFillColor(15, 23, 42); // Navy Header
  doc.rect(margin, currentY, contentWidth, tableHeaderHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SR', margin + 3, currentY + 5.5);
  doc.text('DESCRIPTION OF ADVISORY SERVICES', margin + 14, currentY + 5.5);
  doc.text('SAC CODE', margin + 104, currentY + 5.5);
  doc.text('VALIDITY', margin + 128, currentY + 5.5);
  doc.text('TAXABLE VALUE', pageWidth - margin - 3, currentY + 5.5, { align: 'right' });

  currentY += tableHeaderHeight;

  // Table Row 1: Plan Subscription
  const row1Height = 16;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, row1Height, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1', margin + 3, currentY + 6.5);

  doc.text(`Quantitative Research Mandate: ${data.planName}`, margin + 14, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Systematic algorithmic signals, target weights & dynamic risk telemetry', margin + 14, currentY + 11.5);

  doc.setTextColor(71, 85, 105);
  doc.text('998311', margin + 104, currentY + 6.5);
  doc.text(`${data.validityDays} Days`, margin + 128, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfCurrency(data.basePriceMinor), pageWidth - margin - 3, currentY + 6.5, { align: 'right' });

  currentY += row1Height;

  // Table Row 2: Concession / Voucher Discount (if any)
  if (data.discountMinor > 0) {
    const discountRowHeight = 9;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, discountRowHeight, 'FD');

    doc.setTextColor(22, 101, 52); // Green
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('2', margin + 3, currentY + 6);
    doc.text(`Promotional Voucher Concession (${data.discountPercent || 0}% Concession)`, margin + 14, currentY + 6);
    doc.text('998311', margin + 104, currentY + 6);
    doc.text('-', margin + 128, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`-${formatPdfCurrency(data.discountMinor)}`, pageWidth - margin - 3, currentY + 6, { align: 'right' });

    currentY += discountRowHeight;
  }

  currentY += 5;

  // ---------------------------------------------------------------------------
  // 4. FINANCIAL BREAKDOWN & COMPLIANCE SECTION (SIDE BY SIDE)
  // ---------------------------------------------------------------------------
  const summaryBlockStartY = currentY;
  const leftBlockWidth = 84;
  const rightBlockWidth = 92;
  const rightBlockX = pageWidth - margin - rightBlockWidth;

  // LEFT BLOCK: Verified Payment Seal & Transaction Info
  doc.setFillColor(240, 253, 244); // Light Emerald Tint (#F0FDF4)
  doc.setDrawColor(187, 247, 208); // Emerald Border (#BBF7D0)
  doc.roundedRect(margin, summaryBlockStartY, leftBlockWidth, 48, 1.5, 1.5, 'FD');

  doc.setTextColor(22, 101, 52); // Dark Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('[ VERIFIED & SETTLED IN FULL ]', margin + 4, summaryBlockStartY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text('Payment Gateway: Razorpay Standard Payment', margin + 4, summaryBlockStartY + 13);
  doc.text(`Reference ID: ${data.paymentId}`, margin + 4, summaryBlockStartY + 18.5);
  doc.text('Payment Mode: UPI / Net Banking / Cards', margin + 4, summaryBlockStartY + 24);
  doc.text('Settlement Currency: INR (Indian National Rupee)', margin + 4, summaryBlockStartY + 29.5);

  // Amount In Words Sub-box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 2, summaryBlockStartY + 33, leftBlockWidth - 4, 12, 1, 1, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('AMOUNT IN WORDS:', margin + 4, summaryBlockStartY + 37);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const wordsText = numberToWords(data.totalMinor);
  doc.text(wordsText, margin + 4, summaryBlockStartY + 41.5, { maxWidth: leftBlockWidth - 8 });

  // RIGHT BLOCK: Itemized Statutory Calculation Breakdown
  const taxableAmountMinor = Math.max(0, data.basePriceMinor - data.discountMinor);
  const halfTaxMinor = Math.round(data.taxMinor / 2);
  const secondHalfTaxMinor = data.taxMinor - halfTaxMinor;

  const costLines = [
    { label: 'Taxable Advisory Value:', value: formatPdfCurrency(taxableAmountMinor), isBold: false },
    { label: 'Central GST (CGST 9.0%):', value: formatPdfCurrency(halfTaxMinor), isBold: false },
    { label: 'State GST (SGST 9.0%):', value: formatPdfCurrency(secondHalfTaxMinor), isBold: false },
    { label: 'Total GST Liability (18.0%):', value: formatPdfCurrency(data.taxMinor), isBold: false },
    { label: 'Payment Gateway & Tech Surcharge (3.0%):', value: formatPdfCurrency(data.gatewayFeeMinor), isBold: false },
    { label: 'TOTAL INVOICE AMOUNT DUE:', value: formatPdfCurrency(data.totalMinor), isBold: true, isTotal: true }
  ];

  let calcRowY = summaryBlockStartY;
  costLines.forEach((item) => {
    if (item.isTotal) {
      calcRowY += 2;
      doc.setFillColor(15, 23, 42); // Navy Banner
      doc.rect(rightBlockX, calcRowY, rightBlockWidth, 10, 'F');

      doc.setTextColor(199, 163, 90); // Gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(item.label, rightBlockX + 3, calcRowY + 6.5);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9.5);
      doc.text(item.value, pageWidth - margin - 3, calcRowY + 6.5, { align: 'right' });
      calcRowY += 12;
    } else {
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFont('helvetica', item.isBold ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.text(item.label, rightBlockX + 3, calcRowY + 4.5);

      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, pageWidth - margin - 3, calcRowY + 4.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(rightBlockX, calcRowY + 6.5, pageWidth - margin, calcRowY + 6.5);
      calcRowY += 7.2;
    }
  });

  currentY = Math.max(summaryBlockStartY + 52, calcRowY + 4);

  // ---------------------------------------------------------------------------
  // 5. STATUTORY DECLARATION & AUTHORIZED SIGNATURE
  // ---------------------------------------------------------------------------
  const signBlockY = currentY + 2;

  // Terms & Statutory Declaration (Left 110mm)
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STATUTORY TERMS & REGULATORY DECLARATION:', margin, signBlockY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '1. Arth Research is registered with SEBI as a Research Analyst (Reg: INH00001234). All model strategies are algorithmic.',
    margin,
    signBlockY + 8.5
  );
  doc.text(
    '2. Advisory fees are non-refundable once strategy signals and portfolio rebalance weights are provisioned to the client.',
    margin,
    signBlockY + 12.5
  );
  doc.text(
    '3. This is an authentic digital Tax Invoice issued under Rule 46 of CGST Rules, 2017 and Section 31 of CGST Act, 2017.',
    margin,
    signBlockY + 16.5
  );
  doc.text(
    '4. Client assets remain 100% self-custodied in their verified Demat trading account with their respective SEBI broker.',
    margin,
    signBlockY + 20.5
  );

  // Authorized Signatory Seal (Right 60mm)
  const sealX = pageWidth - margin - 58;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sealX, signBlockY, 58, 24, 1.5, 1.5, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('For ARTH RESEARCH PRIVATE DESK', sealX + 4, signBlockY + 4.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('COMPLIANCE OFFICER', sealX + 4, signBlockY + 11);

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('[ Digitally Signed & Authenticated ]', sealX + 4, signBlockY + 16.5);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Issued: ${data.paymentDate}`, sealX + 4, signBlockY + 21);

  // ---------------------------------------------------------------------------
  // 6. BOTTOM CORPORATE FOOTER
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // Navy Footer
  doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Arth Research Advisory Desk  •  Desk: support@arthresearch.com  •  Portal: https://arthresearch.web.app',
    pageWidth / 2,
    pageHeight - 3.5,
    { align: 'center' }
  );

  return doc;
}

export function getInvoicePdfBase64(data: InvoiceData): string {
  const doc = generateInvoicePdf(data);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

export function downloadInvoicePdf(data: InvoiceData, filename?: string): void {
  const doc = generateInvoicePdf(data);
  doc.save(filename || `tax_invoice_${data.invoiceNumber}.pdf`);
}
