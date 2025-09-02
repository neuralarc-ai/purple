import asyncio
import time
from typing import Dict, List, Any, Optional
from utils.logger import logger


class ToolkitCache:
    """
    Enhanced cache for toolkit data to improve performance when switching categories
    """
    
    def __init__(self, cache_ttl: int = 600):  # 10 minutes TTL (increased for better performance)
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, float] = {}
        self._category_cache: Dict[str, List[Dict[str, Any]]] = {}  # Per-category cache
        self._lock = asyncio.Lock()
        self._preload_lock = asyncio.Lock()
        self._preloaded = False
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cache entry is still valid"""
        if key not in self._cache_timestamps:
            return False
        
        age = time.time() - self._cache_timestamps[key]
        return age < self.cache_ttl
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached data if valid"""
        async with self._lock:
            if key in self._cache and self._is_cache_valid(key):
                logger.debug(f"Cache hit for key: {key}")
                return self._cache[key]
            
            logger.debug(f"Cache miss for key: {key}")
            return None
    
    async def set(self, key: str, data: Dict[str, Any]) -> None:
        """Set cache data"""
        async with self._lock:
            self._cache[key] = data
            self._cache_timestamps[key] = time.time()
            logger.debug(f"Cached data for key: {key}")
    
    async def set_category_cache(self, category_id: str, apps: List[Dict[str, Any]]) -> None:
        """Set per-category cache for faster category switching"""
        async with self._lock:
            self._category_cache[category_id] = apps
            self._cache_timestamps[f"category_{category_id}"] = time.time()
            logger.debug(f"Cached {len(apps)} apps for category: {category_id}")
    
    async def get_category_cache(self, category_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached data for specific category"""
        async with self._lock:
            cache_key = f"category_{category_id}"
            if category_id in self._category_cache and self._is_cache_valid(cache_key):
                logger.debug(f"Category cache hit for: {category_id}")
                return self._category_cache[category_id]
            
            logger.debug(f"Category cache miss for: {category_id}")
            return None
    
    async def invalidate(self, key: Optional[str] = None) -> None:
        """Invalidate cache entry or entire cache"""
        async with self._lock:
            if key:
                self._cache.pop(key, None)
                self._cache_timestamps.pop(key, None)
                logger.debug(f"Invalidated cache for key: {key}")
            else:
                self._cache.clear()
                self._cache_timestamps.clear()
                logger.debug("Invalidated entire cache")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_entries = len(self._cache)
        valid_entries = sum(1 for key in self._cache if self._is_cache_valid(key))
        
        return {
            "total_entries": total_entries,
            "valid_entries": valid_entries,
            "cache_keys": list(self._cache.keys()),
            "cache_ttl": self.cache_ttl
        }


# Global cache instance
toolkit_cache = ToolkitCache()