import {
  buildWelcomeOrientationEmail,
  buildPasswordResetEmail,
  buildSecurityAlertEmail,
  buildPaymentConfirmationEmail,
  buildPaymentFailedEmail,
  buildSubscriptionExpiryWarningEmail,
  buildSubscriptionExpiredEmail,
  buildHoldingsSubmittedEmail,
  buildPortfolioClearanceEmail,
  buildHoldingsRevisionEmail,
  buildRebalanceAlertEmail,
  buildAlphaSignalEmail,
  buildMonthlyDigestEmail,
  buildTicketLoggedEmail,
  buildAnalystReplyEmail,
  buildAdminNewTicketAlertEmail,
  buildAdminUserReplyAlertEmail,
  buildTicketStatusUpdateEmail,
  buildAccountRevokedEmail,
  buildAccountReactivatedEmail,
  type WelcomeEmailData,
  type PasswordResetEmailData,
  type SecurityAlertEmailData,
  type PaymentConfirmationEmailData,
  type PaymentFailedEmailData,
  type SubscriptionExpiryWarningEmailData,
  type SubscriptionExpiredEmailData,
  type HoldingsSubmittedEmailData,
  type PortfolioClearanceEmailData,
  type HoldingsRevisionEmailData,
  type RebalanceAlertEmailData,
  type AlphaSignalEmailData,
  type MonthlyDigestEmailData,
  type TicketLoggedEmailData,
  type AnalystReplyEmailData,
  type AdminNewTicketAlertEmailData,
  type AdminUserReplyAlertEmailData,
  type TicketStatusUpdateEmailData,
  type AccountRevokedEmailData,
  type AccountReactivatedEmailData
} from '../templates/emails';

import { getApiEndpoint } from '../config/api';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 string
  encoding?: string;
  contentType?: string;
}

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  metadata?: Record<string, any>;
  attachments?: EmailAttachment[];
}

export interface EmailAuditLogEntry {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  templateId?: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  errorMessage?: string;
  messageId?: string;
}

const AUDIT_STORAGE_KEY = 'arth_email_audit_logs';
const DEDUPLICATION_WINDOW_MS = 2000; // 2 seconds safety window for duplicate button double-clicks
const dispatchCache = new Map<string, { timestamp: number; promise: Promise<any> }>();

export const emailService = {
  /**
   * Return configured admin or advisory desk email
   */
  getAdminEmail(): string {
    return import.meta.env.VITE_ADMIN_EMAIL || 'support@arthadvisory.com';
  },

  /**
   * Raw dispatch method sending HTML email through backend serverless API
   * Prevents accidental double-clicks using precise per-payload cache key
   */
  async sendEmail(payload: EmailDispatchPayload): Promise<{ success: boolean; mocked?: boolean; messageId?: string; error?: string }> {
    // Precise cache key including recipient, subject, templateId, and unique content signature
    const contentSig = (payload.text || payload.html || '').slice(0, 100);
    const cacheKey = `${payload.to.toLowerCase()}_${payload.templateId || 'custom'}_${payload.subject}_${contentSig}`;
    const now = Date.now();
    const cached = dispatchCache.get(cacheKey);

    // If an identical email dispatch was requested within 2 seconds, return existing promise
    if (cached && (now - cached.timestamp) < DEDUPLICATION_WINDOW_MS) {
      console.warn(`[EmailService] Deduplicating identical click dispatch to ${payload.to} (${payload.templateId || payload.subject})`);
      return cached.promise;
    }

    const logId = 'LOG-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();

    const dispatchPromise = (async () => {
      try {
        const endpoint = getApiEndpoint('/send-email');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            attachments: payload.attachments
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          this._recordAuditLog({
            id: logId,
            timestamp,
            to: payload.to,
            subject: payload.subject,
            templateId: payload.templateId,
            status: data.mocked ? 'SIMULATED' : 'SENT',
            messageId: data.messageId
          });
          return data;
        } else {
          const errorMsg = data.error || 'Server rejected email dispatch.';
          this._recordAuditLog({
            id: logId,
            timestamp,
            to: payload.to,
            subject: payload.subject,
            templateId: payload.templateId,
            status: 'FAILED',
            errorMessage: errorMsg
          });
          return { success: false, error: errorMsg };
        }
      } catch (err: any) {
        console.error('[EmailService] Dispatch failed:', err);
        this._recordAuditLog({
          id: logId,
          timestamp,
          to: payload.to,
          subject: payload.subject,
          templateId: payload.templateId,
          status: 'FAILED',
          errorMessage: err.message || 'Network / Fetch failed'
        });
        return { success: false, error: err.message || 'Failed to connect to email service' };
      }
    })();

    dispatchCache.set(cacheKey, { timestamp: now, promise: dispatchPromise });
    return dispatchPromise;
  },

  // -----------------------------------------------------------------------------------------------
  // High-Level Convenience Methods
  // -----------------------------------------------------------------------------------------------

  // 1. [Auth] Welcome
  async sendWelcomeEmail(to: string, data: WelcomeEmailData) {
    const { subject, html } = buildWelcomeOrientationEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'auth_welcome' });
  },

  // 2. [Auth] Password Reset
  async sendPasswordResetEmail(to: string, data: PasswordResetEmailData) {
    const { subject, html } = buildPasswordResetEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'auth_password_reset' });
  },

  // 3. [Auth] Security Alert
  async sendSecurityAlertEmail(to: string, data: SecurityAlertEmailData) {
    const { subject, html } = buildSecurityAlertEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'auth_security_alert' });
  },

  // 4. [Billing] Payment Confirmation with attached Tax Invoice PDF
  async sendPaymentConfirmationEmail(
    to: string, 
    data: PaymentConfirmationEmailData, 
    attachments?: EmailAttachment[]
  ) {
    const { subject, html } = buildPaymentConfirmationEmail(data);
    return this.sendEmail({ 
      to, 
      subject, 
      html, 
      templateId: 'billing_payment_confirmation',
      attachments 
    });
  },

  // 5. [Billing] Payment Failed
  async sendPaymentFailedEmail(to: string, data: PaymentFailedEmailData) {
    const { subject, html } = buildPaymentFailedEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'billing_payment_failed' });
  },

  // 6. [Billing] 7-Day Expiry Warning
  async sendSubscriptionExpiryWarningEmail(to: string, data: SubscriptionExpiryWarningEmailData) {
    const { subject, html } = buildSubscriptionExpiryWarningEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'billing_expiry_warning' });
  },

  // 7. [Billing] Subscription Expired
  async sendSubscriptionExpiredEmail(to: string, data: SubscriptionExpiredEmailData) {
    const { subject, html } = buildSubscriptionExpiredEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'billing_subscription_expired' });
  },

  // 8. [Portfolio] Holdings Submitted
  async sendHoldingsSubmittedEmail(to: string, data: HoldingsSubmittedEmailData) {
    const { subject, html } = buildHoldingsSubmittedEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'portfolio_holdings_submitted' });
  },

  // 9. [Portfolio] Analyst Clearance
  async sendPortfolioClearanceEmail(to: string, data: PortfolioClearanceEmailData) {
    const { subject, html } = buildPortfolioClearanceEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'portfolio_clearance_active' });
  },

  // 10. [Portfolio] Holdings Revision Remarks
  async sendHoldingsRevisionEmail(to: string, data: HoldingsRevisionEmailData) {
    const { subject, html } = buildHoldingsRevisionEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'portfolio_revision_remarks' });
  },

  // 11. [Advisory] Rebalance Alert
  async sendRebalanceAlertEmail(to: string, data: RebalanceAlertEmailData) {
    const { subject, html } = buildRebalanceAlertEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'advisory_rebalance_alert' });
  },

  // 12. [Advisory] Alpha Signal
  async sendAlphaSignalEmail(to: string, data: AlphaSignalEmailData) {
    const { subject, html } = buildAlphaSignalEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'advisory_alpha_signal' });
  },

  // 13. [Advisory] Monthly Digest
  async sendMonthlyDigestEmail(to: string, data: MonthlyDigestEmailData) {
    const { subject, html } = buildMonthlyDigestEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'advisory_monthly_digest' });
  },

  // 14. [Support] Ticket Logged (To Client)
  async sendTicketLoggedEmail(to: string, data: TicketLoggedEmailData) {
    const { subject, html } = buildTicketLoggedEmail(data);
    return this.sendEmail({ to, subject, html, templateId: `support_ticket_logged_${data.ticketId}` });
  },

  // 15. [Support] Analyst Reply (To Client)
  async sendAnalystReplyEmail(to: string, data: AnalystReplyEmailData) {
    const { subject, html } = buildAnalystReplyEmail(data);
    return this.sendEmail({ to, subject, html, templateId: `support_analyst_reply_${data.ticketId}` });
  },

  // 16. [Support] Alert to Admin on New Ticket (To Admin Desk)
  async sendAdminNewTicketAlertEmail(to: string, data: AdminNewTicketAlertEmailData) {
    const { subject, html } = buildAdminNewTicketAlertEmail(data);
    return this.sendEmail({ to, subject, html, templateId: `admin_new_ticket_${data.ticketId}` });
  },

  // 17. [Support] Alert to Admin on Client Reply (To Admin Desk)
  async sendAdminUserReplyAlertEmail(to: string, data: AdminUserReplyAlertEmailData) {
    const { subject, html } = buildAdminUserReplyAlertEmail(data);
    return this.sendEmail({ to, subject, html, templateId: `admin_user_reply_${data.ticketId}` });
  },

  // 18. [Support] Ticket Status Update Notice (To Client)
  async sendTicketStatusUpdateEmail(to: string, data: TicketStatusUpdateEmailData) {
    const { subject, html } = buildTicketStatusUpdateEmail(data);
    return this.sendEmail({ to, subject, html, templateId: `support_status_update_${data.ticketId}_${data.status}` });
  },

  // 19. [Governance] Account Revoked (Mandatory Supervisor Reason)
  async sendAccountRevokedEmail(to: string, data: AccountRevokedEmailData) {
    const { subject, html } = buildAccountRevokedEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'governance_account_revoked' });
  },

  // 20. [Governance] Account Reactivated
  async sendAccountReactivatedEmail(to: string, data: AccountReactivatedEmailData) {
    const { subject, html } = buildAccountReactivatedEmail(data);
    return this.sendEmail({ to, subject, html, templateId: 'governance_account_reactivated' });
  },

  // -----------------------------------------------------------------------------------------------
  // Audit Trail Helpers
  // -----------------------------------------------------------------------------------------------

  getAuditLogs(): EmailAuditLogEntry[] {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  clearAuditLogs(): void {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  _recordAuditLog(entry: EmailAuditLogEntry) {
    try {
      const logs = this.getAuditLogs();
      logs.unshift(entry);
      // Keep last 100 entries
      if (logs.length > 100) logs.pop();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('[EmailService] Could not persist audit log', e);
    }
  }
};
