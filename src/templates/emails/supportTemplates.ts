// src/templates/emails/supportTemplates.ts
import { wrapEmailInBaseTemplate } from './emailBase';

// -------------------------------------------------------------------------------------------------
// 14. SUPPORT TICKET LOGGED CONFIRMATION
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
  const ticketUrl = data.ticketUrl || 'https://arthresearch.com/support';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>Your support inquiry has been registered in the institutional priority queue and assigned ticket ID <span style="font-family: 'Courier New', monospace; font-weight: 700; color: #C6A15B;">#${data.ticketId}</span>.</p>

    <!-- Ticket Summary Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121824; border: 1px solid #1E293B; border-radius: 10px; margin: 18px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; background-color: #172033; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Courier New', monospace; color: #94A3B8;">TICKET ID:</span>
                <span style="font-size: 12px; font-family: 'Courier New', monospace; font-weight: 700; color: #C6A15B; margin-left: 6px;">#${data.ticketId}</span>
              </td>
              <td align="right">
                <span style="background-color: rgba(46, 90, 166, 0.2); color: #2E5AA6; border: 1px solid rgba(46, 90, 166, 0.4); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">
                  PRIORITY: ${data.priority}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px;">
          <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;">Subject:</div>
          <div style="font-size: 13px; font-weight: 600; color: #FFFFFF; margin-bottom: 12px;">${data.subject}</div>

          <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;">Category:</div>
          <div style="font-size: 12px; font-weight: 500; color: #CBD5E1; margin-bottom: 12px;">${data.category}</div>

          <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px;">Inquiry Details:</div>
          <div style="font-size: 12px; line-height: 1.6; color: #CBD5E1; background-color: #0B0F18; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #334155;">
            ${data.messageSnippet}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
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
// 15. ANALYST TICKET REPLY NOTIFICATION
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
  const ticketUrl = data.ticketUrl || 'https://arthresearch.com/support';
  const analystRole = data.analystRole || 'Research Desk Analyst';

  const bodyHtml = `
    <p style="margin-top: 0;">Dear <strong style="color: #F8FAFC;">${data.userName}</strong>,</p>
    
    <p>A response has been posted by <strong style="color: #C6A15B;">${data.analystName}</strong> (${analystRole}) regarding support ticket <span style="font-family: 'Courier New', monospace; font-weight: 700; color: #FFFFFF;">#${data.ticketId}</span>.</p>

    <!-- Reply Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121824; border: 1px solid #1E293B; border-radius: 10px; margin: 18px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; background-color: #172033; border-bottom: 1px solid #1E293B;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; font-family: 'Courier New', monospace; color: #94A3B8;">TICKET:</span>
                <span style="font-size: 12px; font-family: 'Courier New', monospace; font-weight: 700; color: #FFFFFF; margin-left: 6px;">#${data.ticketId} &bull; ${data.subject}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 18px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 12px; font-weight: 700; color: #C6A15B;">${data.analystName}</div>
            <div style="font-size: 11px; color: #64748B; margin-left: 8px;">(${analystRole})</div>
          </div>

          <div style="font-size: 13px; line-height: 1.65; color: #E2E8F0; background-color: #0A0E16; padding: 14px 16px; border-radius: 8px; border-left: 3px solid #C6A15B;">
            ${data.replySnippet}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94A3B8;">
      If you require further clarification or wish to attach documents, please open the ticket thread on your terminal.
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
