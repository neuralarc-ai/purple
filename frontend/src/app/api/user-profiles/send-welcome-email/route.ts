import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

// Custom email template function without image
const createCustomWelcomeEmailTemplate = (displayName: string, userEmail: string) => {
  return {
    subject: 'Welcome aboard!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome aboard!</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #D4D5D0;
              line-height: 1.6;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #D4D5D0;
              padding: 40px 20px;
            }
            .content-wrapper {
              background-color: #D4D5D0;
              padding: 40px;
              text-align: left;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
              font-weight: normal;
            }
            .welcome-text {
              font-size: 18px;
              color: #333;
              margin-bottom: 30px;
              font-weight: normal;
            }
            .content-text {
              font-size: 16px;
              color: #333;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .highlight {
              font-weight: bold;
              color: #333;
            }
            .mission-critical {
              text-decoration: underline;
              color: #333;
            }
            .closing {
              font-size: 16px;
              color: #333;
              margin-top: 30px;
              margin-bottom: 10px;
            }
            .signature {
              font-size: 16px;
              color: #333;
              margin-bottom: 5px;
            }
            .website-link {
              font-size: 16px;
              color: #333;
              text-decoration: underline;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              font-size: 14px;
              color: #666;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                padding: 20px 10px;
              }
              .content-wrapper {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="content-wrapper">
              <div class="greeting">Dear ${displayName},</div>
              
              <div class="welcome-text">Welcome aboard!</div>
              
              <div class="content-text">
                You are officially part of the first wave of pioneers exploring <span class="highlight">Helium's Public Beta</span>, and we could not be more excited to have you with us.
              </div>
              
              <div class="content-text">
                To kickstart your journey, we have added <span class="highlight">800 free Helium credits</span> to your account. Consider this your launch fuel to experiment, explore, and push the boundaries of what Helium can do.
              </div>
              
              <div class="content-text">
                As with any exciting first launch, there might be a few bumps along the way. If you spot something odd or have a brilliant idea for how we can make Helium even better, we would love to hear from you. Your feedback is not just welcome <span class="mission-critical">it is mission critical</span>.
              </div>
              
              <div class="content-text">
                This is more than just early access. It is your chance to help shape a platform designed to redefine how intelligence powers business.
              </div>
              
              <div class="content-text">
                Thank you for jumping in with us at this early stage. The future of AI is unfolding, and you are in the front row.
              </div>
              
              <div class="closing">Let's make this amazing together. <span class="highlight">Welcome to Helium OS</span></div>
              
              <div style="margin-top: 30px;">
                <div class="signature">Cheers,</div>
                <div class="signature">Team Helium</div>
                <div class="website-link">www.he2.ai</div>
              </div>
            </div>
            
            <div class="footer">
              Helium AI by Neural Arc Inc. https://neuralarc.ai
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Dear ${displayName},

Welcome aboard!

You are officially part of the first wave of pioneers exploring Helium's Public Beta, and we could not be more excited to have you with us.

To kickstart your journey, we have added 1500 free Helium credits to your account. Consider this your launch fuel to experiment, explore, and push the boundaries of what Helium can do.

As with any exciting first launch, there might be a few bumps along the way. If you spot something odd or have a brilliant idea for how we can make Helium even better, we would love to hear from you. Your feedback is not just welcome—it is mission critical.

This is more than just early access. It is your chance to help shape a platform designed to redefine how intelligence powers business.

Thank you for jumping in with us at this early stage. The future of AI is unfolding, and you are in the front row.

Let's make this amazing together. Welcome to Helium OS

Cheers,
Team Helium
www.he2.ai

---
Helium AI by Neural Arc Inc. https://neuralarc.ai
    `
  };
};

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get data from request
    const body = await request.json();
    const { display_name } = body;
    
    if (!display_name) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get the custom email template
    const emailTemplate = createCustomWelcomeEmailTemplate(display_name, userEmail);

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'onboarding@he2.ai', // Replace with your verified domain
      to: [userEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom welcome email sent successfully',
      emailId: emailResult.data?.id || 'unknown',
    });

  } catch (error) {
    console.error('Error sending custom welcome email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
