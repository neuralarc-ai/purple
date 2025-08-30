from typing import Dict, Any, Optional, List
from utils.logger import logger


def extract_agent_config(agent_data: Dict[str, Any], version_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Extract agent configuration with simplified logic for Helium vs custom agents."""
    agent_id = agent_data.get('agent_id', 'Unknown')
    metadata = agent_data.get('metadata', {})
    is_helium_default = metadata.get('is_helium_default', False)
    
    # Handle Helium agents with special logic
    if is_helium_default:
        return _extract_helium_agent_config(agent_data, version_data)
    
    # Handle custom agents with versioning
    return _extract_custom_agent_config(agent_data, version_data)


def _extract_helium_agent_config(agent_data: Dict[str, Any], version_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Extract config for Helium agents - always use central config with user customizations."""
    from agent.helium_config import HELIUM_CONFIG
    
    agent_id = agent_data.get('agent_id', 'Unknown')
    logger.debug(f"Using Helium central config for agent {agent_id}")
    
    # Start with central Helium config
    config = {
        'agent_id': agent_data['agent_id'],
        'name': HELIUM_CONFIG['name'],
        'description': HELIUM_CONFIG['description'],
        'system_prompt': HELIUM_CONFIG['system_prompt'],
        'model': HELIUM_CONFIG['model'],
        'agentpress_tools': _extract_agentpress_tools_for_run(HELIUM_CONFIG['agentpress_tools']),
        'avatar': HELIUM_CONFIG['avatar'],
        'avatar_color': HELIUM_CONFIG['avatar_color'],
        'is_default': True,
        'is_helium_default': True,
        'centrally_managed': True,
        'account_id': agent_data.get('account_id'),
        'current_version_id': agent_data.get('current_version_id'),
        'version_name': version_data.get('version_name', 'v1') if version_data else 'v1',
        'profile_image_url': agent_data.get('profile_image_url'),
        'restrictions': {
            'system_prompt_editable': False,
            'tools_editable': False,
            'name_editable': False,
            'description_editable': False,
            'mcps_editable': True
        }
    }
    
    # Add user customizations from version or agent data
    if version_data:
        # Get customizations from version data
        if version_data.get('config'):
            version_config = version_data['config']
            tools = version_config.get('tools', {})
            config['configured_mcps'] = tools.get('mcp', [])
            config['custom_mcps'] = tools.get('custom_mcp', [])
            config['workflows'] = version_config.get('workflows', [])
            config['triggers'] = version_config.get('triggers', [])
        else:
            # Legacy version format
            config['configured_mcps'] = version_data.get('configured_mcps', [])
            config['custom_mcps'] = version_data.get('custom_mcps', [])
            config['workflows'] = []
            config['triggers'] = []
    else:
        # Fallback to agent data or empty
        config['configured_mcps'] = agent_data.get('configured_mcps', [])
        config['custom_mcps'] = agent_data.get('custom_mcps', [])
        config['workflows'] = []
        config['triggers'] = []
    
    return config


def _extract_custom_agent_config(agent_data: Dict[str, Any], version_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Extract config for custom agents using versioning system."""
    agent_id = agent_data.get('agent_id', 'Unknown')
    
    if version_data:
        logger.debug(f"Using version data for custom agent {agent_id} (version: {version_data.get('version_name', 'unknown')})")
        
        # Extract from version data
        if version_data.get('config'):
            config = version_data['config'].copy()
            system_prompt = config.get('system_prompt', '')
            model = config.get('model')
            tools = config.get('tools', {})
            configured_mcps = tools.get('mcp', [])
            custom_mcps = tools.get('custom_mcp', [])
            agentpress_tools = tools.get('agentpress', {})
            workflows = config.get('workflows', [])
            triggers = config.get('triggers', [])
        else:
            # Legacy version format
            system_prompt = version_data.get('system_prompt', '')
            model = version_data.get('model')
            configured_mcps = version_data.get('configured_mcps', [])
            custom_mcps = version_data.get('custom_mcps', [])
            agentpress_tools = version_data.get('agentpress_tools', {})
            workflows = []
            triggers = []
        
        return {
            'agent_id': agent_data['agent_id'],
            'name': agent_data['name'],
            'description': agent_data.get('description'),
            'system_prompt': system_prompt,
            'model': model,
            'agentpress_tools': _extract_agentpress_tools_for_run(agentpress_tools),
            'configured_mcps': configured_mcps,
            'custom_mcps': custom_mcps,
            'workflows': workflows,
            'triggers': triggers,
            'avatar': agent_data.get('avatar'),
            'avatar_color': agent_data.get('avatar_color'),
            'profile_image_url': agent_data.get('profile_image_url'),
            'is_default': agent_data.get('is_default', False),
            'is_helium_default': False,
            'centrally_managed': False,
            'account_id': agent_data.get('account_id'),
            'current_version_id': agent_data.get('current_version_id'),
            'version_name': version_data.get('version_name', 'v1'),
            'restrictions': {}
        }
    
    # Fallback: create default config for custom agents without version data
    logger.warning(f"No version data found for custom agent {agent_id}, creating default configuration")
    
    return {
        'agent_id': agent_data['agent_id'],
        'name': agent_data.get('name', 'Unnamed Agent'),
        'description': agent_data.get('description', ''),
        'system_prompt': 'You are a helpful AI assistant.',
        'model': None,
        'agentpress_tools': _extract_agentpress_tools_for_run(_get_default_agentpress_tools()),
        'configured_mcps': [],
        'custom_mcps': [],
        'workflows': [],
        'triggers': [],
        'avatar': agent_data.get('avatar'),
        'avatar_color': agent_data.get('avatar_color'),
        'profile_image_url': agent_data.get('profile_image_url'),
        'is_default': agent_data.get('is_default', False),
        'is_helium_default': False,
        'centrally_managed': False,
        'account_id': agent_data.get('account_id'),
        'current_version_id': agent_data.get('current_version_id'),
        'version_name': 'v1',
        'restrictions': {}
    }


def build_unified_config(
    system_prompt: str,
    agentpress_tools: Dict[str, Any],
    configured_mcps: List[Dict[str, Any]],
    custom_mcps: Optional[List[Dict[str, Any]]] = None,
    avatar: Optional[str] = None,
    avatar_color: Optional[str] = None,
    helium_metadata: Optional[Dict[str, Any]] = None,
    workflows: Optional[List[Dict[str, Any]]] = None,
    triggers: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    simplified_tools = {}
    for tool_name, tool_config in agentpress_tools.items():
        if isinstance(tool_config, dict):
            simplified_tools[tool_name] = tool_config.get('enabled', False)
        elif isinstance(tool_config, bool):
            simplified_tools[tool_name] = tool_config
    
    config = {
        'system_prompt': system_prompt,
        'tools': {
            'agentpress': simplified_tools,
            'mcp': configured_mcps or [],
            'custom_mcp': custom_mcps or []
        },
        'workflows': workflows or [],
        'triggers': triggers or [],
        'metadata': {
            'avatar': avatar,
            'avatar_color': avatar_color
        }
    }
    
    if helium_metadata:
        config['helium_metadata'] = helium_metadata
    
    return config


def _get_default_agentpress_tools() -> Dict[str, bool]:
    """Get default AgentPress tools configuration for new custom agents."""
    return {
        "sb_shell_tool": True,
        "sb_files_tool": True,
        "sb_deploy_tool": True,
        "sb_expose_tool": True,
        "web_search_tool": True,
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        "sb_presentation_outline_tool": True,
        "sb_presentation_tool": True,

        "sb_sheets_tool": True,
        "sb_web_dev_tool": True,
        "browser_tool": True,
        "data_providers_tool": True,
        "agent_config_tool": True,
        "mcp_search_tool": True,
        "credential_profile_tool": True,
        "workflow_tool": True,
        "trigger_tool": True
    }


def _extract_agentpress_tools_for_run(agentpress_config: Dict[str, Any]) -> Dict[str, Any]:
    """Convert agentpress tools config to runtime format."""
    if not agentpress_config:
        return {}
    
    run_tools = {}
    for tool_name, enabled in agentpress_config.items():
        if isinstance(enabled, bool):
            run_tools[tool_name] = {
                'enabled': enabled,
                'description': f"{tool_name} tool"
            }
        elif isinstance(enabled, dict):
            run_tools[tool_name] = enabled
        else:
            run_tools[tool_name] = {
                'enabled': bool(enabled),
                'description': f"{tool_name} tool"
            }
    
    return run_tools


