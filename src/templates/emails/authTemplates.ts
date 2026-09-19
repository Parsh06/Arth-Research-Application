// src/templates/emails/authTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 1. WELCOME & ORIENTATION
// -------------------------------------------------------------------------------------------------
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  portalUrl?: string;
}

export function buildWelcomeOrientationEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const portalUrl = data.portalUrl || 'https://arthresearch.com/login';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Welcome to <strong>Arth Research</strong>. Your private investor account has been initialized and secured under institutional quantitative governance.</p>

    <!-- Key Feature Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid #1E293B; border-radius: 10px; margin: 20px 0; padding: 18px;">
      <tr>
        <td>
          <div style="font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: 700; color: #C6A15B; text-transform: uppercase; margin-bottom: 10px;">
            Your Quantitative Terminal Privileges
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #CBD5E1; line-height: 1.8;">
            <li><strong>Proprietary Alpha Models:</strong> Access mathematically audited algorithmic model strategies.</li>
            <li><strong>Analyst Portfolio Clearance:</strong> Every executed position is audited against strict mandate parameters.</li>
            <li><strong>Zero-Latency Signals:</strong> Instant rebalance dispatches with target weights and rationale.</li>
            <li><strong>Encrypted Private Ledger:</strong> Client-side cryptographic isolation and audit logging.</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
      To unlock live position monitoring and algorithmic signals, select an advisory mandate from your terminal catalog and configure your initial holdings.
    </p>
  `;

  return {
    subject: 'Welcome to Arth Research • Private Advisory Terminal',
    html: wrapEmailInBaseTemplate({
      previewText: 'Your institutional quant advisory account is now active on Arth Research.',
      badgeText: 'INVESTOR ONBOARDING',
      badgeColor: 'brass',
      headline: 'Welcome to Arth Research',
      subheadline: 'Institutional quantitative strategies, research alpha, and audited portfolio governance.',
      bodyHtml,
      primaryCta: {
        text: 'Access Investor Terminal',
        url: portalUrl
      },
      footerNotice: 'Do not share your terminal login credentials with anyone. Arth Research will never request your password.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 2. PASSWORD RESET
// -------------------------------------------------------------------------------------------------
export interface PasswordResetEmailData {
  userName: string;
  userEmail: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function buildPasswordResetEmail(data: PasswordResetEmailData): { subject: string; html: string } {
  const expiresIn = data.expiresInMinutes || 15;

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>We received a statutory request to reset the access credentials for your authenticated account (<strong style="color: #C6A15B;">${data.userEmail}</strong>).</p>

    <!-- Expiry Alert Box -->
    <div style="background-color: rgba(198, 161, 91, 0.08); border-left: 3px solid #C6A15B; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
      <div style="font-size: 12px; color: #E2E8F0; font-weight: 600;">Time-Sensitive Security Link</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
        This cryptographic password reset token expires in <strong style="color: #C6A15B;">${expiresIn} minutes</strong>.
      </div>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
      If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged and your terminal session remains secure.
    </p>
  `;

  return {
    subject: 'Reset Your Terminal Password • Arth Research',
    html: wrapEmailInBaseTemplate({
      previewText: `Cryptographic password reset link for your Arth Research account (Valid for ${expiresIn} min).`,
      badgeText: 'SECURITY PROTOCOL',
      badgeColor: 'garnet',
      headline: 'Reset Terminal Credentials',
      subheadline: 'A password reset request was initiated for your authenticated investor account.',
      bodyHtml,
      primaryCta: {
        text: 'Set New Password',
        url: data.resetUrl
      },
      footerNotice: 'If you did not request this reset, your account may be under reconnaissance. Contact compliance immediately.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 3. SECURITY LOGIN ALERT
// -------------------------------------------------------------------------------------------------
export interface SecurityLoginAlertEmailData {
  userName: string;
  userEmail: string;
  ipAddress?: string;
  deviceBrowser?: string;
  device?: string;
  locationCityCountry?: string;
  location?: string;
  timestampFormatted?: string;
  timestamp?: string;
  secureAccountUrl?: string;
  securityUrl?: string;
}

export type SecurityAlertEmailData = SecurityLoginAlertEmailData;

export function buildSecurityLoginAlertEmail(data: SecurityLoginAlertEmailData): { subject: string; html: string } {
  const secureUrl = data.secureAccountUrl || 'https://arthresearch.com/profile';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>A new terminal session was authenticated for your account (<strong style="color: #C6A15B;">${data.userEmail}</strong>).</p>

    <!-- Session Details Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141C2B; border: 1px solid #1E293B; border-radius: 10px; margin: 20px 0; overflow: hidden;">
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8; width: 35%;">TIMESTAMP</td>
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #F8FAFC; font-weight: 600;">${data.timestampFormatted}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B; background-color: #0E1420;">
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">IP ADDRESS</td>
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #C6A15B; font-weight: 600;">${data.ipAddress}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">DEVICE / CLIENT</td>
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #F8FAFC;">${data.deviceBrowser}</td>
      </tr>
      ${data.locationCityCountry ? `
      <tr style="background-color: #0E1420;">
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #94A3B8;">EST. LOCATION</td>
        <td style="padding: 10px 14px; font-family: 'Courier New', monospace; font-size: 11px; color: #F8FAFC;">${data.locationCityCountry}</td>
      </tr>
      ` : ''}
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
      If this was you, no action is required. If you do not recognize this login, please revoke your active sessions and reset your password immediately.
    </p>
  `;

  return {
    subject: '[Security Alert] New Login to Your Arth Research Terminal',
    html: wrapEmailInBaseTemplate({
      previewText: `New login detected from IP ${data.ipAddress} on ${data.timestampFormatted}.`,
      badgeText: 'SECURITY TELEMETRY',
      badgeColor: 'sapphire',
      headline: 'New Terminal Session Detected',
      subheadline: 'An authentication event occurred from a new device or IP address.',
      bodyHtml,
      primaryCta: {
        text: 'Review Active Sessions',
        url: secureUrl
      },
      footerNotice: 'Automated telemetry security alert triggered under SEBI cybersecurity compliance guidelines.'
    })
  };
}

export const buildSecurityAlertEmail = (data: any) => {
  return buildSecurityLoginAlertEmail({
    userName: data.userName,
    userEmail: data.userEmail,
    ipAddress: data.ipAddress || '103.21.124.89',
    deviceBrowser: data.device || data.deviceBrowser || 'Google Chrome / macOS',
    locationCityCountry: data.location || data.locationCityCountry || 'Mumbai, Maharashtra, India',
    timestampFormatted: data.timestamp || data.timestampFormatted || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    secureAccountUrl: data.securityUrl || data.secureAccountUrl
  });
};
