#!/usr/bin/env python3
"""
Feedback email notification service for sending feedback notifications to team.
Uses SMTP configuration from environment variables.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Dict, Any, Optional
from utils.logger import logger

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


class FeedbackEmailService:
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USER') or os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        
        # Use neuralarc.ai credentials for production
        env_mode = os.getenv('NEXT_PUBLIC_ENV_MODE', 'PRODUCTION').upper()
        if env_mode == 'PRODUCTION':
            self.from_email = 'dev@neuralarc.ai'
        else:
            self.from_email = os.getenv('FROM_EMAIL') or os.getenv('SENDER_EMAIL', 'dev@neuralarc.ai')
        
        self.from_name = os.getenv('FROM_NAME', 'Team Helium')
        
        # Team notification email (you can change this to your team's email)
        self.team_email = os.getenv('TEAM_NOTIFICATION_EMAIL', 'dev@neuralarc.ai')
        
        # Check if SMTP is configured
        self.use_smtp = bool(self.smtp_username and self.smtp_password)
        
        if not self.use_smtp:
            logger.warning("SMTP not configured. Feedback notifications will not be sent.")
    
    def send_feedback_notification(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send feedback notification email to team.
        
        Args:
            feedback_data: Dictionary containing feedback ticket data
            
        Returns:
            Dict with success status and details
        """
        try:
            if not self.use_smtp:
                logger.warning("SMTP not configured. Feedback notification not sent.")
                return {
                    'success': False,
                    'error': 'SMTP not configured',
                    'feedback_id': feedback_data.get('id')
                }
            
            # Create email content
            subject = f"New Feedback: {feedback_data.get('issue_type', 'Unknown Issue')} - Ticket #{feedback_data.get('id', 'Unknown')}"
            html_content = self._create_feedback_email_html(feedback_data)
            text_content = self._create_feedback_email_text(feedback_data)
            
            # Send email via SMTP
            result = self._send_via_smtp(self.team_email, subject, html_content, text_content)
            
            if result['success']:
                logger.info(f"Feedback notification sent for ticket {feedback_data.get('id')}")
            else:
                logger.error(f"Failed to send feedback notification: {result.get('error')}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending feedback notification: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'feedback_id': feedback_data.get('id')
            }
    
    def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: str) -> Dict[str, Any]:
        """Send email via SMTP."""
        try:
            # Create message with alternative content (text and html)
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Reply-To'] = self.from_email
            msg['Return-Path'] = self.from_email
            msg['Message-ID'] = f"<{os.urandom(16).hex()}@he2.ai>"
            
            # Attach text and html parts
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Feedback notification sent via SMTP to {to_email}")
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
    
    def _create_feedback_email_html(self, feedback_data: Dict[str, Any]) -> str:
        """Create HTML version of feedback notification email."""
        
        # Format screenshot if available
        screenshot_html = ""
        if feedback_data.get('screenshot_url'):
            screenshot_html = f"""
            <div style="margin-top: 20px;">
                <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">Screenshot:</h3>
                <img src="{feedback_data['screenshot_url']}" 
                     alt="Screenshot" 
                     style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
            </div>
            """
        
        # Format shared link if available
        shared_link_html = ""
        if feedback_data.get('shared_link'):
            shared_link_html = f"""
            <div style="margin-top: 15px;">
                <strong>Shared Link:</strong> 
                <a href="{feedback_data['shared_link']}" style="color: #007bff; text-decoration: none;">
                    {feedback_data['shared_link']}
                </a>
            </div>
            """
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Feedback Ticket</title>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f8f9fa;
                    line-height: 1.6;
                }}
                .email-wrapper {{
                    background-color: #D4D5D0;
                    padding: 20px;
                    min-height: 100vh;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background-color: #007bff;
                    color: white;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                    margin: -20px -20px 20px -20px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    color: #333;
                }}
                .field {{
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    border-left: 4px solid #007bff;
                }}
                .field-label {{
                    font-weight: bold;
                    color: #495057;
                    margin-bottom: 5px;
                }}
                .field-value {{
                    color: #333;
                }}
                .description {{
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 4px;
                    border: 1px solid #dee2e6;
                    white-space: pre-wrap;
                    font-family: monospace;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    font-size: 14px;
                    color: #6c757d;
                    text-align: center;
                }}
                .priority-high {{
                    border-left-color: #dc3545;
                }}
                .priority-medium {{
                    border-left-color: #ffc107;
                }}
                .priority-low {{
                    border-left-color: #28a745;
                }}
                .status-open {{
                    background-color: #d4edda;
                    color: #155724;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="email-container">
                    <div class="header">
                        <h1>🚨 New Feedback Ticket</h1>
                    </div>
                    
                    <div class="content">
                        <div class="field priority-{feedback_data.get('priority', 'medium')}">
                            <div class="field-label">Ticket ID:</div>
                            <div class="field-value">{feedback_data.get('id', 'Unknown')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Status:</div>
                            <div class="field-value">
                                <span class="status-open">{feedback_data.get('status', 'open').upper()}</span>
                            </div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Issue Type:</div>
                            <div class="field-value">{feedback_data.get('issue_type', 'Not specified')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Priority:</div>
                            <div class="field-value">{feedback_data.get('priority', 'medium').upper()}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">User Email:</div>
                            <div class="field-value">{feedback_data.get('email', 'Not provided')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">User ID:</div>
                            <div class="field-value">{feedback_data.get('user_id', 'Unknown')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Account ID:</div>
                            <div class="field-value">{feedback_data.get('account_id', 'Unknown')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Created At:</div>
                            <div class="field-value">{feedback_data.get('created_at', 'Unknown')}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Description:</div>
                            <div class="description">{feedback_data.get('description', 'No description provided')}</div>
                        </div>
                        
                        {shared_link_html}
                        {screenshot_html}
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated notification from Helium AI Feedback System</p>
                        <p>Helium AI by Neural Arc Inc. | <a href="https://he2.ai" style="color: #007bff;">he2.ai</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_feedback_email_text(self, feedback_data: Dict[str, Any]) -> str:
        """Create text version of feedback notification email."""
        
        screenshot_text = ""
        if feedback_data.get('screenshot_url'):
            screenshot_text = f"\nScreenshot: {feedback_data['screenshot_url']}"
        
        shared_link_text = ""
        if feedback_data.get('shared_link'):
            shared_link_text = f"\nShared Link: {feedback_data['shared_link']}"
        
        return f"""
NEW FEEDBACK TICKET

Ticket ID: {feedback_data.get('id', 'Unknown')}
Status: {feedback_data.get('status', 'open').upper()}
Issue Type: {feedback_data.get('issue_type', 'Not specified')}
Priority: {feedback_data.get('priority', 'medium').upper()}
User Email: {feedback_data.get('email', 'Not provided')}
User ID: {feedback_data.get('user_id', 'Unknown')}
Account ID: {feedback_data.get('account_id', 'Unknown')}
Created At: {feedback_data.get('created_at', 'Unknown')}

Description:
{feedback_data.get('description', 'No description provided')}
{shared_link_text}{screenshot_text}

---
This is an automated notification from Helium AI Feedback System
Helium AI by Neural Arc Inc. | https://he2.ai
        """


# Create global instance
feedback_email_service = FeedbackEmailService()
