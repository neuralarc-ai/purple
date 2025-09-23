"""
Cleanup orphaned DAGAD files from S3 by comparing S3 keys to DB references.

Usage (dry-run by default):
    python -m backend.utils.scripts.cleanup_orphaned_dagad_files --prefix files/ --also-images

Actually delete:
    python -m backend.utils.scripts.cleanup_orphaned_dagad_files --delete --prefix files/ --also-images

Env requirements when STORAGE_PROVIDER=s3 or r2:
    S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
Optional: S3_PUBLIC_BASE_URL, S3_ENDPOINT_URL

Notes:
    - Only removes objects under provided prefixes (default: files/).
    - If STORAGE_PROVIDER is not s3/r2, script will exit.
"""

from __future__ import annotations

import os
import sys
import argparse
from typing import Optional, Set, Iterable
from urllib.parse import urlparse, unquote

import boto3  # type: ignore

# Reuse DB connection
from services.supabase import DBConnection
from utils.logger import logger


def extract_s3_key_from_url(url: str, bucket: str) -> Optional[str]:
    """Attempt to infer S3 object key from a public URL or CDN URL.

    Supports:
        - S3_PUBLIC_BASE_URL/<key>
        - S3_ENDPOINT_URL/<bucket>/<key>
        - https://<bucket>.s3.<region>.amazonaws.com/<key>
    """
    public_base = os.getenv("S3_PUBLIC_BASE_URL")
    endpoint = os.getenv("S3_ENDPOINT_URL")

    try:
        if public_base and url.startswith(public_base.rstrip("/") + "/"):
            return unquote(url[len(public_base.rstrip("/") + "/") :])
        if endpoint and url.startswith(endpoint.rstrip("/") + f"/{bucket}/"):
            return unquote(url[len(endpoint.rstrip("/") + f"/{bucket}/") :])

        parsed = urlparse(url)
        host_prefix = f"{bucket}.s3"
        if parsed.netloc.startswith(host_prefix):
            return unquote(parsed.path.lstrip("/"))
        # Fallback
        parts = url.split(".amazonaws.com/", 1)
        if len(parts) == 2:
            return unquote(parts[1])
    except Exception:
        return None
    return None


async def load_referenced_keys() -> Set[str]:
    """Fetch current DAGAD file and image URLs and convert to S3 keys."""
    provider = (os.getenv("STORAGE_PROVIDER") or "supabase").lower()
    if provider not in ("s3", "r2"):
        logger.error("This script is intended for s3/r2 provider only.")
        sys.exit(2)

    bucket = os.getenv("S3_BUCKET", "dagad-assets")
    db = DBConnection()
    client = await db.client
    result = await client.table("user_dagad_entries").select("file_url,image_url").execute()

    keys: Set[str] = set()
    for row in (result.data or []):
        for col in ("file_url", "image_url"):
            url = row.get(col)
            if not url:
                continue
            key = extract_s3_key_from_url(url, bucket)
            if key:
                keys.add(key)
    return keys


def s3_list_keys(bucket: str, prefixes: Iterable[str]) -> Set[str]:
    s3 = boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION"),
        endpoint_url=os.getenv("S3_ENDPOINT_URL"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    all_keys: Set[str] = set()
    for prefix in prefixes:
        continuation_token: Optional[str] = None
        while True:
            kwargs = {"Bucket": bucket, "Prefix": prefix}
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token
            resp = s3.list_objects_v2(**kwargs)
            for obj in resp.get("Contents", []) or []:
                all_keys.add(obj["Key"])
            if resp.get("IsTruncated"):
                continuation_token = resp.get("NextContinuationToken")
            else:
                break
    return all_keys


def s3_delete_keys(bucket: str, keys: Iterable[str]) -> None:
    s3 = boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION"),
        endpoint_url=os.getenv("S3_ENDPOINT_URL"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    batch = []
    for key in keys:
        batch.append({"Key": key})
        if len(batch) == 1000:
            s3.delete_objects(Bucket=bucket, Delete={"Objects": batch})
            batch = []
    if batch:
        s3.delete_objects(Bucket=bucket, Delete={"Objects": batch})


async def main() -> None:
    parser = argparse.ArgumentParser(description="Cleanup orphaned DAGAD files in S3")
    parser.add_argument("--delete", action="store_true", help="Actually delete objects (otherwise dry-run)")
    parser.add_argument("--prefix", default="files/", help="Primary prefix to scan (default: files/)")
    parser.add_argument("--also-images", action="store_true", help="Also scan images/ prefix")
    args = parser.parse_args()

    provider = (os.getenv("STORAGE_PROVIDER") or "supabase").lower()
    if provider not in ("s3", "r2"):
        logger.error("STORAGE_PROVIDER is not s3/r2; nothing to do.")
        sys.exit(2)

    bucket = os.getenv("S3_BUCKET", "dagad-assets")
    prefixes = [args.prefix]
    if args.also_images:
        prefixes.append("images/")

    logger.info(f"Listing S3 keys under prefixes: {prefixes}")
    s3_keys = s3_list_keys(bucket, prefixes)
    logger.info(f"Found {len(s3_keys)} objects in S3 to compare")

    referenced = await load_referenced_keys()
    logger.info(f"Found {len(referenced)} referenced keys in DB")

    orphaned = sorted(k for k in s3_keys if k not in referenced)
    if not orphaned:
        logger.info("No orphaned objects found. ✅")
        return

    if args.delete:
        logger.warning(f"Deleting {len(orphaned)} orphaned objects from s3://{bucket}")
        s3_delete_keys(bucket, orphaned)
        logger.info("Deletion complete.")
    else:
        logger.warning("Dry-run: The following keys are orphaned (use --delete to remove):")
        for key in orphaned[:200]:
            logger.info(key)
        if len(orphaned) > 200:
            logger.info(f"... and {len(orphaned) - 200} more")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())



