#!/usr/bin/env python3
"""
Test script to check email HTML generation and image embedding.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import email_service

def test_email_html():
    """Test email HTML generation."""
    
    test_name = "Pranav Tikhe"
    
    print("Testing email HTML generation...")
    print("-" * 50)
    
    # Generate HTML content
    html_content = email_service._create_welcome_email_html(test_name)
    
    # Save HTML to file for inspection
    with open("test_email_output.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("✅ HTML generated and saved to test_email_output.html")
    
    # Check if image is in HTML
    if "data:image/png;base64," in html_content:
        print("✅ Base64 image found in HTML")
        # Extract the base64 part
        start = html_content.find("data:image/png;base64,") + len("data:image/png;base64,")
        end = html_content.find('"', start)
        base64_part = html_content[start:end]
        print(f"Base64 length: {len(base64_part)} characters")
        print(f"First 50 chars: {base64_part[:50]}...")
    else:
        print("❌ Base64 image NOT found in HTML")
    
    # Check image HTML section
    if "header-image" in html_content:
        print("✅ Header image div found")
    else:
        print("❌ Header image div NOT found")
    
    print("-" * 50)
    print("HTML file saved for manual inspection")

if __name__ == "__main__":
    test_email_html()

