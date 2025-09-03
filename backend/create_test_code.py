#!/usr/bin/env python3
"""
Create a test invite code
"""

import asyncio
import uuid
from services.supabase import DBConnection

async def create_test_code():
    try:
        db = DBConnection()
        client = await db.client
        
        # Generate a unique test code
        test_code = 'TEST' + str(uuid.uuid4())[:6].upper()
        
        # Insert the test code
        await client.table('invite_codes').insert({
            'code': test_code,
            'is_used': False,
            'current_uses': 0,
            'max_uses': 1
        }).execute()
        
        print(f"Created test invite code: {test_code}")
        return test_code
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_test_code())
