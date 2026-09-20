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
  const portalUrl = data.portalUrl || 'https://arthresearch.web.app/portfolio-pending';
  const planName = data.mandateName || data.planName || 'Institutional Strategy';
  const holdingsList: HoldingEntryItem[] = (data.holdingsList && data.holdingsList.length > 0)
    ? data.holdingsList
    : [];
  const totalInvestmentFormatted = data.totalPortfolioValue || data.totalInvestmentFormatted || '₹0.00';
  const holdingsCount = data.totalHoldingsCount || data.holdingsCount || holdingsList.length;
  const portfolioId = data.portfolioId || 'PORT-SUBMITTED';

  const holdingsRows = holdingsList.length > 0 ? holdingsList.map((h: any, i: number) => `
    <tr style="border-bottom: 1px solid #E2E8F0; ${i % 2 === 1 ? 'background-color: #F8FAFC;' : 'background-color: #FFFFFF;'}">
      <td style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 700; color: #0F172A;">${h.ticker || h.symbol}</td>
      <td style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 600; color: #334155; text-align: right;">${h.quantity}</td>
      <td style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #475569; text-align: right;">${h.avgPriceFormatted || h.buyPrice || '₹1,000.00'}</td>
      <td style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 700; color: #0F172A; text-align: right;">${h.totalValueFormatted || '₹0.00'}</td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="4" style="padding: 14px; text-align: center; color: #64748B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
        ${holdingsCount} Holdings Logged for Clearance
      </td>
    </tr>
  `;

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Your executed position entries for the <strong style="color: #92400E;">${planName}</strong> strategy mandate have been securely logged and placed into the <strong>Analyst Verification Queue</strong>.
    </p>

    <!-- Submitted Basket Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr style="background-color: #0F172A; border-bottom: 1px solid #1E293B;">
        <th style="padding: 11px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10.5px; font-weight: 700; color: #FFFFFF; text-align: left; text-transform: uppercase;">Ticker</th>
        <th style="padding: 11px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10.5px; font-weight: 700; color: #FFFFFF; text-align: right; text-transform: uppercase;">Qty</th>
        <th style="padding: 11px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10.5px; font-weight: 700; color: #FFFFFF; text-align: right; text-transform: uppercase;">Avg Price</th>
        <th style="padding: 11px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10.5px; font-weight: 700; color: #FFFFFF; text-align: right; text-transform: uppercase;">Position Total</th>
      </tr>
      ${holdingsRows}
      <tr style="background-color: #F8FAFC; border-top: 2px solid #E2E8F0;">
        <td colspan="3" style="padding: 12px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 700; color: #0F172A;">TOTAL REPORTED CAPITAL</td>
        <td style="padding: 12px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 700; color: #059669; text-align: right;">${totalInvestmentFormatted}</td>
      </tr>
    </table>

    ${holdingsList.length > 6 ? `
    <p style="font-size: 11px; color: #64748B; font-style: italic; margin-top: -10px; text-align: right;">
      + ${holdingsList.length - 6} additional holdings recorded.
    </p>
    ` : ''}

    <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12.5px; color: #92400E; font-weight: 700;">Verification SLA: 24–48 Hours</div>
      <div style="font-size: 12px; color: #78350F; margin-top: 3px; line-height: 1.5;">
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
  const portfolioUrl = data.portalUrl || data.portfolioUrl || 'https://arthresearch.web.app/portfolio';
  const planName = data.mandateName || data.planName || 'Institutional Advisory Mandate';
  const clearedCapital = data.portfolioNav || data.clearedCapitalFormatted || 'Active Deployed Capital';
  const clearedDate = data.clearanceDate || data.clearedAtFormatted || new Date().toLocaleDateString('en-IN');
  const analystNote = data.analystRemarks || data.leadAnalystNotes;

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      We are pleased to inform you that your executed holdings for <strong style="color: #92400E;">${planName}</strong> have successfully passed quantitative audit rules. Formal clearance has been issued.
    </p>

    <!-- Clearance Certificate Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #BBF7D0; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr style="background-color: #DCFCE7; border-bottom: 1px solid #BBF7D0;">
        <td style="padding: 12px 16px;">
          <span style="font-family: 'Cinzel', Georgia, serif; font-size: 12.5px; font-weight: 700; color: #166534; text-transform: uppercase;">
            &#10004; MANDATE CLEARANCE CERTIFICATE
          </span>
        </td>
        <td align="right" style="padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #15803D; font-weight: 600;">
          ${clearedDate}
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B; width: 40%;">CLEARED STRATEGY</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #0F172A; font-weight: 700;">${planName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">ACTIVE DEPLOYED CAPITAL</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #059669; font-weight: 700;">${clearedCapital}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">AUDIT STATUS</td>
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #059669; font-weight: 700; text-transform: uppercase;">ACTIVE &bull; TELEMETRY LIVE</td>
      </tr>
      ${analystNote ? `
      <tr style="background-color: #F8FAFC;">
        <td style="padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; color: #64748B;">ANALYST NOTE</td>
        <td style="padding: 10px 16px; font-size: 12px; color: #334155; line-height: 1.5;">${analystNote}</td>
      </tr>
      ` : ''}
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Your portfolio dashboard is now unlocked with live position tracking, factor weight analytics, and algorithmic rebalance telemetry.
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
      footerNotice: 'Research clearance: Initial basket reconciled against strategy allocation tolerance.'
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
  const updateUrl = data.portalUrl || data.updateUrl || `https://arthresearch.web.app/setup-portfolio?portfolioId=${data.portfolioId || ''}`;
  const planName = data.mandateName || data.planName || 'Institutional Advisory Mandate';
  const reason = data.reasonSummary || data.rejectionReason || 'Holdings require adjustment.';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Our quantitative analyst desk has completed the initial audit for your submitted entries in <strong style="color: #92400E;">${planName}</strong>. Certain positions require adjustment before active clearance can be granted.
    </p>

    <!-- Analyst Remarks Box -->
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <div style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #991B1B; text-transform: uppercase;">
        &#9888; Research Analyst Audit Remarks
      </div>
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; color: #0F172A; font-weight: 600; margin-top: 8px; line-height: 1.6; background-color: #FFFFFF; padding: 12px; border-radius: 6px; border: 1px solid #FCA5A5;">
        "${reason}"
      </div>
      <div style="font-size: 11.5px; color: #7F1D1D; margin-top: 8px; line-height: 1.5;">
        Please rectify the indicated position quantities or average execution prices on your portfolio configuration desk.
      </div>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
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
    clearedCapitalFormatted: data.portfolioNav || data.clearedCapitalFormatted || '₹4,999.00',
    clearedAtFormatted: data.clearanceDate || data.clearedAtFormatted || new Date().toLocaleDateString('en-IN'),
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
    submittedCapitalFormatted: data.submittedCapitalFormatted || '₹4,999.00',
    updateUrl: data.portalUrl || data.updateUrl
  });
};
