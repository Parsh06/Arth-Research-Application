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
  const configureUrl = data.configureBasketUrl || 'https://arthresearch.com/setup-portfolio';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>We have successfully processed your advisory subscription mandate. Your payment is confirmed and your official statutory <strong>GST Tax Invoice</strong> is detailed below.</p>

    <!-- Invoice Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid #1E293B; border-radius: 10px; margin: 20px 0; overflow: hidden;">
      <tr style="background-color: #0E1420; border-bottom: 1px solid #1E293B;">
        <td colspan="2" style="padding: 12px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #C6A15B; text-transform: uppercase;">TAX INVOICE &bull; ${data.invoiceNumber}</td>
              <td align="right" style="font-family: 'Courier New', monospace; font-size: 10px; color: #94A3B8;">${data.invoiceDateFormatted}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8; width: 40%;">ADVISORY MANDATE</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #F8FAFC; font-weight: 600;">${data.planName} (${data.planTier})</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B; background-color: #0E1420;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">DURATION</td>
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #F8FAFC;">${data.planDurationMonths} Months Active Advisory</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">CAPITAL MANDATE LIMIT</td>
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #C6A15B; font-weight: 700;">${data.capitalAllocationLimitFormatted}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B; background-color: #0E1420;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">TRANSACTION ID</td>
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">${data.transactionId}</td>
      </tr>
      <tr style="background-color: #172235;">
        <td style="padding: 12px 16px; font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #F8FAFC;">TOTAL PAID (INCL. GST)</td>
        <td align="right" style="padding: 12px 16px; font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #1E8E5A;">${data.amountPaidFormatted}</td>
      </tr>
    </table>

    <div style="background-color: rgba(30, 142, 90, 0.08); border-left: 3px solid #1E8E5A; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12px; color: #E2E8F0; font-weight: 600;">Next Step: Configure Initial Executed Holdings</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
        Submit your executed stock entries for research analyst verification. Clearance is typically granted within 24–48 hours.
      </div>
    </div>
  `;

  return {
    subject: `Payment Confirmed & Tax Invoice: ${data.planName} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Tax invoice ${data.invoiceNumber} for ${data.planName}. Total paid: ${data.amountPaidFormatted}.`,
      badgeText: 'BILLING & INVOICE',
      badgeColor: 'emerald',
      headline: 'Payment Confirmed & Mandate Activated',
      subheadline: `Your subscription to ${data.planName} is confirmed. Please configure your executed holdings.`,
      bodyHtml,
      primaryCta: {
        text: 'Configure Holdings Basket',
        url: configureUrl
      },
      footerNotice: `GST Invoice Ref: ${data.invoiceNumber} • Digital invoice generated for audited tax compliance.`
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
  const retryUrl = data.retryUrl || 'https://arthresearch.com/plans';
  const displayAmount = data.amountFormatted || data.amount || '₹29,500.00';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>We were unable to complete the payment authorization for your subscription to <strong style="color: #C6A15B;">${data.planName}</strong> (${displayAmount}).</p>

    <!-- Failure Box -->
    <div style="background-color: rgba(179, 40, 63, 0.1); border: 1px solid rgba(179, 40, 63, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #E05263; text-transform: uppercase;">GATEWAY DIAGNOSTIC</div>
      <div style="font-size: 12px; color: #F8FAFC; margin-top: 4px; font-weight: 600;">
        ${data.failureReason || data.reason || 'Transaction declined by issuer or payment session timed out.'}
      </div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">
        No funds were charged. If money was debited from your account, it will automatically reverse within 3–5 banking days.
      </div>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
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
  const renewalUrl = data.renewalUrl || 'https://arthresearch.com/plans';
  const displayExpiry = data.expiryDateFormatted || data.expiryDate || 'in 7 days';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>This is a scheduled advisory notice to inform you that your quantitative subscription for <strong style="color: #C6A15B;">${data.planName}</strong> will conclude in <strong style="color: #C6A15B;">7 days</strong> on <strong style="color: #F8FAFC;">${displayExpiry}</strong>.</p>

    <!-- Expiry Summary Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid #1E293B; border-radius: 10px; margin: 20px 0; padding: 18px;">
      <tr>
        <td>
          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #C6A15B; text-transform: uppercase;">
            Mandate Continuity Guarantee
          </div>
          <p style="font-size: 12px; color: #CBD5E1; line-height: 1.6; margin: 8px 0 0 0;">
            Renewing before your expiry date guarantees uninterrupted real-time rebalancing telemetry, risk monitoring, and direct research desk access without needing to re-audit your portfolio.
          </p>
          ${data.generatedPnlFormatted ? `
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #1E293B; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">
            CURRENT GENERATED GAIN: <strong style="color: #1E8E5A;">${data.generatedPnlFormatted}</strong>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
      Click below to lock in seamless renewal for your quantitative advisory tier.
    </p>
  `;

  return {
    subject: `[Notice] 7 Days Remaining on Your ${data.planName} Mandate • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Your advisory mandate for ${data.planName} concludes on ${displayExpiry}. Renew to maintain active alpha telemetry.`,
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
  const renewalUrl = data.renewalUrl || 'https://arthresearch.com/plans';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Your quantitative advisory mandate for <strong style="color: #C6A15B;">${data.planName}</strong> has expired as of <strong style="color: #F8FAFC;">${data.expiredDateFormatted}</strong>.</p>

    <!-- Suspension Notice Box -->
    <div style="background-color: rgba(179, 40, 63, 0.08); border-left: 3px solid #B3283F; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12px; color: #E2E8F0; font-weight: 600;">Telemetry Paused</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px; line-height: 1.6;">
        Real-time model rebalancing alerts, target weight adjustments, and analyst desk communications for this portfolio are paused until the mandate is renewed.
      </div>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
      Your historical performance and position records remain safely archived in your Private Ledger. Renew anytime to restore live signal dispatch.
    </p>
  `;

  return {
    subject: `Your Advisory Subscription for ${data.planName} Has Expired • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Advisory telemetry for ${data.planName} has concluded. Renew to reactivate real-time signals.`,
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
    amountPaidFormatted: data.amountPaid || data.amountPaidFormatted || '₹1,17,999.00',
    basePriceFormatted: data.baseAmount || data.basePriceFormatted || '₹99,999.15',
    gstAmountFormatted: data.gstAmount || data.gstAmountFormatted || '₹17,999.85',
    transactionId: data.paymentMethod || data.transactionId || 'TXN-ARTH-LIVE',
    invoiceNumber: data.invoiceNumber || 'INV-ARTH-2026',
    invoiceDateFormatted: data.paymentDate || data.invoiceDateFormatted || '19 Sep 2026',
    capitalAllocationLimitFormatted: data.period || data.capitalAllocationLimitFormatted || 'Annual Operational Mandate',
    configureBasketUrl: data.invoiceUrl || data.configureBasketUrl
  });
};

export const buildPaymentFailedEmail = (data: any) => {
  return buildPaymentFailedNoticeEmail({
    userName: data.userName,
    planName: data.planName,
    amountFormatted: data.amount || data.amountFormatted || '₹29,500.00',
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
