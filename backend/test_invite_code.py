#!/usr/bin/env python3
"""
Test script to check invite code validation
"""

import asyncio
from services.supabase import DBConnection

async def check_invite_code():
    try:
        db = DBConnection()
        client = await db.client
        
        # Check the specific invite code
        result = await client.table('invite_codes').select('*').eq('code', 'NAHQDSX').execute()
        
        print("Invite code data:")
        if result.data:
            for code in result.data:
                print(f"Code: {code.get('code')}")
                print(f"ID: {code.get('id')}")
                print(f"Is used: {code.get('is_used')}")
                print(f"Current uses: {code.get('current_uses', 0)}")
                print(f"Max uses: {code.get('max_uses', 1)}")
                print(f"Expires at: {code.get('expires_at')}")
                print("---")
        else:
            print("No invite code found with code 'NAHQDSX'")
            
        # Check all invite codes
        all_codes = await client.table('invite_codes').select('code, is_used, current_uses, max_uses').execute()
        print(f"\nTotal invite codes: {len(all_codes.data)}")
        for code in all_codes.data[:5]:  # Show first 5
            print(f"Code: {code.get('code')}, Used: {code.get('is_used')}, Uses: {code.get('current_uses', 0)}/{code.get('max_uses', 1)}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_invite_code())
