// src/templates/emails/governanceTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 16. ACCOUNT ACCESS REVOKED (WITH SUPERVISOR BASIS)
// -------------------------------------------------------------------------------------------------
export interface AccountRevokedEmailData {
  userName: string;
  userEmail: string;
  revocationDate: string;
  reason: string;
  supervisorName?: string;
  supervisorRole?: string;
  appealUrl?: string;
}

export function buildAccountRevokedEmail(data: AccountRevokedEmailData): { subject: string; html: string } {
  const appealUrl = data.appealUrl || 'https://arthresearch.com/support';
  const supervisor = data.supervisorName ? `${data.supervisorName} (${data.supervisorRole || 'Compliance Officer'})` : 'Supervisory Risk Committee';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Notice is hereby given that terminal privileges for account <strong style="color: #CBD5E1;">${data.userEmail}</strong> have been suspended under institutional risk and compliance directives.</p>

    <!-- Revocation Reason Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #171115; border: 1px solid rgba(179, 40, 63, 0.4); border-radius: 10px; margin: 20px 0; padding: 18px;">
      <tr>
        <td>
          <div style="font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; color: #E05263; letter-spacing: 1px; text-transform: uppercase;">
            &#9888; OFFICIAL REVOCATION RECORD
          </div>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
            <tr>
              <td style="font-size: 11px; color: #94A3B8; font-family: 'Courier New', monospace;" width="130">Effective Date:</td>
              <td style="font-size: 12px; color: #CBD5E1; font-family: 'Courier New', monospace; font-weight: 600;">${data.revocationDate}</td>
            </tr>
            <tr>
              <td style="font-size: 11px; color: #94A3B8; font-family: 'Courier New', monospace; padding-top: 6px;">Authorized By:</td>
              <td style="font-size: 12px; color: #CBD5E1; font-family: 'Courier New', monospace; font-weight: 600; padding-top: 6px;">${supervisor}</td>
            </tr>
          </table>

          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(179, 40, 63, 0.2);">
            <div style="font-size: 11px; font-weight: 700; color: #E05263; text-transform: uppercase; margin-bottom: 6px;">
              Supervisor Basis & Findings:
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #F1F5F9; background-color: #0F0A0E; padding: 12px 14px; border-radius: 6px; border-left: 3px solid #E05263;">
              ${data.reason}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
      While access to live quantitative signals and order feeds is suspended, existing transaction records and billing history remain archived in accordance with statutory retention regulations.
    </p>
    
    <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
      If you believe this administrative action was taken in error or wish to submit KYC documentation for remediation, please contact compliance desk immediately.
    </p>
  `;

  return {
    subject: '[NOTICE] Account Access Revoked • Arth Research Compliance',
    html: wrapEmailInBaseTemplate({
      previewText: 'Official notice regarding suspension of your Arth Research terminal privileges.',
      badgeText: 'GOVERNANCE AUDIT ACTION',
      badgeColor: 'garnet',
      headline: 'Terminal Access Revoked',
      subheadline: 'Compliance Notice & Supervisor Risk Assessment',
      bodyHtml,
      primaryCta: {
        text: 'Contact Compliance Desk',
        url: appealUrl
      },
      footerNotice: 'This action has been logged in the SEBI-mandated compliance register with immutable timestamps.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 17. ACCOUNT REACTIVATED NOTICE
// -------------------------------------------------------------------------------------------------
export interface AccountReactivatedEmailData {
  userName: string;
  userEmail: string;
  reactivationDate: string;
  planName?: string;
  portalUrl?: string;
}

export function buildAccountReactivatedEmail(data: AccountReactivatedEmailData): { subject: string; html: string } {
  const portalUrl = data.portalUrl || 'https://arthresearch.com/login';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>We are pleased to notify you that institutional access for account <strong style="color: #CBD5E1;">${data.userEmail}</strong> has been <strong>fully reinstated and verified</strong> by our supervisory desk.</p>

    <!-- Reactivation Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #101F18; border: 1px solid rgba(30, 142, 90, 0.4); border-radius: 10px; margin: 20px 0; padding: 18px;">
      <tr>
        <td>
          <div style="font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; color: #1E8E5A; letter-spacing: 1px; text-transform: uppercase;">
            &#10004; ACCESS CLEARANCE RESTORED
          </div>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
            <tr>
              <td style="font-size: 11px; color: #94A3B8; font-family: 'Courier New', monospace;" width="140">Reactivation Timestamp:</td>
              <td style="font-size: 12px; color: #CBD5E1; font-family: 'Courier New', monospace; font-weight: 600;">${data.reactivationDate}</td>
            </tr>
            ${data.planName ? `
            <tr>
              <td style="font-size: 11px; color: #94A3B8; font-family: 'Courier New', monospace; padding-top: 6px;">Active Mandate:</td>
              <td style="font-size: 12px; color: #C6A15B; font-family: 'Courier New', monospace; font-weight: 700; padding-top: 6px;">${data.planName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="font-size: 11px; color: #94A3B8; font-family: 'Courier New', monospace; padding-top: 6px;">Status:</td>
              <td style="font-size: 12px; color: #1E8E5A; font-family: 'Courier New', monospace; font-weight: 700; padding-top: 6px;">CLEAR & ACTIVE</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
      All terminal capabilities, real-time quant model signals, and portfolio rebalance notifications are now active.
    </p>
  `;

  return {
    subject: 'Account Access Restored • Welcome Back to Arth Research',
    html: wrapEmailInBaseTemplate({
      previewText: 'Your Arth Research terminal privileges have been successfully reactivated.',
      badgeText: 'ACCESS REINSTATED',
      badgeColor: 'emerald',
      headline: 'Account Reactivated',
      subheadline: 'Your institutional terminal access is active and ready.',
      bodyHtml,
      primaryCta: {
        text: 'Enter Investor Terminal',
        url: portalUrl
      },
      footerNotice: 'If you did not request this reactivation or have questions, contact security operations.'
    })
  };
}
