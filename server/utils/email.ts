import { randomBytes } from 'crypto';

let mailService: any = null;

// Initialize SendGrid service if available
async function initMailService() {
  try {
    const sendgrid = await import('@sendgrid/mail');
    mailService = new sendgrid.MailService();
    if (process.env.SENDGRID_API_KEY) {
      mailService.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      console.warn("SENDGRID_API_KEY environment variable not set - email functionality disabled");
      mailService = null;
    }
  } catch (error) {
    console.warn("SendGrid package not available - email functionality disabled. Run: npm install @sendgrid/mail");
    mailService = null;
  }
}

// Initialize on module load
initMailService();

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send email: SENDGRID_API_KEY not configured');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function generatePasswordResetEmail(email: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  return {
    to: email,
    from: 'noreply@tracklit.app',
    subject: 'Reset your TrackLit password',
    text: `Reset your password by clicking this link: ${resetUrl}. This link will expire in 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">TrackLit</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8;">Track & Field Training</p>
        </div>
        
        <div style="padding: 40px 20px; background: white;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #d4af37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 TrackLit. All rights reserved.</p>
        </div>
      </div>
    `,
  };
}