#!/usr/bin/env python3
"""
Email service for sending welcome emails and other notifications.
Supports both Resend and Nodemailer (SMTP) providers.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import httpx
from utils.logger import logger

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


class EmailService:
    def __init__(self):
        self.resend_api_key = os.getenv('RESEND_API_KEY')
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USER') or os.getenv('SMTP_USERNAME')  # Support both variable names
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL') or os.getenv('SENDER_EMAIL', 'onboarding@he2.ai')
        self.from_name = os.getenv('FROM_NAME', 'Team Helium')
        
        # Determine which provider to use
        self.use_resend = bool(self.resend_api_key)
        self.use_smtp = bool(self.smtp_username and self.smtp_password)
        
        if not self.use_resend and not self.use_smtp:
            logger.warning("No email provider configured. Emails will not be sent.")
    
    def send_welcome_email(self, user_email: str, user_name: str) -> Dict[str, Any]:
        """
        Send welcome email to newly onboarded user.
        
        Args:
            user_email: User's email address
            user_name: User's display name
            
        Returns:
            Dict with success status and details
        """
        try:
            # Create email content
            subject = "Welcome to Helium - Your AI Workforce Platform"
            html_content = self._create_welcome_email_html(user_name)
            text_content = self._create_welcome_email_text(user_name)
            
            # Try Resend first, fallback to SMTP
            if self.use_resend:
                result = self._send_via_resend(user_email, subject, html_content)
                if result['success']:
                    return result
            
            if self.use_smtp:
                result = self._send_via_smtp(user_email, subject, html_content, text_content)
                if result['success']:
                    return result
            
            # If no providers available
            if not self.use_resend and not self.use_smtp:
                logger.warning(f"Welcome email not sent to {user_email} - no email provider configured")
                return {
                    'success': False,
                    'error': 'No email provider configured',
                    'email': user_email
                }
            
            return {
                'success': False,
                'error': 'All email providers failed',
                'email': user_email
            }
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {user_email}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'email': user_email
            }
    
    def _send_via_resend(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        """Send email via Resend API."""
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            async def send_request():
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers)
                    return response
            
            # For now, we'll use a synchronous approach
            import asyncio
            response = asyncio.run(send_request())
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Welcome email sent via Resend to {to_email}: {result.get('id')}")
                return {
                    'success': True,
                    'provider': 'resend',
                    'email_id': result.get('id'),
                    'email': to_email
                }
            else:
                logger.error(f"Resend API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Resend API error: {response.status_code}",
                    'email': to_email
                }
                
        except Exception as e:
            logger.error(f"Resend send error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'email': to_email
            }
    
    def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: str) -> Dict[str, Any]:
        """Send email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach parts
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Welcome email sent via SMTP to {to_email}")
            return {
                'success': True,
                'provider': 'smtp',
                'email': to_email
            }
            
        except Exception as e:
            logger.error(f"SMTP send error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'email': to_email
            }
    
    def _create_welcome_email_html(self, user_name: str) -> str:
        """Create HTML version of welcome email with custom template."""
        first_name = user_name.split()[0] if user_name else "there"
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome aboard!</title>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #D4D5D0;
                    line-height: 1.6;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #D4D5D0;
                    padding: 40px 20px;
                }}
                .content-wrapper {{
                    background-color: #D4D5D0;
                    padding: 40px;
                    text-align: left;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #333;
                    margin-bottom: 20px;
                    font-weight: normal;
                }}
                .welcome-text {{
                    font-size: 18px;
                    color: #333;
                    margin-bottom: 30px;
                    font-weight: normal;
                }}
                .content-text {{
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 20px;
                    line-height: 1.6;
                }}
                .highlight {{
                    font-weight: bold;
                    color: #333;
                }}
                .mission-critical {{
                    text-decoration: underline;
                    color: #333;
                }}
                .closing {{
                    font-size: 16px;
                    color: #333;
                    margin-top: 30px;
                    margin-bottom: 10px;
                }}
                .signature {{
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 5px;
                }}
                .website-link {{
                    font-size: 16px;
                    color: #333;
                    text-decoration: underline;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 50px;
                    padding-top: 20px;
                    font-size: 14px;
                    color: #666;
                }}
                @media only screen and (max-width: 600px) {{
                    .email-container {{
                        padding: 20px 10px;
                    }}
                    .content-wrapper {{
                        padding: 20px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="content-wrapper">
                    <div class="greeting">Dear {first_name},</div>
                    
                    <div class="welcome-text">Welcome aboard!</div>
                    
                    <div class="content-text">
                        You are officially part of the first wave of pioneers exploring <span class="highlight">Helium's Public Beta</span>, and we could not be more excited to have you with us.
                    </div>
                    
                    <div class="content-text">
                        To kickstart your journey, we have added <span class="highlight">800 free Helium credits</span> to your account. Consider this your launch fuel to experiment, explore, and push the boundaries of what Helium can do.
                    </div>
                    
                    <div class="content-text">
                        As with any exciting first launch, there might be a few bumps along the way. If you spot something odd or have a brilliant idea for how we can make Helium even better, we would love to hear from you. Your feedback is not just welcome—<span class="mission-critical">it is mission critical</span>.
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
                        <div class="website-link">https://he2.ai</div>
                    </div>
                </div>
                
                <div class="footer">
                    Helium AI by Neural Arc Inc. https://neuralarc.ai
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_welcome_email_text(self, user_name: str) -> str:
        """Create text version of welcome email."""
        first_name = user_name.split()[0] if user_name else "there"
        
        return f"""
Dear {first_name},

Welcome aboard! You are officially part of the first wave of pioneers exploring Helium's Public Beta, and we could not be more excited to have you with us.

To kickstart your journey, we have added 800 free Helium credits to your account. Consider this your launch fuel to experiment, explore, and push the boundaries of what Helium can do.

As with any exciting first launch, there might be a few bumps along the way. If you spot something odd or have a brilliant idea for how we can make Helium even better, we would love to hear from you. Your feedback is not just welcome — it is mission critical.

This is more than just early access. It is your chance to help shape a platform designed to redefine how intelligence powers business.

Thank you for jumping in with us at this early stage. The future of AI is unfolding, and you are in the front row.

Let's make this amazing together. Welcome to Helium OS

Cheers,
Team Helium
https://he2.ai
        """

    def send_waitlist_email(self, user_email: str, user_name: str) -> Dict[str, Any]:
        """
        Send waitlist confirmation email to user who joined the waitlist.
        
        Args:
            user_email: User's email address
            user_name: User's display name
            
        Returns:
            Dict with success status and details
        """
        try:
            # Create email content
            subject = "Thank you for joining the Helium AI waitlist"
            html_content = self._create_waitlist_email_html(user_name)
            text_content = self._create_waitlist_email_text(user_name)
            
            # Try Resend first, fallback to SMTP
            if self.use_resend:
                result = self._send_via_resend(user_email, subject, html_content)
                if result['success']:
                    return result
            
            if self.use_smtp:
                result = self._send_via_smtp(user_email, subject, html_content, text_content)
                if result['success']:
                    return result
            
            # If no providers available
            if not self.use_resend and not self.use_smtp:
                logger.warning(f"Waitlist email not sent to {user_email} - no email provider configured")
                return {
                    'success': False,
                    'error': 'No email provider configured',
                    'email': user_email
                }
            
            return {
                'success': False,
                'error': 'All email providers failed',
                'email': user_email
            }
            
        except Exception as e:
            logger.error(f"Error sending waitlist email to {user_email}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'email': user_email
            }

    def _create_waitlist_email_html(self, user_name: str) -> str:
        """Create HTML version of waitlist email with custom template."""
        first_name = user_name.split()[0] if user_name else "there"
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank you for joining the Helium AI waitlist</title>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #D4D5D0;
                    line-height: 1.6;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #D4D5D0;
                    padding: 40px 20px;
                }}
                .content-wrapper {{
                    background-color: #D4D5D0;
                    padding: 40px;
                    text-align: left;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #333;
                    margin-bottom: 20px;
                    font-weight: normal;
                }}
                .content-text {{
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 20px;
                    line-height: 1.6;
                }}
                .closing {{
                    font-size: 16px;
                    color: #333;
                    margin-top: 30px;
                    margin-bottom: 10px;
                }}
                .signature {{
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 5px;
                }}
                .website-link {{
                    font-size: 16px;
                    color: #333;
                    text-decoration: underline;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 50px;
                    padding-top: 20px;
                    font-size: 14px;
                    color: #666;
                }}
                @media only screen and (max-width: 600px) {{
                    .email-container {{
                        padding: 20px 10px;
                    }}
                    .content-wrapper {{
                        padding: 20px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="content-wrapper">
                    <div class="greeting">Hello {first_name},</div>
                    
                    <div class="content-text">
                        Thank you for joining the Helium AI waitlist and for your patience while we build something extraordinary. Your enthusiasm means the world to us.
                    </div>
                    
                    <div class="content-text">
                        We are working hard to ensure that your first experience with Helium is smooth, powerful, and unforgettable. Your invite code will be landing in your inbox very soon, and you will be among the first to explore how Helium can transform your workflows and supercharge productivity.
                    </div>
                    
                    <div class="content-text">
                        Stay tuned. The future of AI for business is closer than ever, and you are part of it.
                    </div>
                    
                    <div class="closing">Warm regards,</div>
                    <div class="signature">Team Helium</div>
                    <div class="website-link">https://he2.ai</div>
                </div>
                
                <div class="footer">
                    Helium AI by Neural Arc Inc. https://neuralarc.ai
                </div>
            </div>
        </body>
        </html>
        """

    def _create_waitlist_email_text(self, user_name: str) -> str:
        """Create text version of waitlist email."""
        first_name = user_name.split()[0] if user_name else "there"
        
        return f"""
Hello {first_name},

Thank you for joining the Helium AI waitlist and for your patience while we build something extraordinary. Your enthusiasm means the world to us.

We are working hard to ensure that your first experience with Helium is smooth, powerful, and unforgettable. Your invite code will be landing in your inbox very soon, and you will be among the first to explore how Helium can transform your workflows and supercharge productivity.

Stay tuned. The future of AI for business is closer than ever, and you are part of it.

Warm regards,
Team Helium

https://he2.ai

Helium AI by Neural Arc Inc. https://neuralarc.ai
        """


# Create global instance
email_service = EmailService()
