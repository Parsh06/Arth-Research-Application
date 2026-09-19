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
  const portalUrl = data.portalUrl || 'https://arthresearch.com/portfolio';

  const itemsList = data.items || [];
  const rows = itemsList.map(item => {
    const isBuy = item.action === 'BUY' || item.action === 'ADD';
    const isExit = item.action === 'SELL' || item.action === 'EXIT';
    const badgeBg = isBuy ? 'rgba(30, 142, 90, 0.2)' : isExit ? 'rgba(179, 40, 63, 0.2)' : 'rgba(198, 161, 91, 0.2)';
    const badgeColor = isBuy ? '#1E8E5A' : isExit ? '#E05263' : '#C6A15B';

    return `
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 12px 10px; font-weight: 700; color: #FFFFFF; font-family: 'Courier New', monospace; font-size: 13px;">
          ${item.ticker}
        </td>
        <td style="padding: 12px 10px; text-align: center;">
          <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">
            ${item.action}
          </span>
        </td>
        <td style="padding: 12px 10px; text-align: center; color: #94A3B8; font-size: 12px; font-family: 'Courier New', monospace;">
          ${item.currentWeight || '—'}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: #C6A15B; font-size: 12px; font-family: 'Courier New', monospace;">
          ${item.targetWeight}
        </td>
        <td style="padding: 12px 10px; text-align: right; color: #CBD5E1; font-size: 12px; font-family: 'Courier New', monospace;">
          ${item.suggestedPrice || item.cmp || 'CMP'}
        </td>
      </tr>
    `;
  }).join('');

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Our quantitative risk desk and lead research analyst have triggered an <strong>institutional rebalance mandate</strong> for your active strategy: <span style="color: #C6A15B; font-weight: 600;">${data.mandateName}</span>.</p>

    <!-- Urgency Notice -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171620; border: 1px solid ${data.urgency === 'CRITICAL' ? 'rgba(179, 40, 63, 0.4)' : 'rgba(198, 161, 91, 0.3)'}; border-radius: 10px; margin: 18px 0; padding: 16px;">
      <tr>
        <td>
          <div style="font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; color: ${data.urgency === 'CRITICAL' ? '#E05263' : '#C6A15B'}; letter-spacing: 1px; text-transform: uppercase;">
            ${data.urgency === 'CRITICAL' ? '&#9888; CRITICAL EXECUTION ADVISORY' : '&#9888; MANDATE REBALANCE DISPATCH'}
          </div>
          <div style="font-size: 12px; color: #E2E8F0; margin-top: 6px; line-height: 1.6;">
            <strong>Analyst Rationale:</strong> ${data.reasonSummary}
          </div>
        </td>
      </tr>
    </table>

    <!-- Rebalance Execution Table -->
    <div style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #FFFFFF; margin: 20px 0 10px 0;">
      Recommended Execution Schedule (${data.rebalanceDate})
    </div>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background-color: #0F1623; border: 1px solid #1E293B; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #141C2B; border-bottom: 1px solid #1E293B;">
          <th style="padding: 10px; text-align: left; font-size: 10px; font-family: 'Courier New', monospace; color: #94A3B8; text-transform: uppercase;">Security</th>
          <th style="padding: 10px; text-align: center; font-size: 10px; font-family: 'Courier New', monospace; color: #94A3B8; text-transform: uppercase;">Action</th>
          <th style="padding: 10px; text-align: center; font-size: 10px; font-family: 'Courier New', monospace; color: #94A3B8; text-transform: uppercase;">Old Wt</th>
          <th style="padding: 10px; text-align: center; font-size: 10px; font-family: 'Courier New', monospace; color: #94A3B8; text-transform: uppercase;">New Wt</th>
          <th style="padding: 10px; text-align: right; font-size: 10px; font-family: 'Courier New', monospace; color: #94A3B8; text-transform: uppercase;">Ref Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
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
  const signalUrl = data.signalUrl || 'https://arthresearch.com/signals';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>A new <strong>high-conviction quant alpha signal</strong> has met proprietary multi-factor criteria and been published by the lead research desk.</p>

    <!-- Signal Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121824; border: 1px solid rgba(198, 161, 91, 0.3); border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; background-color: #172033; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="font-family: 'Cinzel', Georgia, serif; font-size: 18px; font-weight: 700; color: #FFFFFF;">
                  ${data.ticker}
                </div>
                <div style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                  ${data.companyName}
                </div>
              </td>
              <td align="right">
                <span style="background-color: rgba(30, 142, 90, 0.2); color: #1E8E5A; border: 1px solid rgba(30, 142, 90, 0.4); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-family: 'Courier New', monospace;">
                  ${data.action}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <!-- Metrics Grid -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td width="33%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Current Price</div>
                <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${data.cmp}</div>
              </td>
              <td width="33%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Target Price</div>
                <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #1E8E5A; margin-top: 2px;">${data.targetPrice}</div>
              </td>
              <td width="34%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Stop Loss</div>
                <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #E05263; margin-top: 2px;">${data.stopLoss}</div>
              </td>
            </tr>
            <tr>
              <td width="33%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Time Horizon</div>
                <div style="font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600; color: #CBD5E1; margin-top: 2px;">${data.timeHorizon}</div>
              </td>
              <td width="33%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Risk/Reward</div>
                <div style="font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600; color: #C6A15B; margin-top: 2px;">${data.riskReward}</div>
              </td>
              <td width="34%" style="padding: 6px;">
                <div style="font-family: 'Courier New', monospace; font-size: 9px; color: #94A3B8; text-transform: uppercase;">Signal Telemetry</div>
                <div style="font-family: 'Courier New', monospace; font-size: 12px; font-weight: 600; color: #64748B; margin-top: 2px;">#${data.signalId}</div>
              </td>
            </tr>
          </table>

          <!-- Fundamental Catalyst -->
          <div style="background-color: #0B0F18; border-left: 3px solid #C6A15B; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 10px;">
            <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: #C6A15B; text-transform: uppercase; margin-bottom: 4px;">Investment Thesis & Primary Catalyst</div>
            <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">${data.catalyst}</div>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
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
  const statementUrl = data.statementUrl || 'https://arthresearch.com/reports';

  const isPositive = !data.monthlyReturnPct.startsWith('-');
  const returnColor = isPositive ? '#1E8E5A' : '#E05263';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Your institutional portfolio summary and tax telemetry statement for <strong>${data.monthYear}</strong> is compiled and ready for review.</p>

    <!-- Key Stats Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121824; border: 1px solid #1E293B; border-radius: 12px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 18px 20px; background-color: #172033; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #94A3B8; text-transform: uppercase;">Portfolio NAV (${data.monthYear})</div>
                <div style="font-family: 'Cinzel', Georgia, serif; font-size: 20px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${data.portfolioNav}</div>
              </td>
              <td align="right">
                <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #94A3B8; text-transform: uppercase;">Monthly Performance</div>
                <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: ${returnColor}; margin-top: 2px;">
                  ${data.monthlyReturnPct}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="33%" style="padding: 4px;">
                <div style="font-size: 10px; color: #94A3B8; font-family: 'Courier New', monospace;">Benchmark (Nifty 500)</div>
                <div style="font-size: 13px; font-weight: 600; color: #CBD5E1; margin-top: 2px; font-family: 'Courier New', monospace;">${data.benchmarkReturnPct}</div>
              </td>
              <td width="33%" style="padding: 4px;">
                <div style="font-size: 10px; color: #94A3B8; font-family: 'Courier New', monospace;">Net Alpha Spread</div>
                <div style="font-size: 13px; font-weight: 700; color: #C6A15B; margin-top: 2px; font-family: 'Courier New', monospace;">${data.alphaGeneratedPct}</div>
              </td>
              <td width="34%" style="padding: 4px;">
                <div style="font-size: 10px; color: #94A3B8; font-family: 'Courier New', monospace;">Top Alpha Contributor</div>
                <div style="font-size: 13px; font-weight: 700; color: #1E8E5A; margin-top: 2px; font-family: 'Courier New', monospace;">${data.topWinnerTicker} (${data.topWinnerReturn})</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Realized Tax Telemetry -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F1623; border: 1px solid #1E293B; border-radius: 8px; margin: 16px 0; padding: 14px 18px;">
      <tr>
        <td>
          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #C6A15B; margin-bottom: 6px;">
            Realized Capital Gains Telemetry (Fiscal Year To Date)
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #94A3B8;">Realized STCG (Short-Term):</td>
              <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700; color: #FFFFFF;">${data.realizedGainsStcg}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #94A3B8; padding-top: 4px;">Realized LTCG (Long-Term):</td>
              <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700; color: #FFFFFF; padding-top: 4px;">${data.realizedGainsLtcg}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CIO / Desk Outlook -->
    <div style="font-size: 12px; line-height: 1.6; color: #CBD5E1; margin: 18px 0;">
      <strong style="color: #FFFFFF;">Desk Macro Outlook:</strong> ${data.marketOutlookSummary}
    </div>
  `;

  return {
    subject: `Monthly Performance & Tax Digest • ${data.monthYear} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Your ${data.monthYear} Portfolio Performance & Capital Gains statement is ready.`,
      badgeText: 'MONTHLY PERFORMANCE DIGEST',
      badgeColor: 'brass',
      headline: `${data.monthYear} Advisory Digest`,
      subheadline: 'Performance telemetry, benchmark attribution, and capital gains statement.',
      bodyHtml,
      primaryCta: {
        text: 'Download Tax & Performance PDF',
        url: statementUrl
      },
      footerNotice: 'Past returns do not guarantee future performance. Capital gains classifications are preliminary and subject to final chartered accountant audit.'
    })
  };
}
