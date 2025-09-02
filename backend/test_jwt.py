#!/usr/bin/env python3
"""
Test script to generate a valid JWT token for testing the user profiles API.
"""

import jwt
import datetime

# Create a test JWT token with a valid user ID
test_user_id = "37c99938-aef5-4f49-8ab7-456e086bc194"  # Use the user ID from the database

# Create a simple JWT payload
payload = {
    "sub": test_user_id,
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
    "iat": datetime.datetime.utcnow(),
    "iss": "https://your-project.supabase.co",
    "aud": "authenticated"
}

# Generate the token (without signature verification for Supabase)
token = jwt.encode(payload, "dummy-secret", algorithm="HS256")

print(f"Test JWT Token: {token}")
print(f"User ID: {test_user_id}")
print("\nTest with curl:")
print(f'curl -X GET http://localhost:8000/api/user-profiles/profile -H "Authorization: Bearer {token}"')
