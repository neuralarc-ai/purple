import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const issueType = formData.get('issueType') as string;
    const description = formData.get('description') as string;
    const sharedLink = formData.get('sharedLink') as string;
    const email = formData.get('email') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validate required fields
    if (!issueType || !description || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let screenshotPath: string | null = null;
    let screenshotUrl: string | null = null;

    // Upload screenshot to Supabase Storage if provided
    if (screenshot && screenshot.size > 0) {
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) {
        console.error('Error uploading screenshot:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload screenshot' },
          { status: 500 }
        );
      }

      screenshotPath = uploadData.path;

      // Get signed URL for the uploaded file (works for private buckets)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('feedback-screenshots')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry
      
      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        // Fallback to public URL
        const { data: urlData } = supabase.storage
          .from('feedback-screenshots')
          .getPublicUrl(fileName);
        screenshotUrl = urlData.publicUrl;
      } else {
        screenshotUrl = signedUrlData.signedUrl;
      }
      console.log('Screenshot uploaded successfully:', {
        fileName,
        screenshotPath,
        screenshotUrl,
        bucketName: 'feedback-screenshots'
      });
    }

    // Get user's accounts using the RPC function
    const { data: accountsData, error: accountsError } = await supabase.rpc('get_accounts');

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      console.error('User ID:', user.id);
      return NextResponse.json(
        { error: 'Error fetching account information' },
        { status: 500 }
      );
    }

    // Find the personal account for this user
    const personalAccount = accountsData?.find((account: any) => account.personal_account);
    
    if (!personalAccount) {
      console.error('No personal account found for user:', user.id);
      return NextResponse.json(
        { error: 'No personal account found' },
        { status: 500 }
      );
    }

    console.log('Personal account data:', personalAccount);

    // Insert feedback ticket into database
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_tickets')
      .insert({
        user_id: user.id,
        account_id: personalAccount.account_id,
        issue_type: issueType,
        description: description,
        shared_link: sharedLink || null,
        email: email,
        screenshot_path: screenshotPath,
        screenshot_url: screenshotUrl,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Send email notification to team
    try {
      await sendFeedbackNotification(feedbackData);
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedbackData.id,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendFeedbackNotification(feedbackData: any) {
  try {
    // Create transporter using SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Determine sender email based on environment
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'PRODUCTION';
    const fromEmail = envMode === 'PRODUCTION' 
      ? 'dev@neuralarc.ai' 
      : process.env.FROM_EMAIL || process.env.SENDER_EMAIL || 'dev@neuralarc.ai';
    
    const fromName = process.env.FROM_NAME || 'Team Helium';
    const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL || 'dev@neuralarc.ai';

    // Format screenshot if available
    const screenshotHtml = feedbackData.screenshot_url 
      ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">Screenshot:</h3>
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #f8f9fa;">
            <img src="${feedbackData.screenshot_url}" 
                 alt="Screenshot" 
                 style="max-width: 100%; height: auto; display: block; margin: 0 auto;" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div style="display: none; text-align: center; color: #666; font-style: italic;">
              Screenshot not accessible. Direct link: <a href="${feedbackData.screenshot_url}" target="_blank">View Screenshot</a>
            </div>
          </div>
          <p style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>Direct Link:</strong> <a href="${feedbackData.screenshot_url}" target="_blank">${feedbackData.screenshot_url}</a>
          </p>
        </div>
      `
      : '';

    // Format shared link if available
    const sharedLinkHtml = feedbackData.shared_link 
      ? `
        <div style="margin-top: 15px;">
          <strong>Shared Link:</strong> 
          <a href="${feedbackData.shared_link}" style="color: #007bff; text-decoration: none;">
            ${feedbackData.shared_link}
          </a>
        </div>
      `
      : '';

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Feedback Ticket</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px -20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            color: #333;
          }
          .field {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #007bff;
          }
          .field-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
          }
          .field-value {
            color: #333;
          }
          .description {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            white-space: pre-wrap;
            font-family: monospace;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
          }
          .priority-high {
            border-left-color: #dc3545;
          }
          .priority-medium {
            border-left-color: #ffc107;
          }
          .priority-low {
            border-left-color: #28a745;
          }
          .status-open {
            background-color: #d4edda;
            color: #155724;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🚨 New Feedback Ticket</h1>
          </div>
          
          <div class="content">
            <div class="field priority-${feedbackData.priority || 'medium'}">
              <div class="field-label">Ticket ID:</div>
              <div class="field-value">${feedbackData.id || 'Unknown'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Status:</div>
              <div class="field-value">
                <span class="status-open">${(feedbackData.status || 'open').toUpperCase()}</span>
              </div>
            </div>
            
            <div class="field">
              <div class="field-label">Issue Type:</div>
              <div class="field-value">${feedbackData.issue_type || 'Not specified'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Priority:</div>
              <div class="field-value">${(feedbackData.priority || 'medium').toUpperCase()}</div>
            </div>
            
            <div class="field">
              <div class="field-label">User Email:</div>
              <div class="field-value">${feedbackData.email || 'Not provided'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">User ID:</div>
              <div class="field-value">${feedbackData.user_id || 'Unknown'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Account ID:</div>
              <div class="field-value">${feedbackData.account_id || 'Unknown'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Created At:</div>
              <div class="field-value">${feedbackData.created_at || 'Unknown'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Description:</div>
              <div class="description">${feedbackData.description || 'No description provided'}</div>
            </div>
            
            ${sharedLinkHtml}
            ${screenshotHtml}
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Helium AI Feedback System</p>
            <p>Helium AI by Neural Arc Inc. | <a href="https://he2.ai" style="color: #007bff;">he2.ai</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create text version
    const textContent = `
NEW FEEDBACK TICKET

Ticket ID: ${feedbackData.id || 'Unknown'}
Status: ${(feedbackData.status || 'open').toUpperCase()}
Issue Type: ${feedbackData.issue_type || 'Not specified'}
Priority: ${(feedbackData.priority || 'medium').toUpperCase()}
User Email: ${feedbackData.email || 'Not provided'}
User ID: ${feedbackData.user_id || 'Unknown'}
Account ID: ${feedbackData.account_id || 'Unknown'}
Created At: ${feedbackData.created_at || 'Unknown'}

Description:
${feedbackData.description || 'No description provided'}
${feedbackData.shared_link ? `\nShared Link: ${feedbackData.shared_link}` : ''}
${feedbackData.screenshot_url ? `\nScreenshot: ${feedbackData.screenshot_url}` : ''}

---
This is an automated notification from Helium AI Feedback System
Helium AI by Neural Arc Inc. | https://he2.ai
    `;

    // Send email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: teamEmail,
      subject: `New Feedback: ${feedbackData.issue_type || 'Unknown Issue'} - Ticket #${feedbackData.id || 'Unknown'}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Feedback notification email sent:', info.messageId);
    
  } catch (error) {
    console.error('Error sending feedback notification email:', error);
    throw error;
  }
}
