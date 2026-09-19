// src/templates/emails/portfolioTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 8. HOLDINGS SUBMITTED CONFIRMATION
// -------------------------------------------------------------------------------------------------
export interface HoldingEntryItem {
  ticker: string;
  quantity: number;
  avgPriceFormatted: string;
  totalValueFormatted: string;
}

export interface HoldingsSubmittedEmailData {
  userName: string;
  planName?: string;
  mandateName?: string;
  portfolioId?: string;
  totalInvestmentFormatted?: string;
  totalPortfolioValue?: string;
  holdingsCount?: number;
  totalHoldingsCount?: number;
  holdingsList?: HoldingEntryItem[];
  submissionDate?: string;
  portalUrl?: string;
}

export function buildHoldingsSubmittedEmail(data: any): { subject: string; html: string } {
  const portalUrl = data.portalUrl || 'https://arthresearch.com/portfolio-pending';
  const planName = data.mandateName || data.planName || 'Institutional Strategy';
  const holdingsList = data.holdingsList || [
    { ticker: 'RELIANCE', quantity: 25, avgPriceFormatted: '₹2,980.00', totalValueFormatted: '₹74,500.00' },
    { ticker: 'TCS', quantity: 15, avgPriceFormatted: '₹4,250.00', totalValueFormatted: '₹63,750.00' },
    { ticker: 'HDFCBANK', quantity: 40, avgPriceFormatted: '₹1,660.00', totalValueFormatted: '₹66,400.00' }
  ];
  const totalInvestmentFormatted = data.totalPortfolioValue || data.totalInvestmentFormatted || '₹84,50,000.00';
  const holdingsCount = data.totalHoldingsCount || data.holdingsCount || holdingsList.length;
  const portfolioId = data.portfolioId || 'PORT-SUBMITTED';

  const holdingsRows = holdingsList.slice(0, 6).map((h: any, i: number) => `
    <tr style="border-bottom: 1px solid #1E293B; ${i % 2 === 1 ? 'background-color: #0E1420;' : ''}">
      <td style="padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; color: #F8FAFC;">${h.ticker || h.symbol}</td>
      <td style="padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 11px; color: #CBD5E1; text-align: right;">${h.quantity}</td>
      <td style="padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8; text-align: right;">${h.avgPriceFormatted || h.buyPrice || '₹1,000.00'}</td>
      <td style="padding: 8px 12px; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 600; color: #C6A15B; text-align: right;">${h.totalValueFormatted || '₹25,000.00'}</td>
    </tr>
  `).join('');

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Your executed position entries for the <strong style="color: #C6A15B;">${planName}</strong> strategy mandate have been securely logged and placed into the <strong>Analyst Verification Queue</strong>.</p>

    <!-- Submitted Basket Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid #1E293B; border-radius: 10px; margin: 20px 0; overflow: hidden;">
      <tr style="background-color: #0E1420; border-bottom: 1px solid #1E293B;">
        <th style="padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #94A3B8; text-align: left; text-transform: uppercase;">Ticker</th>
        <th style="padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #94A3B8; text-align: right; text-transform: uppercase;">Qty</th>
        <th style="padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #94A3B8; text-align: right; text-transform: uppercase;">Avg Price</th>
        <th style="padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #94A3B8; text-align: right; text-transform: uppercase;">Position Total</th>
      </tr>
      ${holdingsRows}
      <tr style="background-color: #172235;">
        <td colspan="3" style="padding: 10px 12px; font-family: 'Cinzel', Georgia, serif; font-size: 11px; font-weight: 700; color: #F8FAFC;">TOTAL REPORTED CAPITAL</td>
        <td style="padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700; color: #1E8E5A; text-align: right;">${totalInvestmentFormatted}</td>
      </tr>
    </table>

    ${holdingsList.length > 6 ? `
    <p style="font-size: 11px; color: #94A3B8; font-style: italic; margin-top: -10px; text-align: right;">
      + ${holdingsList.length - 6} additional holdings recorded.
    </p>
    ` : ''}

    <div style="background-color: rgba(198, 161, 91, 0.08); border-left: 3px solid #C6A15B; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12px; color: #E2E8F0; font-weight: 600;">Verification SLA: 24–48 Hours</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
        Our research desk will audit your entries against model basket constraints. You will receive an immediate notification when clearance is issued.
      </div>
    </div>
  `;

  return {
    subject: `Holdings Received for Analyst Verification (SLA: 24–48 Hrs) • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Logged ${holdingsCount} positions (${totalInvestmentFormatted}) for ${planName}. Verification underway.`,
      badgeText: 'PORTFOLIO AUDIT',
      badgeColor: 'brass',
      headline: 'Executed Holdings Received for Audit',
      subheadline: `Verification underway for your ${planName} mandate (Reference: ${portfolioId.slice(0, 10)}).`,
      bodyHtml,
      primaryCta: {
        text: 'View Verification Status',
        url: portalUrl
      },
      footerNotice: 'Regulatory SLA applies during market hours (Mon-Fri 09:15 - 15:30 IST).'
    })
  };
}
// -------------------------------------------------------------------------------------------------
export interface PortfolioClearanceEmailData {
  userName: string;
  planName?: string;
  mandateName?: string;
  portfolioId?: string;
  clearedCapitalFormatted?: string;
  portfolioNav?: string;
  clearedAtFormatted?: string;
  clearanceDate?: string;
  clearedStocksCount?: number;
  analystName?: string;
  leadAnalystNotes?: string;
  analystRemarks?: string;
  portfolioUrl?: string;
  portalUrl?: string;
}

export function buildAnalystPortfolioClearanceEmail(data: PortfolioClearanceEmailData): { subject: string; html: string } {
  const portfolioUrl = data.portalUrl || data.portfolioUrl || 'https://arthresearch.com/portfolio';
  const planName = data.mandateName || data.planName || 'Institutional Advisory Mandate';
  const clearedCapital = data.portfolioNav || data.clearedCapitalFormatted || 'Active Deployed Capital';
  const clearedDate = data.clearanceDate || data.clearedAtFormatted || new Date().toLocaleDateString('en-IN');
  const analystNote = data.analystRemarks || data.leadAnalystNotes;

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>We are pleased to inform you that your executed holdings for <strong style="color: #C6A15B;">${planName}</strong> have successfully passed quantitative audit rules. Formal clearance has been issued.</p>

    <!-- Clearance Certificate Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid rgba(30, 142, 90, 0.4); border-radius: 10px; margin: 20px 0; overflow: hidden;">
      <tr style="background-color: rgba(30, 142, 90, 0.15); border-bottom: 1px solid rgba(30, 142, 90, 0.3);">
        <td colspan="2" style="padding: 12px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #1E8E5A; text-transform: uppercase;">
                &#10004; MANDATE CLEARANCE CERTIFICATE
              </td>
              <td align="right" style="font-family: 'Courier New', monospace; font-size: 10px; color: #94A3B8;">${clearedDate}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8; width: 40%;">CLEARED STRATEGY</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #F8FAFC; font-weight: 600;">${planName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B; background-color: #0E1420;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">ACTIVE DEPLOYED CAPITAL</td>
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 12px; color: #1E8E5A; font-weight: 700;">${clearedCapital}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">AUDIT STATUS</td>
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #1E8E5A; font-weight: 700; text-transform: uppercase;">ACTIVE &bull; TELEMETRY LIVE</td>
      </tr>
      ${analystNote ? `
      <tr style="background-color: #0E1420;">
        <td style="padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">ANALYST NOTE</td>
        <td style="padding: 10px 16px; font-size: 12px; color: #CBD5E1; line-height: 1.5;">${analystNote}</td>
      </tr>
      ` : ''}
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
      Your portfolio dashboard is now unlocked with live trailing NAV tracking, factor weight analytics, and algorithmic rebalance telemetry.
    </p>
  `;

  return {
    subject: `🎉 Portfolio Clearance Issued • Your Strategy is Now Active • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Formal analyst clearance issued for ${planName}. Deployed capital: ${clearedCapital}.`,
      badgeText: 'MANDATE CLEARED',
      badgeColor: 'emerald',
      headline: 'Portfolio Approved & Mandate Active',
      subheadline: `Research clearance granted for ${planName}. Live strategy telemetry is active.`,
      bodyHtml,
      primaryCta: {
        text: 'Open Live Portfolio Desk',
        url: portfolioUrl
      },
      footerNotice: 'SEBI RA compliance: Initial basket reconciled against strategy allocation tolerance.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 10. HOLDINGS REVISION REQUESTED
// -------------------------------------------------------------------------------------------------
export interface HoldingsRevisionEmailData {
  userName: string;
  planName?: string;
  mandateName?: string;
  portfolioId?: string;
  rejectionReason?: string;
  reasonSummary?: string;
  submittedCapitalFormatted?: string;
  analystName?: string;
  reviewDate?: string;
  actionItems?: string[];
  updateUrl?: string;
  portalUrl?: string;
}

export function buildHoldingsRevisionRequestedEmail(data: HoldingsRevisionEmailData): { subject: string; html: string } {
  const updateUrl = data.portalUrl || data.updateUrl || `https://arthresearch.com/setup-portfolio?portfolioId=${data.portfolioId || ''}`;
  const planName = data.mandateName || data.planName || 'Institutional Advisory Mandate';
  const reason = data.reasonSummary || data.rejectionReason || 'Holdings require adjustment.';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Our quantitative analyst desk has completed the initial audit for your submitted entries in <strong style="color: #C6A15B;">${planName}</strong>. Certain positions require adjustment before active clearance can be granted.</p>

    <!-- Analyst Remarks Box -->
    <div style="background-color: rgba(179, 40, 63, 0.1); border: 1px solid rgba(179, 40, 63, 0.35); border-radius: 8px; padding: 18px; margin: 20px 0;">
      <div style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #E05263; text-transform: uppercase;">
        &#9888; Research Analyst Audit Remarks
      </div>
      <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #F8FAFC; margin-top: 8px; line-height: 1.6; background-color: #0A0E16; padding: 12px; border-radius: 6px; border: 1px solid #1E293B;">
        "${reason}"
      </div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">
        Please rectify the indicated position quantities or average execution prices on your portfolio configuration desk.
      </div>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
      Click the button below to update your holdings and resubmit for priority re-verification.
    </p>
  `;

  return {
    subject: `Action Needed: Mandate Revisions Required for ${planName} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Analyst revision remarks for ${planName}: ${reason.slice(0, 80)}... Update holdings.`,
      badgeText: 'REVISION REQUIRED',
      badgeColor: 'garnet',
      headline: 'Holdings Revision Required',
      subheadline: `Analyst feedback for your ${planName} execution entries.`,
      bodyHtml,
      primaryCta: {
        text: 'Update & Resubmit Holdings',
        url: updateUrl
      },
      footerNotice: 'Prompt resubmission ensures priority queue processing within 12–24 hours.'
    })
  };
}

export const buildPortfolioClearanceEmail = (data: any) => {
  return buildAnalystPortfolioClearanceEmail({
    userName: data.userName,
    planName: data.mandateName || data.planName || 'Strategy Mandate',
    portfolioId: data.portfolioId || 'PORT-ACTIVE',
    clearedCapitalFormatted: data.portfolioNav || data.clearedCapitalFormatted || '₹84,50,000.00',
    clearedAtFormatted: data.clearanceDate || data.clearedAtFormatted || '19 Sep 2026',
    leadAnalystNotes: data.analystRemarks || data.leadAnalystNotes,
    portfolioUrl: data.portalUrl || data.portfolioUrl
  });
};

export const buildHoldingsRevisionEmail = (data: any) => {
  return buildHoldingsRevisionRequestedEmail({
    userName: data.userName,
    planName: data.mandateName || data.planName || 'Strategy Mandate',
    portfolioId: data.portfolioId || 'PORT-REVISION',
    rejectionReason: data.reasonSummary || data.rejectionReason || 'Holdings require adjustment.',
    submittedCapitalFormatted: data.submittedCapitalFormatted || '₹84,50,000.00',
    updateUrl: data.portalUrl || data.updateUrl
  });
};
