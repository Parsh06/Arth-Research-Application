import emailjs from '@emailjs/browser';

// ==========================================
// EMAILJS CONFIGURATION
// ==========================================
// Replace these with your actual keys from EmailJS Dashboard
const EMAILJS_SERVICE_ID = 'service_v75ep8l'; 
const EMAILJS_PUBLIC_KEY = 'aKAL0xrxEHCvoCBbW';

// Template IDs (Replace these with the IDs you get after creating templates)
const TEMPLATE_PAYMENT_SUCCESS = 'template_unp3bim'; 
const TEMPLATE_PORTFOLIO_STATUS = 'template_vfq9me5';

export const sendEmail = async (templateId: string, templateParams: Record<string, string>) => {
  try {
    if (!EMAILJS_PUBLIC_KEY) {
      console.warn("EmailJS is not configured with a Public Key. Skipping email send:", templateId, templateParams);
      return false;
    }
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('SUCCESS!', response.status, response.text);
    return true;
  } catch (err) {
    console.error('FAILED...', err);
    return false;
  }
};

export const sendPaymentSuccessEmail = async (userEmail: string, userName: string, planName: string) => {
  return sendEmail(TEMPLATE_PAYMENT_SUCCESS, {
    user_email: userEmail,
    user_name: userName || 'User',
    plan_name: planName
  });
};

export const sendPortfolioStatusEmail = async (userEmail: string, userName: string, status: string) => {
  return sendEmail(TEMPLATE_PORTFOLIO_STATUS, {
    user_email: userEmail,
    user_name: userName || 'User',
    status: status.toUpperCase()
  });
};

export const sendRebalanceNotificationEmail = async (userEmail: string, userName: string) => {
  return sendEmail('template_rebalance_alert', {
    user_email: userEmail,
    user_name: userName || 'User',
  });
};
