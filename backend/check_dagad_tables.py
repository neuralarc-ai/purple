#!/usr/bin/env python3
"""
Check if DAGAD tables exist and have data
"""
import asyncio
import sys
from services.supabase import DBConnection

async def check_tables():
    try:
        db = DBConnection()
        client = await db.client
        
        print("🔍 Checking DAGAD tables...")
        
        # Check user_dagad_folders table
        try:
            result = await client.table('user_dagad_folders').select('*').limit(1).execute()
            print(f"✅ user_dagad_folders table exists")
            print(f"📊 Folders count: {len(result.data or [])}")
            if result.data:
                print(f"📁 Sample folder: {result.data[0]}")
        except Exception as e:
            print(f"❌ user_dagad_folders table error: {e}")
        
        # Check user_dagad_entries table
        try:
            result = await client.table('user_dagad_entries').select('*').limit(1).execute()
            print(f"✅ user_dagad_entries table exists")
            print(f"📊 Entries count: {len(result.data or [])}")
            if result.data:
                print(f"📄 Sample entry: {result.data[0]}")
        except Exception as e:
            print(f"❌ user_dagad_entries table error: {e}")
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(check_tables())
