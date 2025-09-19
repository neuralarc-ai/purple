from __future__ import annotations

"""
Pluggable storage provider abstraction for file/image uploads.

Supported providers:
- Supabase (default fallback)
- Amazon S3 (including S3-compatible services like Cloudflare R2)

Usage:
    storage = get_storage()
    url = await storage.upload_bytes(path, data, content_type)
    # or
    url = await storage.upload_base64_image(base64_data, path_prefix)
"""

import os
import uuid
import base64
import asyncio
import datetime
from typing import Optional, Protocol


class StorageProvider(Protocol):
    async def upload_bytes(self, path: str, data: bytes, content_type: Optional[str] = None) -> str: ...
    async def upload_base64_image(self, base64_data: str, path_prefix: str = "images/") -> str: ...


def _unique_path(prefix: str, filename: str) -> str:
    ts = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    uid = str(uuid.uuid4())
    return f"{prefix.rstrip('/')}/{ts}_{uid}_{filename}"


class SupabaseStorage:
    def __init__(self, bucket: str):
        from services.supabase import DBConnection
        self.bucket = bucket
        self._db = DBConnection()

    async def upload_bytes(self, path: str, data: bytes, content_type: Optional[str] = None) -> str:
        client = await self._db.client
        await client.storage.from_(self.bucket).upload(
            path,
            data,
            {"content-type": content_type or "application/octet-stream"}
        )
        return await client.storage.from_(self.bucket).get_public_url(path)

    async def upload_base64_image(self, base64_data: str, path_prefix: str = "images/") -> str:
        if base64_data.startswith('data:'):
            base64_data = base64_data.split(',')[1]
        data = base64.b64decode(base64_data)
        path = _unique_path(path_prefix, "image.png")
        return await self.upload_bytes(path, data, "image/png")


class S3Storage:
    def __init__(self, bucket: str, region: Optional[str] = None, endpoint_url: Optional[str] = None):
        import boto3  # type: ignore
        self.bucket = bucket
        self.region = region or os.getenv("AWS_REGION")
        self.public_base = os.getenv("S3_PUBLIC_BASE_URL")
        self.s3 = boto3.client(
            "s3",
            region_name=self.region,
            endpoint_url=endpoint_url or os.getenv("S3_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

    async def upload_bytes(self, path: str, data: bytes, content_type: Optional[str] = None) -> str:
        def _put():
            self.s3.put_object(
                Bucket=self.bucket,
                Key=path,
                Body=data,
                ContentType=content_type or "application/octet-stream",
                ACL="public-read"
            )
        await asyncio.to_thread(_put)

        if self.public_base:
            return f"{self.public_base.rstrip('/')}/{path}"
        if os.getenv("S3_ENDPOINT_URL"):
            # Generic S3-compatible endpoint URL form
            base = os.getenv("S3_ENDPOINT_URL").rstrip('/')
            return f"{base}/{self.bucket}/{path}"
        # Standard AWS URL
        region = self.region or "us-east-1"
        return f"https://{self.bucket}.s3.{region}.amazonaws.com/{path}"

    async def upload_base64_image(self, base64_data: str, path_prefix: str = "images/") -> str:
        if base64_data.startswith('data:'):
            base64_data = base64_data.split(',')[1]
        data = base64.b64decode(base64_data)
        path = _unique_path(path_prefix, "image.png")
        return await self.upload_bytes(path, data, "image/png")


def get_storage() -> StorageProvider:
    provider = (os.getenv("STORAGE_PROVIDER") or "supabase").lower()
    if provider == "s3" or provider == "r2":
        return S3Storage(
            bucket=os.getenv("S3_BUCKET", "dagad-assets"),
            region=os.getenv("AWS_REGION"),
            endpoint_url=os.getenv("S3_ENDPOINT_URL"),
        )
    # Default fallback to Supabase storage
    return SupabaseStorage(bucket=os.getenv("SUPABASE_BUCKET", "dagad-images"))


