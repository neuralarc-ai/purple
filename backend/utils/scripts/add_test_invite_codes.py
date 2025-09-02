#!/usr/bin/env python3
"""
Script to add test invite codes for development purposes.
Run this script to add some fresh invite codes for testing.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.supabase import DBConnection
from utils.logger import logger

async def add_test_invite_codes():
    """Add some test invite codes for development."""
    try:
        # Create database connection
        db = DBConnection()
        client = await db.client
        
        # Generate some test invite codes
        test_codes = [
            "TEST001",
            "TEST002", 
            "TEST003",
            "TEST004",
            "TEST005",
            "DEV001",
            "DEV002",
            "DEV003",
            "DEV004",
            "DEV005"
        ]
        
        # Set expiration to 30 days from now
        expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
        
        # Insert the test codes
        for code in test_codes:
            try:
                await client.table('invite_codes').insert({
                    'code': code,
                    'max_uses': 1,
                    'expires_at': expires_at,
                    'is_used': False,
                    'current_uses': 0
                }).execute()
                logger.info(f"Added test invite code: {code}")
            except Exception as e:
                # Code might already exist, that's okay
                logger.info(f"Code {code} might already exist: {e}")
        
        logger.info("Test invite codes added successfully!")
        
        # Show available codes
        result = await client.table('invite_codes').select('code, is_used, current_uses, expires_at').eq('is_used', False).execute()
        
        if result.data:
            logger.info("Available invite codes:")
            for code_data in result.data:
                logger.info(f"  - {code_data['code']} (uses: {code_data['current_uses']}/{code_data.get('max_uses', 1)})")
        else:
            logger.info("No unused invite codes found.")
            
    except Exception as e:
        logger.error(f"Error adding test invite codes: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    asyncio.run(add_test_invite_codes())
