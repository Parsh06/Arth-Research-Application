// src/templates/emails/index.ts

export * from './emailBase';
export * from './authTemplates';
export * from './billingTemplates';
export * from './portfolioTemplates';
export * from './advisoryTemplates';
export * from './supportTemplates';
export * from './governanceTemplates';

import { buildWelcomeOrientationEmail, buildPasswordResetEmail, buildSecurityAlertEmail } from './authTemplates';
import { buildPaymentConfirmationEmail, buildPaymentFailedEmail, buildSubscriptionExpiryWarningEmail, buildSubscriptionExpiredEmail } from './billingTemplates';
import { buildHoldingsSubmittedEmail, buildPortfolioClearanceEmail, buildHoldingsRevisionEmail } from './portfolioTemplates';
import { buildRebalanceAlertEmail, buildAlphaSignalEmail, buildMonthlyDigestEmail } from './advisoryTemplates';
import { 
  buildTicketLoggedEmail, 
  buildAnalystReplyEmail, 
  buildAdminNewTicketAlertEmail, 
  buildAdminUserReplyAlertEmail, 
  buildTicketStatusUpdateEmail 
} from './supportTemplates';
import { buildAccountRevokedEmail, buildAccountReactivatedEmail } from './governanceTemplates';

export interface EmailTemplateDefinition {
  id: string;
  number: number;
  category: 'Auth' | 'Billing' | 'Portfolio' | 'Advisory' | 'Support' | 'Governance';
  title: string;
  description: string;
  badgeColor: 'brass' | 'emerald' | 'sapphire' | 'garnet' | 'zinc';
  defaultRecipient: string;
  generateSample: (recipientEmail?: string) => { subject: string; html: string };
}

export const EMAIL_TEMPLATES_CATALOG: EmailTemplateDefinition[] = [
  // 1. [Auth] Welcome & Orientation
  {
    id: 'auth_welcome',
    number: 1,
    category: 'Auth',
    title: 'Welcome & Orientation',
    description: 'Onboarding confirmation dispatched upon account registration with terminal privileges overview.',
    badgeColor: 'brass',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildWelcomeOrientationEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/login`
    })
  },

  // 2. [Auth] Password Reset Link
  {
    id: 'auth_password_reset',
    number: 2,
    category: 'Auth',
    title: 'Password Reset Link',
    description: 'Secure time-sensitive reset link with client IP and expiry notice.',
    badgeColor: 'sapphire',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildPasswordResetEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      resetUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/reset-password?token=sample_token_872168`,
      expiresInMinutes: 15,
      ipAddress: '103.21.124.89'
    } as any)
  },

  // 3. [Auth] Security Login Alert
  {
    id: 'auth_security_alert',
    number: 3,
    category: 'Auth',
    title: 'Security Login Alert',
    description: 'Real-time security alert whenever a new device or IP accesses the investor terminal.',
    badgeColor: 'garnet',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildSecurityAlertEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      device: 'MacBook Pro (Chrome 128 / macOS Sequoia)',
      ipAddress: '49.207.210.45',
      location: 'Mumbai, Maharashtra, India',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      securityUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/settings`
    })
  },

  // 4. [Billing] Payment Confirmation & GST Tax Invoice
  {
    id: 'billing_payment_confirmation',
    number: 4,
    category: 'Billing',
    title: 'Payment Confirmation & GST Tax Invoice',
    description: 'Statutory GST B2B/B2C invoice statement with tax breakdown and subscription activation.',
    badgeColor: 'emerald',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildPaymentConfirmationEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      planName: 'Institutional Alpha Flagship (Annual)',
      invoiceNumber: 'INV-ARTH-2026-0894',
      paymentDate: '19 Sep 2026',
      amountPaid: '₹1,17,999.00',
      baseAmount: '₹99,999.15',
      gstAmount: '₹17,999.85 (18% GST)',
      paymentMethod: 'HDFC Corporate NetBanking (Ref: PG_98234710)',
      period: '19 Sep 2026 — 18 Sep 2027',
      invoiceUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/invoices/INV-ARTH-2026-0894.pdf`
    })
  },

  // 5. [Billing] Payment Failed Notice
  {
    id: 'billing_payment_failed',
    number: 5,
    category: 'Billing',
    title: 'Payment Failed Notice',
    description: 'Alert dispatched on gateway rejection with retry button and direct bank support.',
    badgeColor: 'garnet',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildPaymentFailedEmail({
      userName: 'Vikramaditya Singhania',
      planName: 'Quant Momentum Strategy (Quarterly)',
      amount: '₹29,500.00',
      attemptDate: '19 Sep 2026, 11:42 AM IST',
      reason: 'Bank Mandate Timeout / Insufficient Limit on Corporate Card',
      retryUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/checkout`
    })
  },

  // 6. [Billing] 7-Day Expiry Warning
  {
    id: 'billing_expiry_warning',
    number: 6,
    category: 'Billing',
    title: '7-Day Expiry Warning',
    description: 'Proactive notice 7 days prior to mandate expiration to prevent algorithmic signal interruption.',
    badgeColor: 'brass',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildSubscriptionExpiryWarningEmail({
      userName: 'Vikramaditya Singhania',
      planName: 'Institutional Alpha Flagship',
      expiryDate: '26 Sep 2026 (7 Days Remaining)',
      renewalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/billing`
    })
  },

  // 7. [Billing] Subscription Expired Notice
  {
    id: 'billing_subscription_expired',
    number: 7,
    category: 'Billing',
    title: 'Subscription Expired Notice',
    description: 'Notice of mandate conclusion with fast renewal options and portfolio archive access.',
    badgeColor: 'zinc',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildSubscriptionExpiredEmail({
      userName: 'Vikramaditya Singhania',
      planName: 'Institutional Alpha Flagship',
      expiredDateFormatted: '18 Sep 2026',
      renewalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/pricing`
    })
  },

  // 8. [Portfolio] Holdings Submitted Confirmation
  {
    id: 'portfolio_holdings_submitted',
    number: 8,
    category: 'Portfolio',
    title: 'Holdings Submitted Confirmation',
    description: 'Confirmation that investor uploaded CAS / broker holdings for analyst desk review.',
    badgeColor: 'sapphire',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildHoldingsSubmittedEmail({
      userName: 'Vikramaditya Singhania',
      mandateName: 'Alpha Flagship Strategy',
      submissionDate: '19 Sep 2026, 11:30 AM IST',
      totalHoldingsCount: 14,
      totalPortfolioValue: '₹84,50,000.00',
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/portfolio`
    })
  },

  // 9. [Portfolio] Analyst Portfolio Clearance & Activation
  {
    id: 'portfolio_clearance_active',
    number: 9,
    category: 'Portfolio',
    title: 'Analyst Portfolio Clearance & Activation',
    description: 'Supervisory clearance approving client portfolio and activating real-time quant rebalance stream.',
    badgeColor: 'emerald',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildPortfolioClearanceEmail({
      userName: 'Vikramaditya Singhania',
      mandateName: 'Alpha Flagship Strategy',
      analystName: 'Parsh Jain',
      clearanceDate: '19 Sep 2026',
      clearedStocksCount: 14,
      portfolioNav: '₹84,50,000.00',
      analystRemarks: 'All 14 constituents comply with market capitalization thresholds, sector ceilings, and volatility filter requirements.',
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/portfolio`
    })
  },

  // 10. [Portfolio] Holdings Revision / Rejection Remarks
  {
    id: 'portfolio_revision_remarks',
    number: 10,
    category: 'Portfolio',
    title: 'Holdings Revision / Rejection Remarks',
    description: 'Analyst action points highlighting non-compliant holdings or missing execution price data.',
    badgeColor: 'garnet',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildHoldingsRevisionEmail({
      userName: 'Vikramaditya Singhania',
      mandateName: 'Alpha Flagship Strategy',
      analystName: 'Parsh Jain',
      reviewDate: '19 Sep 2026',
      reasonSummary: 'Excessive single-stock concentration (28% in Smallcap NBFC) exceeds the 12% mandate cap. Please reallocate or trim.',
      actionItems: [
        'Trim XYZ Finserv from 28% to under 12% of total NAV',
        'Verify purchase price for IDEA - missing contract note timestamp',
        'Re-submit synchronized CAS statement for desk clearance'
      ],
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/portfolio/entry`
    })
  },

  // 11. [Advisory] Urgent Portfolio Rebalance Alert
  {
    id: 'advisory_rebalance_alert',
    number: 11,
    category: 'Advisory',
    title: 'Urgent Portfolio Rebalance Alert',
    description: 'Real-time multi-stock rebalance instruction with target weights and analyst thesis.',
    badgeColor: 'brass',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildRebalanceAlertEmail({
      userName: 'Vikramaditya Singhania',
      mandateName: 'Institutional Alpha Flagship',
      rebalanceDate: '19 Sep 2026',
      urgency: 'HIGH',
      reasonSummary: 'Quarterly quant model rebalancing: Trimming high-beta industrials and increasing weight in defensive pharma and IT export plays ahead of earnings season.',
      items: [
        { ticker: 'RELIANCE', action: 'ADD', currentWeight: '4.5%', targetWeight: '8.0%', cmp: '₹2,980.00' },
        { ticker: 'TCS', action: 'BUY', currentWeight: '0.0%', targetWeight: '6.5%', cmp: '₹4,250.00' },
        { ticker: 'TRENT', action: 'TRIM', currentWeight: '9.0%', targetWeight: '4.0%', cmp: '₹7,120.00' },
        { ticker: 'ZOMATO', action: 'EXIT', currentWeight: '5.0%', targetWeight: '0.0%', cmp: '₹265.00' }
      ],
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/portfolio`
    })
  },

  // 12. [Advisory] High-Conviction Alpha Signal
  {
    id: 'advisory_alpha_signal',
    number: 12,
    category: 'Advisory',
    title: 'High-Conviction Alpha Signal',
    description: 'Instant notification on new research call with CMP, Target, Stop Loss, and Thesis.',
    badgeColor: 'emerald',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildAlphaSignalEmail({
      userName: 'Vikramaditya Singhania',
      ticker: 'DIXON',
      companyName: 'Dixon Technologies (India) Ltd.',
      action: 'BUY',
      cmp: '₹12,450.00',
      targetPrice: '₹15,800.00',
      stopLoss: '₹11,100.00',
      timeHorizon: '6 - 9 Months',
      riskReward: '1 : 2.8',
      signalId: 'SIG-2026-0919',
      catalyst: 'Expanding domestic PLI scheme localization, rapid ramp-up in high-margin display assembly, and multi-year export contract wins driving 38% CAGR earnings visibility.',
      signalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/signals`
    })
  },

  // 13. [Advisory] Monthly Performance & Tax Digest
  {
    id: 'advisory_monthly_digest',
    number: 13,
    category: 'Advisory',
    title: 'Monthly Performance & Tax Digest',
    description: 'Monthly statement with NAV performance, benchmark alpha, top winners, and FY STCG/LTCG breakdown.',
    badgeColor: 'brass',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildMonthlyDigestEmail({
      userName: 'Vikramaditya Singhania',
      monthYear: 'August 2026',
      portfolioNav: '₹89,42,100.00',
      monthlyReturnPct: '+4.82%',
      benchmarkReturnPct: '+1.35%',
      alphaGeneratedPct: '+3.47% Spread',
      realizedGainsStcg: '₹1,42,800.00',
      realizedGainsLtcg: '₹4,90,500.00',
      topWinnerTicker: 'DIXON',
      topWinnerReturn: '+24.6%',
      marketOutlookSummary: 'Broad market consolidation remains healthy. We maintain an overweight stance on export manufacturing and high free cash flow compounding themes.',
      statementUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/reports`
    })
  },

  // 14. [Support] Support Ticket Logged Confirmation
  {
    id: 'support_ticket_logged',
    number: 14,
    category: 'Support',
    title: 'Support Ticket Logged Confirmation',
    description: 'Dispatched to user immediately when they log an advisory or technical inquiry.',
    badgeColor: 'sapphire',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildTicketLoggedEmail({
      userName: 'Vikramaditya Singhania',
      ticketId: 'TCK-8924',
      subject: 'Clarification regarding Dixon Technologies position sizing',
      category: 'Model Portfolio Advisory',
      priority: 'HIGH',
      messageSnippet: 'Could you advise if I should execute the Dixon allocation in tranches or as a single bulk order at current market depth?',
      ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/support`
    })
  },

  // 15. [Support] Analyst Ticket Reply Notification
  {
    id: 'support_analyst_reply',
    number: 15,
    category: 'Support',
    title: 'Analyst Ticket Reply Notification',
    description: 'Notifies user when an analyst or support manager posts a message on their ticket.',
    badgeColor: 'brass',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildAnalystReplyEmail({
      userName: 'Vikramaditya Singhania',
      ticketId: 'TCK-8924',
      subject: 'Clarification regarding Dixon Technologies position sizing',
      analystName: 'Parsh Jain',
      analystRole: 'Lead Quantitative Analyst',
      replySnippet: 'We recommend entering with 60% of your planned capital allocation at CMP (₹12,450) and setting limit orders for the remaining 40% on any intraday liquidity dips towards ₹12,100.',
      ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/support`
    })
  },

  // 16. [Support] Admin Desk Alert on New Ticket
  {
    id: 'support_admin_new_ticket',
    number: 16,
    category: 'Support',
    title: 'Admin Desk Alert: New Ticket Created',
    description: 'Real-time dispatch to Super Admin & Desk whenever an investor submits a ticket.',
    badgeColor: 'garnet',
    defaultRecipient: 'support@arthadvisory.com',
    generateSample: (_email = 'support@arthadvisory.com') => buildAdminNewTicketAlertEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: 'investor@example.com',
      ticketId: 'TCK-8924',
      subject: 'Clarification regarding Dixon Technologies position sizing',
      category: 'Model Portfolio Advisory',
      priority: 'HIGH',
      messageSnippet: 'Could you advise if I should execute the Dixon allocation in tranches or as a single bulk order at current market depth?',
      adminPortalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/admin/support`
    })
  },

  // 17. [Support] Admin Desk Alert on Client Reply
  {
    id: 'support_admin_client_reply',
    number: 17,
    category: 'Support',
    title: 'Admin Desk Alert: Client Reply Received',
    description: 'Real-time alert when investor adds a comment or response to their support thread.',
    badgeColor: 'sapphire',
    defaultRecipient: 'support@arthadvisory.com',
    generateSample: (_email = 'support@arthadvisory.com') => buildAdminUserReplyAlertEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: 'investor@example.com',
      ticketId: 'TCK-8924',
      subject: 'Clarification regarding Dixon Technologies position sizing',
      replySnippet: 'Understood. I will execute the 60% tranche at market open tomorrow. Thank you!',
      adminPortalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/admin/support`
    })
  },

  // 18. [Support] Ticket Status Update Notification
  {
    id: 'support_status_update',
    number: 18,
    category: 'Support',
    title: 'Ticket Status Update Notification',
    description: 'Notifies client when ticket status is changed to In Progress, Resolved, or Closed.',
    badgeColor: 'emerald',
    defaultRecipient: 'investor@example.com',
    generateSample: (_email = 'investor@example.com') => buildTicketStatusUpdateEmail({
      userName: 'Vikramaditya Singhania',
      ticketId: 'TCK-8924',
      subject: 'Clarification regarding Dixon Technologies position sizing',
      status: 'resolved',
      analystRemarks: 'All advisory questions clarified. Execution tranches confirmed.',
      ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/support`
    })
  },

  // 19. [Governance] Account Access Revoked (with Supervisor Basis)
  {
    id: 'governance_account_revoked',
    number: 19,
    category: 'Governance',
    title: 'Account Access Revoked (with Supervisor Basis)',
    description: 'Mandatory compliance notice containing the exact supervisory reason and appeal protocol.',
    badgeColor: 'garnet',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildAccountRevokedEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      revocationDate: '19 Sep 2026, 12:00 PM IST',
      reason: 'Periodic identity verification review update required: PAN-document linkage mismatch. Account temporarily restricted pending updated verification upload.',
      supervisorName: 'Parsh Jain',
      supervisorRole: 'Principal Advisory Supervisor',
      appealUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/support`
    })
  },

  // 20. [Governance] Account Reactivated Notice
  {
    id: 'governance_account_reactivated',
    number: 20,
    category: 'Governance',
    title: 'Account Reactivated Notice',
    description: 'Notice that account access and quantitative data streams have been restored.',
    badgeColor: 'emerald',
    defaultRecipient: 'investor@example.com',
    generateSample: (email = 'investor@example.com') => buildAccountReactivatedEmail({
      userName: 'Vikramaditya Singhania',
      userEmail: email,
      reactivationDate: '19 Sep 2026, 12:30 PM IST',
      planName: 'Institutional Alpha Flagship',
      portalUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://arthresearch.com'}/login`
    })
  }
];

