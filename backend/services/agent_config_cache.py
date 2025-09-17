"""
Agent Configuration Caching Service

This service provides Redis-based caching for agent configurations to improve
performance by avoiding repeated database queries for the same agent configs.
"""

import json
import hashlib
from typing import Dict, Any, Optional
from utils.logger import logger
from services import redis
from agent.config_helper import extract_agent_config


class AgentConfigCache:
    """Redis-based cache for agent configurations."""
    
    # Cache TTL: 1 hour for agent configs (they don't change frequently)
    CACHE_TTL = 3600
    
    # Cache key prefix
    CACHE_PREFIX = "agent_config"
    
    @staticmethod
    def _generate_cache_key(agent_id: str, version_id: Optional[str] = None) -> str:
        """Generate a cache key for agent configuration."""
        if version_id:
            # Include version ID in cache key for version-specific configs
            key_data = f"{agent_id}:{version_id}"
        else:
            key_data = agent_id
        
        # Create a hash to ensure key length consistency
        key_hash = hashlib.md5(key_data.encode()).hexdigest()[:16]
        return f"{AgentConfigCache.CACHE_PREFIX}:{key_hash}"
    
    @staticmethod
    async def get_cached_config(agent_id: str, version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached agent configuration.
        
        Args:
            agent_id: The agent ID
            version_id: Optional version ID for version-specific configs
            
        Returns:
            Cached agent config dict or None if not found
        """
        try:
            cache_key = AgentConfigCache._generate_cache_key(agent_id, version_id)
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                config = json.loads(cached_data)
                logger.debug(f"Cache HIT for agent config: {agent_id} (version: {version_id})")
                return config
            else:
                logger.debug(f"Cache MISS for agent config: {agent_id} (version: {version_id})")
                return None
                
        except Exception as e:
            logger.warning(f"Failed to retrieve cached agent config for {agent_id}: {e}")
            return None
    
    @staticmethod
    async def cache_config(agent_id: str, config: Dict[str, Any], version_id: Optional[str] = None) -> None:
        """
        Cache agent configuration.
        
        Args:
            agent_id: The agent ID
            config: The agent configuration dict to cache
            version_id: Optional version ID for version-specific configs
        """
        try:
            cache_key = AgentConfigCache._generate_cache_key(agent_id, version_id)
            config_json = json.dumps(config, default=str)  # default=str handles datetime objects
            
            await redis.set(cache_key, config_json, ex=AgentConfigCache.CACHE_TTL)
            logger.debug(f"Cached agent config: {agent_id} (version: {version_id})")
            
        except Exception as e:
            logger.warning(f"Failed to cache agent config for {agent_id}: {e}")
    
    @staticmethod
    async def invalidate_cache(agent_id: str, version_id: Optional[str] = None) -> None:
        """
        Invalidate cached agent configuration.
        
        Args:
            agent_id: The agent ID
            version_id: Optional version ID for version-specific configs
        """
        try:
            cache_key = AgentConfigCache._generate_cache_key(agent_id, version_id)
            await redis.delete(cache_key)
            logger.debug(f"Invalidated cache for agent config: {agent_id} (version: {version_id})")
            
        except Exception as e:
            logger.warning(f"Failed to invalidate cache for agent config {agent_id}: {e}")
    
    @staticmethod
    async def get_or_build_config(
        agent_data: Dict[str, Any], 
        version_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get agent config from cache or build and cache it.
        
        This is the main method that should be used instead of directly calling
        extract_agent_config() when caching is desired.
        
        Args:
            agent_data: Raw agent data from database
            version_data: Optional version data from database
            
        Returns:
            Agent configuration dict
        """
        agent_id = agent_data.get('agent_id')
        version_id = version_data.get('version_id') if version_data else None
        
        if not agent_id:
            logger.warning("No agent_id found in agent_data, falling back to direct extraction")
            return extract_agent_config(agent_data, version_data)
        
        # Try to get from cache first
        cached_config = await AgentConfigCache.get_cached_config(agent_id, version_id)
        if cached_config:
            return cached_config
        
        # Cache miss - build config and cache it
        logger.debug(f"Building and caching agent config for {agent_id} (version: {version_id})")
        config = extract_agent_config(agent_data, version_data)
        
        # Cache the built config
        await AgentConfigCache.cache_config(agent_id, config, version_id)
        
        return config


# Convenience functions for easy migration
async def get_cached_agent_config(agent_id: str, version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Convenience function to get cached agent config."""
    return await AgentConfigCache.get_cached_config(agent_id, version_id)


async def cache_agent_config(agent_id: str, config: Dict[str, Any], version_id: Optional[str] = None) -> None:
    """Convenience function to cache agent config."""
    await AgentConfigCache.cache_config(agent_id, config, version_id)


async def invalidate_agent_cache(agent_id: str, version_id: Optional[str] = None) -> None:
    """Convenience function to invalidate agent cache."""
    await AgentConfigCache.invalidate_cache(agent_id, version_id)


async def get_or_build_agent_config(
    agent_data: Dict[str, Any], 
    version_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Convenience function to get or build agent config with caching."""
    return await AgentConfigCache.get_or_build_config(agent_data, version_data)
