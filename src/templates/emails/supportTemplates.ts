// src/templates/emails/supportTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 14. SUPPORT TICKET LOGGED CONFIRMATION (To Client)
// -------------------------------------------------------------------------------------------------
export interface TicketLoggedEmailData {
  userName: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  messageSnippet: string;
  ticketUrl?: string;
}

export function buildTicketLoggedEmail(data: TicketLoggedEmailData): { subject: string; html: string } {
  const ticketUrl = data.ticketUrl || 'https://arthresearch.web.app/support';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Your support inquiry has been registered in the institutional priority queue and assigned ticket ID <strong style="color: #92400E;">#${data.ticketId}</strong>.
    </p>

    <!-- Ticket Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 18px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td style="padding: 12px 18px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94A3B8;">TICKET ID:</span>
                <span style="font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #F59E0B; margin-left: 6px;">#${data.ticketId}</span>
              </td>
              <td align="right">
                <span style="background-color: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">
                  PRIORITY: ${data.priority}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; background-color: #FFFFFF;">
          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Subject:</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #0F172A; margin-bottom: 12px; margin-top: 2px;">${data.subject}</div>

          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Category:</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 12px; margin-top: 2px;">${data.category}</div>

          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Inquiry Details:</div>
          <div style="font-size: 12.5px; line-height: 1.6; color: #334155; background-color: #F8FAFC; padding: 12px 14px; border-radius: 6px; border-left: 4px solid #CBD5E1; margin-top: 4px;">
            ${data.messageSnippet}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Our research desk and technical support team will examine your ticket and provide an update. You will receive an automated alert when an analyst replies.
    </p>
  `;

  return {
    subject: `Support Ticket Received [#${data.ticketId}]: ${data.subject} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Your support ticket #${data.ticketId} has been logged. Our team is reviewing your request.`,
      badgeText: 'SUPPORT TICKET CONFIRMATION',
      badgeColor: 'sapphire',
      headline: 'Support Request Received',
      subheadline: `Ticket #${data.ticketId} has been queued for institutional review.`,
      bodyHtml,
      primaryCta: {
        text: 'View Ticket in Support Portal',
        url: ticketUrl
      },
      footerNotice: 'You can reply directly to this ticket through your Arth Research Investor Portal.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 15. ANALYST TICKET REPLY NOTIFICATION (To Client)
// -------------------------------------------------------------------------------------------------
export interface AnalystReplyEmailData {
  userName: string;
  ticketId: string;
  subject: string;
  analystName: string;
  analystRole?: string;
  replySnippet: string;
  ticketUrl?: string;
}

export function buildAnalystReplyEmail(data: AnalystReplyEmailData): { subject: string; html: string } {
  const ticketUrl = data.ticketUrl || 'https://arthresearch.web.app/support';
  const analystRole = data.analystRole || 'Research Desk Analyst';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      A response has been posted by <strong style="color: #92400E;">${data.analystName}</strong> (${analystRole}) regarding support ticket <strong style="color: #0F172A;">#${data.ticketId}</strong>.
    </p>

    <!-- Reply Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 18px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td style="padding: 12px 18px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94A3B8;">TICKET:</span>
                <span style="font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #FFFFFF; margin-left: 6px;">#${data.ticketId} &bull; ${data.subject}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 18px; background-color: #FFFFFF;">
          <div style="margin-bottom: 10px;">
            <span style="font-size: 12.5px; font-weight: 700; color: #92400E;">${data.analystName}</span>
            <span style="font-size: 11.5px; color: #64748B; margin-left: 6px;">(${analystRole})</span>
          </div>

          <div style="font-size: 13px; line-height: 1.65; color: #1E293B; background-color: #F8FAFC; padding: 14px 16px; border-radius: 6px; border-left: 4px solid #D97706;">
            ${data.replySnippet}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      If you require further clarification or wish to continue the conversation, please open the ticket thread on your terminal.
    </p>
  `;

  return {
    subject: `Analyst Reply on Ticket [#${data.ticketId}]: ${data.subject} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `New response from ${data.analystName} on ticket #${data.ticketId}.`,
      badgeText: 'ANALYST RESPONSE',
      badgeColor: 'brass',
      headline: 'New Analyst Reply',
      subheadline: `Updates on support inquiry #${data.ticketId}`,
      bodyHtml,
      primaryCta: {
        text: 'View Response & Continue Thread',
        url: ticketUrl
      },
      footerNotice: 'For compliance and record-keeping, all advisory communications are securely logged.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 16. ADMIN ALERT: NEW TICKET CREATED (To Super Admin / Support Desk)
// -------------------------------------------------------------------------------------------------
export interface AdminNewTicketAlertEmailData {
  userName: string;
  userEmail: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  messageSnippet: string;
  adminPortalUrl?: string;
}

export function buildAdminNewTicketAlertEmail(data: AdminNewTicketAlertEmailData): { subject: string; html: string } {
  const adminUrl = data.adminPortalUrl || 'https://arthresearch.web.app/admin/support';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Attention <strong style="color: #0F172A;">Advisory & Support Team</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      A new investor inquiry has been submitted and requires desk triage:
    </p>

    <!-- Admin Ticket Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 18px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td style="padding: 12px 18px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94A3B8;">TICKET ID:</span>
                <span style="font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #F59E0B; margin-left: 6px;">#${data.ticketId}</span>
              </td>
              <td align="right">
                <span style="background-color: ${data.priority === 'URGENT' || data.priority === 'HIGH' ? '#FEE2E2' : '#DBEAFE'}; color: ${data.priority === 'URGENT' || data.priority === 'HIGH' ? '#991B1B' : '#1E40AF'}; border: 1px solid #BFDBFE; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">
                  PRIORITY: ${data.priority}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; background-color: #FFFFFF;">
          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Investor Details:</div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px; margin-top: 2px;">
            ${data.userName} &bull; <a href="mailto:${data.userEmail}" style="color: #2563EB; text-decoration: none;">${data.userEmail}</a>
          </div>

          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Subject:</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #0F172A; margin-bottom: 12px; margin-top: 2px;">${data.subject}</div>

          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Category:</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #334155; margin-bottom: 12px; margin-top: 2px;">${data.category}</div>

          <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase;">Inquiry Message:</div>
          <div style="font-size: 12.5px; line-height: 1.6; color: #334155; background-color: #F8FAFC; padding: 12px 14px; border-radius: 6px; border-left: 4px solid #D97706; margin-top: 4px;">
            ${data.messageSnippet}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Please access the admin support console to assign an analyst or respond directly to the investor.
    </p>
  `;

  return {
    subject: `🚨 [Desk Alert] New Ticket #${data.ticketId}: ${data.subject} (${data.userName}) • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `New support ticket #${data.ticketId} from ${data.userName} (${data.priority} priority).`,
      badgeText: 'ADMIN ACTION REQUIRED',
      badgeColor: data.priority === 'URGENT' || data.priority === 'HIGH' ? 'garnet' : 'brass',
      headline: 'New Support Inquiry Received',
      subheadline: `Ticket #${data.ticketId} submitted by ${data.userName}`,
      bodyHtml,
      primaryCta: {
        text: 'Open Admin Support Desk',
        url: adminUrl
      },
      footerNotice: 'Arth Research Super Admin & Advisory Dispatch Alert Engine.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 17. ADMIN ALERT: USER POSTED REPLY (To Super Admin / Support Desk)
// -------------------------------------------------------------------------------------------------
export interface AdminUserReplyAlertEmailData {
  userName: string;
  userEmail: string;
  ticketId: string;
  subject: string;
  replySnippet: string;
  adminPortalUrl?: string;
}

export function buildAdminUserReplyAlertEmail(data: AdminUserReplyAlertEmailData): { subject: string; html: string } {
  const adminUrl = data.adminPortalUrl || 'https://arthresearch.web.app/admin/support';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Attention <strong style="color: #0F172A;">Advisory Desk</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      Investor <strong style="color: #0F172A;">${data.userName}</strong> has posted a new response to ticket <strong style="color: #92400E;">#${data.ticketId}</strong>.
    </p>

    <!-- Reply Details Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; margin: 18px 0; overflow: hidden; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);">
      <tr>
        <td style="padding: 12px 18px; background-color: #0F172A; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; color: #94A3B8;">TICKET:</span>
                <span style="font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #FFFFFF; margin-left: 6px;">#${data.ticketId} &bull; ${data.subject}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 18px; background-color: #FFFFFF;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 700; color: #0F172A;">${data.userName}</span>
            <span style="font-size: 11.5px; color: #64748B; margin-left: 6px;">(${data.userEmail})</span>
          </div>

          <div style="font-size: 13px; line-height: 1.65; color: #1E293B; background-color: #F8FAFC; padding: 14px 16px; border-radius: 6px; border-left: 4px solid #2563EB;">
            ${data.replySnippet}
          </div>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `💬 [Client Reply] Ticket #${data.ticketId}: ${data.subject} (${data.userName}) • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Client reply received on ticket #${data.ticketId} from ${data.userName}.`,
      badgeText: 'CLIENT RESPONSE',
      badgeColor: 'sapphire',
      headline: 'New Client Reply on Ticket',
      subheadline: `Updates on ticket #${data.ticketId}`,
      bodyHtml,
      primaryCta: {
        text: 'View Ticket & Reply',
        url: adminUrl
      },
      footerNotice: 'Arth Research Super Admin & Advisory Dispatch Alert Engine.'
    })
  };
}

// -------------------------------------------------------------------------------------------------
// 18. TICKET STATUS UPDATE NOTIFICATION (To Client)
// -------------------------------------------------------------------------------------------------
export interface TicketStatusUpdateEmailData {
  userName: string;
  ticketId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  analystRemarks?: string;
  ticketUrl?: string;
}

export function buildTicketStatusUpdateEmail(data: TicketStatusUpdateEmailData): { subject: string; html: string } {
  const ticketUrl = data.ticketUrl || 'https://arthresearch.web.app/support';
  const statusDisplay = data.status.replace('_', ' ').toUpperCase();

  const isResolved = data.status === 'resolved' || data.status === 'closed';
  const badgeColor = isResolved ? 'emerald' : data.status === 'in_progress' ? 'brass' : 'sapphire';

  const bodyHtml = `
    <p style="margin-top: 0; font-size: 14px; color: #1E293B;">Dear <strong style="color: #0F172A;">${data.userName}</strong>,</p>
    
    <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
      The status of your support inquiry <strong style="color: #0F172A;">#${data.ticketId}</strong> has been updated to:
    </p>

    <!-- Status Banner -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; text-align: center;">
      <span style="display: inline-block; font-size: 12px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.05em; padding: 6px 14px; border-radius: 6px; background-color: ${isResolved ? '#DCFCE7' : '#FEF3C7'}; color: ${isResolved ? '#166534' : '#92400E'}; border: 1px solid ${isResolved ? '#BBF7D0' : '#FDE68A'};">
        STATUS: ${statusDisplay}
      </span>
      <div style="font-size: 13.5px; font-weight: 700; color: #0F172A; margin-top: 10px;">
        ${data.subject}
      </div>
      ${data.analystRemarks ? `
        <div style="font-size: 12.5px; color: #475569; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E2E8F0; text-align: left; line-height: 1.6;">
          <strong>Desk Notes:</strong> ${data.analystRemarks}
        </div>
      ` : ''}
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      ${isResolved 
        ? 'Thank you for reaching out to Arth Research. If you have any follow-up questions or new inquiries, feel free to open a new support ticket at any time.'
        : 'Our analysts are actively investigating your request. We will notify you as soon as further updates are posted.'}
    </p>
  `;

  return {
    subject: `[Status Update: ${statusDisplay}] Support Ticket [#${data.ticketId}]: ${data.subject} • Arth Research`,
    html: wrapEmailInBaseTemplate({
      previewText: `Ticket #${data.ticketId} status updated to ${statusDisplay}.`,
      badgeText: `TICKET ${statusDisplay}`,
      badgeColor,
      headline: `Ticket Status: ${statusDisplay}`,
      subheadline: `Updates on support inquiry #${data.ticketId}`,
      bodyHtml,
      primaryCta: {
        text: 'View Ticket Thread in Portal',
        url: ticketUrl
      },
      footerNotice: 'For compliance and record-keeping, all advisory communications are securely logged.'
    })
  };
}
