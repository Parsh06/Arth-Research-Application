// src/templates/emails/billingTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 4. PAYMENT CONFIRMED & GST TAX INVOICE
// -------------------------------------------------------------------------------------------------
export interface PaymentInvoiceEmailData {
  userName: string;
  userEmail?: string;
  planName: string;
  planTier?: string;
  planDurationMonths?: number;
  amountPaidFormatted?: string;
  amountPaid?: string;
  basePriceFormatted?: string;
  baseAmount?: string;
  gstAmountFormatted?: string;
  gstAmount?: string;
  transactionId?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  invoiceDateFormatted?: string;
  paymentDate?: string;
  period?: string;
  capitalAllocationLimitFormatted?: string;
  configureBasketUrl?: string;
  invoiceUrl?: string;
}

export type PaymentConfirmationEmailData = PaymentInvoiceEmailData;

export function buildPaymentConfirmationInvoiceEmail(data: PaymentInvoiceEmailData): { subject: string; html: string } {
  const configureUrl = data.configureBasketUrl || 'https://arthresearch.web.app/setup-portfolio';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      We have successfully processed your advisory subscription mandate. Your payment is confirmed and your official statutory <strong>GST Tax Invoice</strong> is detailed below.
    </p>

    <!-- Invoice Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr style="background-color: #0F172A; border-bottom: 1px solid #1E293B;">
        <td style="padding: 12px 16px;">
          <span style="font-family: 'Cinzel', Georgia, serif; font-size: 12.5px; font-weight: 700; color: #F59E0B; text-transform: uppercase;">TAX INVOICE &bull; ${data.invoiceNumber || 'INV-ARTH-RECEIPT'}</span>
        </td>
        <td align="right" style="padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #CBD5E1;">
          ${data.paymentDate || data.invoiceDateFormatted || new Date().toLocaleDateString('en-IN')}
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B; width: 45%;">ADVISORY MANDATE</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0F172A; font-weight: 700;">${data.planName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">BASE ADVISORY FEE</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0F172A; font-weight: 600;">${data.baseAmount || data.basePriceFormatted || '₹4,999.00'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">GOODS & SERVICES TAX (GST 18%)</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0F172A; font-weight: 600;">${data.gstAmount || data.gstAmountFormatted || '₹899.82'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">GATEWAY & TECH SURCHARGE (3%)</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0F172A; font-weight: 600;">Included (3% Surcharge)</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">GATEWAY TRANSACTION REF</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #475569; font-weight: 600;">${data.paymentMethod || data.transactionId || 'Razorpay'}</td>
      </tr>
      <tr style="background-color: #0F172A;">
        <td style="padding: 12px 16px; font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #FFFFFF;">TOTAL AMOUNT SETTLED</td>
        <td align="right" style="padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #34D399;">${data.amountPaid || data.amountPaidFormatted}</td>
      </tr>
    </table>

    <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #92400E; line-height: 1.5;">
      📄 <strong>Official Tax Invoice PDF Attached:</strong> Your formal computer-generated Tax Invoice (PDF) with full SAC code and GST breakdown is attached to this email for your tax filing.
    </div>

    <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12.5px; color: #065F46; font-weight: 700;">Next Step: Configure Initial Executed Holdings</div>
      <div style="font-size: 12px; color: #047857; margin-top: 3px; line-height: 1.5;">
        Submit your executed stock entries for research analyst verification. Clearance is typically granted within 24–48 hours.
      </div>
    </div>
  `;

  return {
    subject: `Payment Confirmed & Tax Invoice: ${data.planName} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Tax invoice ${data.invoiceNumber} for ${data.planName}. Total paid: ${data.amountPaid || data.amountPaidFormatted}.`,
      badgeText: 'BILLING & INVOICE',
      badgeColor: 'emerald',
      headline: 'Payment Confirmed & Mandate Activated',
      subheadline: `Your subscription to ${data.planName} is confirmed. Statutory Tax Invoice attached.`,
      bodyHtml,
      primaryCta: {
        text: 'Configure Holdings Basket',
        url: configureUrl
      },
      footerNotice: `GST Invoice Ref: ${data.invoiceNumber} • Official tax invoice generated for your subscription record.`
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 5. PAYMENT FAILED NOTICE
// -------------------------------------------------------------------------------------------------
export interface PaymentFailedEmailData {
  userName: string;
  planName: string;
  amountFormatted?: string;
  amount?: string;
  attemptDate?: string;
  failureReason?: string;
  reason?: string;
  retryUrl?: string;
}

export function buildPaymentFailedNoticeEmail(data: PaymentFailedEmailData): { subject: string; html: string } {
  const retryUrl = data.retryUrl || 'https://arthresearch.web.app/plans';
  const displayAmount = data.amountFormatted || data.amount || '₹4,999.00';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      We were unable to complete the payment authorization for your subscription to <strong style="color: #92400E;">${data.planName}</strong> (${displayAmount}).
    </p>

    <!-- Failure Box -->
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px;">GATEWAY DIAGNOSTIC</div>
      <div style="font-size: 13px; color: #7F1D1D; margin-top: 4px; font-weight: 600;">
        ${data.failureReason || data.reason || 'Transaction declined by issuer or payment session timed out.'}
      </div>
      <div style="font-size: 12px; color: #B91C1C; margin-top: 4px; line-height: 1.5;">
        No funds were charged. If money was debited from your account, it will automatically reverse within 3–5 banking days.
      </div>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      You can safely retry the transaction using UPI, Credit/Debit Card, or Net Banking on the secure checkout desk.
    </p>
  `;

  return {
    subject: `Action Required: Payment Processing Incomplete • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Payment authorization incomplete for ${data.planName} (${displayAmount}). Retry securely.`,
      badgeText: 'BILLING NOTICE',
      badgeColor: 'garnet',
      headline: 'Payment Processing Incomplete',
      subheadline: 'Your recent transaction could not be authorized by the payment gateway.',
      bodyHtml,
      primaryCta: {
        text: 'Retry Secure Payment',
        url: retryUrl
      },
      footerNotice: 'Need assistance? Reach our advisory billing support at support@arthresearch.com.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 6. 7-DAY EXPIRY WARNING
// -------------------------------------------------------------------------------------------------
export interface ExpiryWarning7DaysEmailData {
  userName: string;
  planName: string;
  expiryDateFormatted?: string;
  expiryDate?: string;
  generatedPnlFormatted?: string;
  renewalUrl?: string;
}

export type SubscriptionExpiryWarningEmailData = ExpiryWarning7DaysEmailData;

export function buildExpiryWarning7DaysEmail(data: ExpiryWarning7DaysEmailData): { subject: string; html: string } {
  const renewalUrl = data.renewalUrl || 'https://arthresearch.web.app/plans';
  const displayExpiry = data.expiryDateFormatted || data.expiryDate || 'in 7 days';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      This is a scheduled advisory notice to inform you that your quantitative subscription for <strong style="color: #92400E;">${data.planName}</strong> will conclude in <strong style="color: #92400E;">7 days</strong> on <strong style="color: #0F172A;">${displayExpiry}</strong>.
    </p>

    <!-- Expiry Summary Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 20px 0; padding: 18px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td>
          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #92400E; text-transform: uppercase;">
            Mandate Continuity Guarantee
          </div>
          <p style="font-size: 12.5px; color: #334155; line-height: 1.6; margin: 8px 0 0 0;">
            Renewing before your expiry date guarantees uninterrupted real-time rebalancing signals, risk monitoring, and direct research desk access without needing to re-audit your portfolio.
          </p>
          ${data.generatedPnlFormatted ? `
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #475569;">
            CURRENT GENERATED GAIN: <strong style="color: #059669;">${data.generatedPnlFormatted}</strong>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569;">
      Click below to lock in seamless renewal for your quantitative advisory tier.
    </p>
  `;

  return {
    subject: `[Notice] 7 Days Remaining on Your ${data.planName} Mandate • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Your advisory mandate for ${data.planName} concludes on ${displayExpiry}. Renew to maintain active strategy signals.`,
      badgeText: 'SUBSCRIPTION LIFECYCLE',
      badgeColor: 'brass',
      headline: '7 Days Remaining on Your Mandate',
      subheadline: `Your quantitative advisory access for ${data.planName} concludes on ${displayExpiry}.`,
      bodyHtml,
      primaryCta: {
        text: 'Renew Advisory Mandate',
        url: renewalUrl
      },
      footerNotice: 'Unrenewed portfolios transition to read-only monitoring upon expiry date.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 7. SUBSCRIPTION EXPIRED
// -------------------------------------------------------------------------------------------------
export interface SubscriptionExpiredEmailData {
  userName: string;
  planName: string;
  expiredDateFormatted?: string;
  expirationDate?: string;
  renewalUrl?: string;
  reactivateUrl?: string;
}

export function buildSubscriptionExpiredEmail(data: SubscriptionExpiredEmailData): { subject: string; html: string } {
  const renewalUrl = data.renewalUrl || 'https://arthresearch.web.app/plans';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Your quantitative advisory mandate for <strong style="color: #92400E;">${data.planName}</strong> has expired as of <strong style="color: #0F172A;">${data.expiredDateFormatted}</strong>.
    </p>

    <!-- Suspension Notice Box -->
    <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12.5px; color: #991B1B; font-weight: 700;">Live Alerts Paused</div>
      <div style="font-size: 12px; color: #7F1D1D; margin-top: 3px; line-height: 1.6;">
        Real-time model rebalancing alerts, target weight adjustments, and analyst desk communications for this portfolio are paused until the mandate is renewed.
      </div>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Your historical performance and position records remain safely archived in your Private Ledger. Renew anytime to restore live signal dispatch.
    </p>
  `;

  return {
    subject: `Your Advisory Subscription for ${data.planName} Has Expired • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Advisory access for ${data.planName} has concluded. Renew to reactivate real-time signals.`,
      badgeText: 'SUBSCRIPTION EXPIRED',
      badgeColor: 'garnet',
      headline: 'Advisory Mandate Concluded',
      subheadline: `Your subscription to ${data.planName} expired on ${data.expiredDateFormatted}.`,
      bodyHtml,
      primaryCta: {
        text: 'Reactivate Advisory Plan',
        url: renewalUrl
      },
      footerNotice: 'To archive or export your audited historical records, access your Terminal History Desk.'
    })
  };
}

export const buildPaymentConfirmationEmail = (data: any) => {
  return buildPaymentConfirmationInvoiceEmail({
    userName: data.userName,
    userEmail: data.userEmail || '',
    planName: data.planName,
    planTier: data.planTier || 'Flagship Alpha',
    planDurationMonths: data.planDurationMonths || 12,
    amountPaidFormatted: data.amountPaid || data.amountPaidFormatted || '₹4,999.00',
    basePriceFormatted: data.baseAmount || data.basePriceFormatted || '₹4,999.00',
    gstAmountFormatted: data.gstAmount || data.gstAmountFormatted || '₹899.82',
    transactionId: data.paymentMethod || data.transactionId || 'TXN-ARTH-LIVE',
    invoiceNumber: data.invoiceNumber || 'INV-ARTH-2026',
    invoiceDateFormatted: data.paymentDate || data.invoiceDateFormatted || new Date().toLocaleDateString('en-IN'),
    capitalAllocationLimitFormatted: data.period || data.capitalAllocationLimitFormatted || 'Operational Mandate',
    configureBasketUrl: data.invoiceUrl || data.configureBasketUrl
  });
};

export const buildPaymentFailedEmail = (data: any) => {
  return buildPaymentFailedNoticeEmail({
    userName: data.userName,
    planName: data.planName,
    amountFormatted: data.amount || data.amountFormatted || '₹4,999.00',
    failureReason: data.reason || data.failureReason,
    retryUrl: data.retryUrl
  });
};

export const buildSubscriptionExpiryWarningEmail = (data: any) => {
  return buildExpiryWarning7DaysEmail({
    userName: data.userName,
    planName: data.planName,
    expiryDateFormatted: data.expiryDate || data.expiryDateFormatted || '26 Sep 2026',
    renewalUrl: data.renewalUrl
  });
};
