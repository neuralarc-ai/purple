#!/usr/bin/env python3
"""
Test script to verify the custom welcome email template
"""

from dotenv import load_dotenv
load_dotenv()

from services.email_service import email_service

def test_custom_email():
    print("Testing custom welcome email template...")
    print(f"Resend configured: {email_service.use_resend}")
    print(f"SMTP configured: {email_service.use_smtp}")
    print(f"SMTP username: {email_service.smtp_username}")
    print(f"From email: {email_service.from_email}")
    
    if email_service.use_smtp:
        print("\nTesting custom welcome email sending...")
        result = email_service.send_welcome_email(
            user_email="test@example.com",  # Replace with your test email
            user_name="Test User"
        )
        print(f"Email result: {result}")
        
        if result['success']:
            print("✅ Custom welcome email sent successfully!")
            print("📧 Check your email inbox for the beautiful welcome email")
        else:
            print(f"❌ Email failed: {result.get('error', 'Unknown error')}")
    else:
        print("❌ No email provider configured")

if __name__ == "__main__":
    test_custom_email()
