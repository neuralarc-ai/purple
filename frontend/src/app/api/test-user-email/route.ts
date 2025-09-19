import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    console.log('Testing user confirmation email to:', userEmail);
    
    // Create transporter using SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Determine sender email
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'PRODUCTION';
    const fromEmail = envMode === 'PRODUCTION' 
      ? 'dev@neuralarc.ai' 
      : process.env.FROM_EMAIL || process.env.SENDER_EMAIL || 'dev@neuralarc.ai';
    
    const fromName = process.env.FROM_NAME || 'Team Helium';

    console.log('Sending user confirmation email...');
    console.log('From:', fromEmail);
    console.log('To:', userEmail);

    // Create HTML email content using the exact template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Feedback Received</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 30px;">
          <tr>
            <td style="text-align: center;">
              <h2 style="color: #111827; margin-bottom: 10px;">Thank You for Your Feedback</h2>
              <p style="color: #374151; font-size: 16px; line-height: 24px;">
                Hi ${userEmail},  
                <br><br>
                We've received your feedback and our team will review it soon.  
                You can expect a response from us within the next <strong>12 hours</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you have any urgent concerns, please contact us directly at  
                <a href="mailto:dev@neuralarc.ai" style="color: #3b82f6;">dev@neuralarc.ai</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">
                &copy; 2025 NeuralArc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Create text version
    const textContent = `
Thank You for Your Feedback

Hi ${userEmail},

We've received your feedback and our team will review it soon. You can expect a response from us within the next 12 hours.

If you have any urgent concerns, please contact us directly at dev@neuralarc.ai.

© 2025 NeuralArc. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject: 'Thank You for Your Feedback - Helium AI',
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('User confirmation email sent successfully:', info.messageId);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'User confirmation email sent successfully',
      details: {
        from: fromEmail,
        to: userEmail,
        subject: 'Thank You for Your Feedback - Helium AI'
      }
    });
    
  } catch (error) {
    console.error('Error sending user confirmation email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          hasPassword: !!process.env.SMTP_PASSWORD,
        }
      },
      { status: 500 }
    );
  }
}
