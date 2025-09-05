# Email Service Configuration

This document explains how to configure the email service for sending welcome emails.

## Environment Variables

Add these variables to your `.env` file:

### Option 1: Resend (Recommended)
```bash
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Email configuration
FROM_EMAIL=onboarding@he2.ai
FROM_NAME=Team Helium
```

### Option 2: SMTP (Gmail/Other)
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email configuration
FROM_EMAIL=onboarding@he2.ai
FROM_NAME=Team Helium
```

## Setup Instructions

### Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (he2.ai)
3. Generate an API key
4. Add the API key to your environment variables

### Gmail SMTP Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification
   - Scroll to "App passwords" and generate one for "Mail"
3. Use the 16-character app password in SMTP_PASSWORD

## Testing

### Backend Test
```bash
curl -X POST http://localhost:8000/api/user-profiles/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Frontend Test
The welcome email is automatically sent when a user completes onboarding.

## Troubleshooting

### Common Issues

1. **"No email provider configured"**
   - Check that either RESEND_API_KEY or SMTP_USERNAME/SMTP_PASSWORD are set

2. **"Resend API error"**
   - Verify your API key is correct
   - Check that your domain is verified in Resend

3. **"SMTP send error"**
   - Verify SMTP credentials
   - Check that 2FA is enabled and app password is correct
   - Ensure SMTP_HOST and SMTP_PORT are correct

4. **Emails going to spam**
   - Set up SPF, DKIM, and DMARC records for your domain
   - Use a professional "from" address
   - Avoid spam trigger words

## Email Template

The welcome email includes:
- Personalized greeting with user's first name
- Welcome message for Helium Public Beta
- 800 free credits announcement
- Call-to-action button
- Professional styling with Helium branding

## Monitoring

Check logs for email sending status:
- Success: "Welcome email sent successfully to [email] via [provider]"
- Failure: "Failed to send welcome email to [email]: [error]"

