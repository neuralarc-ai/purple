#!/usr/bin/env python3
"""
Script to convert Mail.png to base64 for email embedding
"""
import base64
import os

def convert_to_base64(image_path):
    """Convert image to base64 string"""
    try:
        with open(image_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return f'data:image/png;base64,{encoded_string}'
    except FileNotFoundError:
        print(f"❌ Image file not found: {image_path}")
        return None
    except Exception as e:
        print(f"❌ Error converting image: {e}")
        return None

def main():
    # Check if Mail.png exists in current directory
    image_path = 'Mail.png'
    
    if not os.path.exists(image_path):
        print("📁 Mail.png not found in current directory")
        print("📋 Please place your Mail.png file in this directory and run the script again")
        print("💡 Or provide the full path to your Mail.png file")
        return
    
    print("🔄 Converting Mail.png to base64...")
    base64_string = convert_to_base64(image_path)
    
    if base64_string:
        print("✅ Conversion successful!")
        print("\n📋 Copy this base64 string to your email template:")
        print("=" * 50)
        print(base64_string)
        print("=" * 50)
        print("\n💡 Replace the imageUrl in your email template with this base64 string")
    else:
        print("❌ Conversion failed")

if __name__ == "__main__":
    main()

