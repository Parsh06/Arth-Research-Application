// src/templates/emails/emailBase.ts

export interface BaseEmailOptions {
  previewText?: string;
  badgeText?: string;
  badgeColor?: 'brass' | 'emerald' | 'sapphire' | 'garnet' | 'zinc';
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  primaryCta?: {
    text: string;
    url: string;
  };
  secondaryCta?: {
    text: string;
    url: string;
  };
  footerNotice?: string;
}

export function wrapEmailInBaseTemplate(options: BaseEmailOptions): string {
  const {
    previewText = 'Arth Research Institutional Advisory Telemetry',
    badgeText = 'QUANTITATIVE ADVISORY DESK',
    badgeColor = 'brass',
    headline,
    subheadline,
    bodyHtml,
    primaryCta,
    secondaryCta,
    footerNotice
  } = options;

  const badgeStyles = {
    brass: 'background-color: rgba(198, 161, 91, 0.15); color: #C6A15B; border: 1px solid rgba(198, 161, 91, 0.35);',
    emerald: 'background-color: rgba(30, 142, 90, 0.15); color: #1E8E5A; border: 1px solid rgba(30, 142, 90, 0.35);',
    sapphire: 'background-color: rgba(46, 90, 166, 0.15); color: #2E5AA6; border: 1px solid rgba(46, 90, 166, 0.35);',
    garnet: 'background-color: rgba(179, 40, 63, 0.15); color: #E05263; border: 1px solid rgba(179, 40, 63, 0.35);',
    zinc: 'background-color: rgba(148, 163, 184, 0.15); color: #94A3B8; border: 1px solid rgba(148, 163, 184, 0.35);'
  }[badgeColor];

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${headline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0A0E16; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }
    
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid-padding { padding: 24px 18px !important; }
      .header-padding { padding: 24px 18px 16px 18px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0E16; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${previewText} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0E16; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #101520; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Brass Accent Stripe -->
          <tr>
            <td height="3" style="background: linear-gradient(90deg, #C6A15B 0%, #2E5AA6 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td class="header-padding" style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #1E293B; background-color: #0D121C;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          <!-- Gold Logo Emblem -->
                          <div style="width: 38px; height: 38px; background-color: #151D2C; border: 1px solid rgba(198, 161, 91, 0.3); border-radius: 10px; text-align: center; line-height: 38px;">
                            <span style="font-family: 'Cinzel', Georgia, serif; font-size: 18px; font-weight: 700; color: #C6A15B; display: inline-block;">AR</span>
                          </div>
                        </td>
                        <td>
                          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 17px; font-weight: 700; color: #F8FAFC; letter-spacing: 0.5px; line-height: 1.1;">ARTH RESEARCH</div>
                          <div style="font-family: 'Courier New', monospace; font-size: 9px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Institutional Quant Advisory</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: 'Courier New', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 4px 8px; border-radius: 6px; ${badgeStyles}">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="fluid-padding" style="padding: 36px 32px 28px 32px;">
              <!-- Headline -->
              <h1 style="margin: 0 0 8px 0; font-family: 'Cinzel', Georgia, serif; font-size: 22px; font-weight: 600; color: #FFFFFF; line-height: 1.35; letter-spacing: 0.2px;">
                ${headline}
              </h1>

              ${subheadline ? `
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #94A3B8; font-weight: 400;">
                ${subheadline}
              </p>
              ` : '<div style="height: 16px;"></div>'}

              <!-- Injected Body Content -->
              <div style="font-size: 13px; line-height: 1.65; color: #CBD5E1;">
                ${bodyHtml}
              </div>

              <!-- Action CTAs -->
              ${(primaryCta || secondaryCta) ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1E293B;">
                <tr>
                  <td align="center" style="text-align: center;">
                    ${primaryCta ? `
                    <a href="${primaryCta.url}" target="_blank" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #C6A15B 0%, #A8833E 100%); color: #0A0E16; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 13px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 15px rgba(198, 161, 91, 0.3); margin: 6px 4px;">
                      ${primaryCta.text} &rarr;
                    </a>
                    ` : ''}

                    ${secondaryCta ? `
                    <a href="${secondaryCta.url}" target="_blank" class="cta-button" style="display: inline-block; background-color: #151D2C; color: #E2E8F0; border: 1px solid #334155; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 6px 4px;">
                      ${secondaryCta.text}
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Security Stamp / Specific Notice -->
          ${footerNotice ? `
          <tr>
            <td style="padding: 14px 32px; background-color: #0B0F18; border-top: 1px solid #1E293B; border-bottom: 1px solid #1E293B;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family: 'Courier New', monospace; font-size: 10px; color: #64748B; line-height: 1.5;">
                    &#128274; <strong>SECURITY NOTICE:</strong> ${footerNotice}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Institutional Regulatory Footer -->
          <tr>
            <td style="padding: 28px 32px; background-color: #0A0E16; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 14px;">
                    <span style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #C6A15B; letter-spacing: 1px;">ARTH RESEARCH</span>
                    <span style="font-size: 11px; color: #475569; margin: 0 6px;">&bull;</span>
                    <span style="font-size: 11px; font-family: 'Courier New', monospace; color: #94A3B8;">SEBI RA REGISTRATION IN PROCESS</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 10px; line-height: 1.6; color: #64748B; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 12px;">
                    Securities trading and quantitative equities research carry inherent market risk. Read all scheme documents and model strategy mandates carefully before execution. Past model performance is no guarantee of future returns.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 10px; font-family: 'Courier New', monospace; color: #475569; border-top: 1px solid #172033; padding-top: 12px;">
                    &copy; ${currentYear} Arth Research Private Wealth & Quantitative Advisory. All rights reserved.<br>
                    Confidential communication intended solely for the authenticated account holder.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
