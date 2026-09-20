// src/templates/emails/advisoryTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 11. URGENT PORTFOLIO REBALANCE ALERT
// -------------------------------------------------------------------------------------------------
export interface RebalanceItem {
  ticker: string;
  action: 'BUY' | 'SELL' | 'TRIM' | 'ADD' | 'EXIT';
  currentWeight?: string;
  targetWeight: string;
  cmp?: string;
  suggestedPrice?: string;
}

export interface RebalanceAlertEmailData {
  userName: string;
  mandateName: string;
  rebalanceDate: string;
  urgency: 'HIGH' | 'CRITICAL' | 'STANDARD';
  reasonSummary: string;
  items: RebalanceItem[];
  portalUrl?: string;
}

export function buildRebalanceAlertEmail(data: RebalanceAlertEmailData): { subject: string; html: string } {
  const portalUrl = data.portalUrl || 'https://arthresearch.web.app/portfolio';

  const itemsList = data.items || [];
  const rows = itemsList.map((item, i) => {
    const isBuy = item.action === 'BUY' || item.action === 'ADD';
    const isExit = item.action === 'SELL' || item.action === 'EXIT';
    const badgeBg = isBuy ? '#DCFCE7' : isExit ? '#FEE2E2' : '#FEF3C7';
    const badgeColor = isBuy ? '#166534' : isExit ? '#991B1B' : '#92400E';

    return `
      <tr style="border-bottom: 1px solid #E2E8F0; ${i % 2 === 1 ? 'background-color: #F8FAFC;' : 'background-color: #FFFFFF;'}">
        <td style="padding: 10px 12px; font-weight: 700; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
          ${item.ticker}
        </td>
        <td style="padding: 10px 12px; text-align: center;">
          <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 10.5px; font-weight: 700; padding: 4px 8px; border-radius: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">
            ${item.action}
          </span>
        </td>
        <td style="padding: 10px 12px; text-align: center; color: #64748B; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
          ${item.currentWeight || '—'}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #92400E; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
          ${item.targetWeight}
        </td>
        <td style="padding: 10px 12px; text-align: right; color: #0F172A; font-weight: 600; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
          ${item.suggestedPrice || item.cmp || 'CMP'}
        </td>
      </tr>
    `;
  }).join('');

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Our quantitative risk desk and lead research analyst have triggered an <strong>institutional rebalance mandate</strong> for your active strategy: <span style="color: #92400E; font-weight: 700;">${data.mandateName}</span>.
    </p>

    <!-- Urgency Notice -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${data.urgency === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB'}; border: 1px solid ${data.urgency === 'CRITICAL' ? '#FECACA' : '#FDE68A'}; border-radius: 8px; margin: 18px 0; padding: 16px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td>
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11.5px; font-weight: 700; color: ${data.urgency === 'CRITICAL' ? '#991B1B' : '#92400E'}; letter-spacing: 0.5px; text-transform: uppercase;">
            ${data.urgency === 'CRITICAL' ? '&#9888; CRITICAL EXECUTION ADVISORY' : '&#9888; MANDATE REBALANCE DISPATCH'}
          </div>
          <div style="font-size: 12.5px; color: #1E293B; margin-top: 6px; line-height: 1.6;">
            <strong>Analyst Rationale:</strong> ${data.reasonSummary}
          </div>
        </td>
      </tr>
    </table>

    <!-- Rebalance Execution Table -->
    <div style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #0F172A; margin: 20px 0 10px 0;">
      Recommended Execution Schedule (${data.rebalanceDate})
    </div>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <thead>
        <tr style="background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <th style="padding: 10px 12px; text-align: left; font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; color: #FFFFFF; text-transform: uppercase;">Security</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; color: #FFFFFF; text-transform: uppercase;">Action</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; color: #FFFFFF; text-transform: uppercase;">Old Wt</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; color: #FFFFFF; text-transform: uppercase;">New Wt</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; color: #FFFFFF; text-transform: uppercase;">Ref Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Please log in to your terminal to acknowledge this rebalance, review quantitative risk metrics, and synchronize your updated broker execution logs.
    </p>
  `;

  return {
    subject: `[ACTION REQUIRED] Rebalance Alert: ${data.mandateName} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Mandate Rebalance triggered for ${data.mandateName}. View target allocations.`,
      badgeText: data.urgency === 'CRITICAL' ? 'CRITICAL REBALANCE' : 'PORTFOLIO REBALANCE',
      badgeColor: data.urgency === 'CRITICAL' ? 'garnet' : 'brass',
      headline: 'Portfolio Rebalance Alert',
      subheadline: `${data.mandateName} • Risk Parameter & Allocation Adjustment`,
      bodyHtml,
      primaryCta: {
        text: 'Acknowledge & View Rebalance',
        url: portalUrl
      },
      footerNotice: 'Execute orders at suggested levels or prevailing market depth. Arth Research operates under non-discretionary advisory protocol.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 12. HIGH-CONVICTION ALPHA SIGNAL
// -------------------------------------------------------------------------------------------------
export interface AlphaSignalEmailData {
  userName: string;
  ticker: string;
  companyName: string;
  action: 'BUY' | 'ACCUMULATE' | 'SPECIAL_SITUATION';
  targetPrice: string;
  cmp: string;
  stopLoss: string;
  timeHorizon: string;
  catalyst: string;
  riskReward: string;
  signalId: string;
  signalUrl?: string;
}

export function buildAlphaSignalEmail(data: AlphaSignalEmailData): { subject: string; html: string } {
  const signalUrl = data.signalUrl || 'https://arthresearch.web.app/signals';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      A new <strong>high-conviction quant alpha signal</strong> has met proprietary multi-factor criteria and been published by the lead research desk.
    </p>

    <!-- Signal Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);">
      <tr>
        <td style="padding: 16px 20px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="font-family: 'Cinzel', Georgia, serif; font-size: 17px; font-weight: 700; color: #FFFFFF;">
                  ${data.ticker}
                </div>
                <div style="font-size: 12px; color: #CBD5E1; margin-top: 2px;">
                  ${data.companyName}
                </div>
              </td>
              <td align="right">
                <span style="background-color: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
                  ${data.action}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; background-color: #FFFFFF;">
          <!-- Metrics Grid -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td width="33%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Current Price</div>
                <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 2px;">${data.cmp}</div>
              </td>
              <td width="33%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Target Price</div>
                <div style="font-size: 15px; font-weight: 700; color: #059669; margin-top: 2px;">${data.targetPrice}</div>
              </td>
              <td width="34%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Stop Loss</div>
                <div style="font-size: 15px; font-weight: 700; color: #DC2626; margin-top: 2px;">${data.stopLoss}</div>
              </td>
            </tr>
            <tr>
              <td width="33%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Time Horizon</div>
                <div style="font-size: 13px; font-weight: 600; color: #334155; margin-top: 2px;">${data.timeHorizon}</div>
              </td>
              <td width="33%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Risk/Reward</div>
                <div style="font-size: 13px; font-weight: 700; color: #92400E; margin-top: 2px;">${data.riskReward}</div>
              </td>
              <td width="34%" style="padding: 6px;">
                <div style="font-size: 10.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Signal Ref</div>
                <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 2px;">#${data.signalId}</div>
              </td>
            </tr>
          </table>

          <!-- Fundamental Catalyst -->
          <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; margin-bottom: 4px;">Investment Thesis & Primary Catalyst</div>
            <div style="font-size: 12.5px; color: #78350F; line-height: 1.5;">${data.catalyst}</div>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Full quantitative institutional report with valuation modeling, factor sensitivity, and order execution guidelines is live on your terminal.
    </p>
  `;

  return {
    subject: `[ALPHA SIGNAL] ${data.ticker} (${data.action}) • Target: ${data.targetPrice} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `New Alpha Signal: ${data.ticker} (${data.action}) • CMP: ${data.cmp} • Target: ${data.targetPrice}`,
      badgeText: 'INSTITUTIONAL SIGNAL',
      badgeColor: 'emerald',
      headline: `Alpha Signal: ${data.ticker}`,
      subheadline: `${data.companyName} • Quantitative Research Thesis`,
      bodyHtml,
      primaryCta: {
        text: 'Access Full Institutional Report',
        url: signalUrl
      },
      footerNotice: 'Execution levels are strictly advisory. Position sizing should not exceed your individual risk mandate.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 13. MONTHLY PERFORMANCE & TAX DIGEST
// -------------------------------------------------------------------------------------------------
export interface MonthlyDigestEmailData {
  userName: string;
  monthYear: string;
  portfolioNav: string;
  monthlyReturnPct: string;
  benchmarkReturnPct: string;
  alphaGeneratedPct: string;
  realizedGainsStcg: string;
  realizedGainsLtcg: string;
  topWinnerTicker: string;
  topWinnerReturn: string;
  marketOutlookSummary: string;
  statementUrl?: string;
}

export function buildMonthlyDigestEmail(data: MonthlyDigestEmailData): { subject: string; html: string } {
  const statementUrl = data.statementUrl || 'https://arthresearch.web.app/reports';

  const isPositive = !data.monthlyReturnPct.startsWith('-');
  const returnColor = isPositive ? '#059669' : '#DC2626';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Your institutional portfolio summary and tax statement for <strong>${data.monthYear}</strong> is compiled and ready for review.
    </p>

    <!-- Key Stats Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td style="padding: 16px 20px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="font-size: 10.5px; color: #94A3B8; text-transform: uppercase;">Portfolio NAV (${data.monthYear})</div>
                <div style="font-family: 'Cinzel', Georgia, serif; font-size: 19px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${data.portfolioNav}</div>
              </td>
              <td align="right">
                <div style="font-size: 10.5px; color: #94A3B8; text-transform: uppercase;">Monthly Performance</div>
                <div style="font-size: 19px; font-weight: 700; color: ${returnColor}; margin-top: 2px;">
                  ${data.monthlyReturnPct}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px; background-color: #FFFFFF;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="33%" style="padding: 4px;">
                <div style="font-size: 10.5px; color: #64748B;">Benchmark (Nifty 500)</div>
                <div style="font-size: 13px; font-weight: 600; color: #0F172A; margin-top: 2px;">${data.benchmarkReturnPct}</div>
              </td>
              <td width="33%" style="padding: 4px;">
                <div style="font-size: 10.5px; color: #64748B;">Net Alpha Spread</div>
                <div style="font-size: 13px; font-weight: 700; color: #92400E; margin-top: 2px;">${data.alphaGeneratedPct}</div>
              </td>
              <td width="34%" style="padding: 4px;">
                <div style="font-size: 10.5px; color: #64748B;">Top Alpha Contributor</div>
                <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 2px;">${data.topWinnerTicker} (${data.topWinnerReturn})</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Realized Tax Summary -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin: 16px 0; padding: 14px 18px;">
      <tr>
        <td>
          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">
            Realized Capital Gains Summary (Fiscal Year To Date)
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #475569;">Realized STCG (Short-Term):</td>
              <td align="right" style="font-size: 12px; font-weight: 700; color: #0F172A;">${data.realizedGainsStcg}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #475569; padding-top: 4px;">Realized LTCG (Long-Term):</td>
              <td align="right" style="font-size: 12px; font-weight: 700; color: #0F172A; padding-top: 4px;">${data.realizedGainsLtcg}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CIO / Desk Outlook -->
    <div style="font-size: 12.5px; line-height: 1.6; color: #334155; margin: 18px 0;">
      <strong style="color: #0F172A;">Desk Macro Outlook:</strong> ${data.marketOutlookSummary}
    </div>
  `;

  return {
    subject: `Monthly Performance & Tax Digest • ${data.monthYear} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Your ${data.monthYear} Portfolio Performance & Capital Gains statement is ready.`,
      badgeText: 'MONTHLY PERFORMANCE DIGEST',
      badgeColor: 'brass',
      headline: `${data.monthYear} Advisory Digest`,
      subheadline: 'Performance analytics, benchmark attribution, and capital gains statement.',
      bodyHtml,
      primaryCta: {
        text: 'Download Tax & Performance PDF',
        url: statementUrl
      },
      footerNotice: 'Past returns do not guarantee future performance. Capital gains classifications are preliminary and subject to final chartered accountant audit.'
    })
  };
}
