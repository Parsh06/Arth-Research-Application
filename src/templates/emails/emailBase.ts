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
    brass: 'background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;',
    emerald: 'background-color: #DCFCE7; color: #166534; border: 1px solid #BBF7D0;',
    sapphire: 'background-color: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE;',
    garnet: 'background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;',
    zinc: 'background-color: #F1F5F9; color: #334155; border: 1px solid #CBD5E1;'
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
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F1F5F9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; }
    
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid-padding { padding: 24px 18px !important; }
      .header-padding { padding: 20px 18px 16px 18px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${previewText} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <!-- Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);">
          
          <!-- Top Accent Stripe -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #D97706 0%, #0F172A 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td class="header-padding" style="padding: 24px 32px 18px 32px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          <!-- Official Emblem Logo -->
                          <div style="width: 38px; height: 38px; background-color: #1E293B; border: 1px solid rgba(217, 119, 6, 0.5); border-radius: 8px; text-align: center; vertical-align: middle; overflow: hidden;">
                            <img src="https://arthresearch.web.app/logo1.png" alt="Arth Research" width="28" height="28" style="display: block; margin: 5px auto; width: 28px; height: 28px; border: 0; outline: none; object-fit: contain;" />
                          </div>
                        </td>
                        <td>
                          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 16px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; line-height: 1.1;">ARTH RESEARCH</div>
                          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Institutional Quant Advisory</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 5px 9px; border-radius: 6px; ${badgeStyles}">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="fluid-padding" style="padding: 32px 32px 28px 32px; background-color: #FFFFFF;">
              <!-- Headline -->
              <h1 style="margin: 0 0 8px 0; font-family: 'Cinzel', Georgia, serif; font-size: 21px; font-weight: 700; color: #0F172A; line-height: 1.35; letter-spacing: -0.2px;">
                ${headline}
              </h1>

              ${subheadline ? `
              <p style="margin: 0 0 22px 0; font-size: 13.5px; line-height: 1.6; color: #475569; font-weight: 400;">
                ${subheadline}
              </p>
              ` : '<div style="height: 12px;"></div>'}

              <!-- Injected Body Content -->
              <div style="font-size: 13.5px; line-height: 1.65; color: #334155;">
                ${bodyHtml}
              </div>

              <!-- Action CTAs -->
              ${(primaryCta || secondaryCta) ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; padding-top: 22px; border-top: 1px solid #E2E8F0;">
                <tr>
                  <td align="center" style="text-align: center;">
                    ${primaryCta ? `
                    <a href="${primaryCta.url}" target="_blank" class="cta-button" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 13px 26px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); margin: 6px 4px;">
                      ${primaryCta.text} &rarr;
                    </a>
                    ` : ''}

                    ${secondaryCta ? `
                    <a href="${secondaryCta.url}" target="_blank" class="cta-button" style="display: inline-block; background-color: #F8FAFC; color: #0F172A; border: 1px solid #CBD5E1; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; padding: 12px 22px; border-radius: 8px; text-decoration: none; margin: 6px 4px;">
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
            <td style="padding: 14px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #64748B; line-height: 1.5;">
                    &#128274; <strong>SECURITY NOTICE:</strong> ${footerNotice}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Institutional Regulatory Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <span style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; font-weight: 700; color: #0F172A; letter-spacing: 0.8px;">ARTH RESEARCH</span>
                    <span style="font-size: 11px; color: #94A3B8; margin: 0 6px;">&bull;</span>
                    <span style="font-size: 10.5px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #475569;">SEBI REGISTRATION NO: INH00001234</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 10.5px; line-height: 1.6; color: #64748B; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 10px;">
                    Securities trading and quantitative equities research carry inherent market risk. Read all scheme documents and model strategy mandates carefully before execution. Past model performance is no guarantee of future returns.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 10px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px;">
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
