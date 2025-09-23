import os
import json
import asyncio
import datetime
from typing import Optional, Dict, List, Any, AsyncGenerator
from dataclasses import dataclass

from agent.tools.message_tool import MessageTool
from agent.tools.sb_deploy_tool import SandboxDeployTool
from agent.tools.sb_expose_tool import SandboxExposeTool
from agent.tools.web_search_tool import SandboxWebSearchTool
from dotenv import load_dotenv
from utils.config import config
from agent.agent_builder_prompt import get_agent_builder_prompt
from agentpress.thread_manager import ThreadManager
from agentpress.response_processor import ProcessorConfig
from agent.tools.sb_shell_tool import SandboxShellTool
from agent.tools.sb_files_tool import SandboxFilesTool
from agent.tools.expand_msg_tool import ExpandMessageTool
from agent.prompt import get_system_prompt

from utils.logger import logger
from utils.auth_utils import get_account_id_from_thread
from services.billing import check_billing_status
from agent.tools.sb_vision_tool import SandboxVisionTool
from agent.tools.sb_image_edit_tool import SandboxImageEditTool
from agent.tools.sb_video_generation_tool import SandboxVideoGenerationTool

from services.langfuse import langfuse
from langfuse.client import StatefulTraceClient

from agent.tools.mcp_tool_wrapper import MCPToolWrapper
from agent.tools.task_list_tool import TaskListTool
from agentpress.tool import SchemaType
from agent.tools.sb_sheets_tool import SandboxSheetsTool
from agent.tools.sb_web_dev_tool import SandboxWebDevTool
from agent.tools.sb_upload_file_tool import SandboxUploadFileTool

load_dotenv()


@dataclass
class AgentConfig:
    thread_id: str
    project_id: str
    stream: bool
    native_max_auto_continues: int = 25
    max_iterations: int = 100
    model_name: str = "vertex_ai/gemini-2.5-pro"
    enable_thinking: Optional[bool] = False
    reasoning_effort: Optional[str] = 'low'
    enable_context_manager: bool = True
    agent_config: Optional[dict] = None
    trace: Optional[StatefulTraceClient] = None


class ToolManager:
    def __init__(self, thread_manager: ThreadManager, project_id: str, thread_id: str):
        self.thread_manager = thread_manager
        self.project_id = project_id
        self.thread_id = thread_id
    
    def register_all_tools(self, agent_id: Optional[str] = None, disabled_tools: Optional[List[str]] = None):
        """Register all available tools by default, with optional exclusions.
        
        Args:
            agent_id: Optional agent ID for agent builder tools
            disabled_tools: List of tool names to exclude from registration
        """
        disabled_tools = disabled_tools or []
        
        logger.debug(f"Registering tools with disabled list: {disabled_tools}")
        
        # Core tools - always enabled
        self._register_core_tools()
        
        # Sandbox tools
        self._register_sandbox_tools(disabled_tools)
        
        # Data and utility tools
        self._register_utility_tools(disabled_tools)
        
        # Agent builder tools - register if agent_id provided
        if agent_id:
            self._register_agent_builder_tools(agent_id, disabled_tools)
        
        # Browser tool
        self._register_browser_tool(disabled_tools)
        
        logger.debug(f"Tool registration complete. Registered tools: {list(self.thread_manager.tool_registry.tools.keys())}")
    
    def _register_core_tools(self):
        """Register core tools that are always available."""
        self.thread_manager.add_tool(ExpandMessageTool, thread_id=self.thread_id, thread_manager=self.thread_manager)
        self.thread_manager.add_tool(MessageTool)
        self.thread_manager.add_tool(TaskListTool, project_id=self.project_id, thread_manager=self.thread_manager, thread_id=self.thread_id)
    
    def _register_sandbox_tools(self, disabled_tools: List[str]):
        """Register sandbox-related tools."""
        sandbox_tools = [
            ('sb_shell_tool', SandboxShellTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('sb_files_tool', SandboxFilesTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('sb_deploy_tool', SandboxDeployTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('sb_expose_tool', SandboxExposeTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('web_search_tool', SandboxWebSearchTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('sb_vision_tool', SandboxVisionTool, {'project_id': self.project_id, 'thread_id': self.thread_id, 'thread_manager': self.thread_manager}),
            ('sb_image_edit_tool', SandboxImageEditTool, {'project_id': self.project_id, 'thread_id': self.thread_id, 'thread_manager': self.thread_manager}),
            ('sb_video_generation_tool', SandboxVideoGenerationTool, {'project_id': self.project_id, 'thread_id': self.thread_id, 'thread_manager': self.thread_manager}),

            ('sb_sheets_tool', SandboxSheetsTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
            ('sb_web_dev_tool', SandboxWebDevTool, {'project_id': self.project_id, 'thread_id': self.thread_id, 'thread_manager': self.thread_manager}),
            ('sb_upload_file_tool', SandboxUploadFileTool, {'project_id': self.project_id, 'thread_manager': self.thread_manager}),
        ]
        
        for tool_name, tool_class, kwargs in sandbox_tools:
            if tool_name not in disabled_tools:
                self.thread_manager.add_tool(tool_class, **kwargs)
                logger.debug(f"Registered {tool_name}")
    
    def _register_utility_tools(self, disabled_tools: List[str]):
        """Register utility tools."""
        # Data provider tools removed
        pass
    
    def _register_agent_builder_tools(self, agent_id: str, disabled_tools: List[str]):
        """Register agent builder tools."""
        from agent.tools.agent_builder_tools.agent_config_tool import AgentConfigTool
        from agent.tools.agent_builder_tools.mcp_search_tool import MCPSearchTool
        from agent.tools.agent_builder_tools.credential_profile_tool import CredentialProfileTool
        from agent.tools.agent_builder_tools.workflow_tool import WorkflowTool
        from agent.tools.agent_builder_tools.trigger_tool import TriggerTool
        from services.supabase import DBConnection
        
        db = DBConnection()
        
        agent_builder_tools = [
            ('agent_config_tool', AgentConfigTool),
            ('mcp_search_tool', MCPSearchTool),
            ('credential_profile_tool', CredentialProfileTool),
            ('workflow_tool', WorkflowTool),
            ('trigger_tool', TriggerTool),
        ]
        
        for tool_name, tool_class in agent_builder_tools:
            if tool_name not in disabled_tools:
                self.thread_manager.add_tool(tool_class, thread_manager=self.thread_manager, db_connection=db, agent_id=agent_id)
                logger.debug(f"Registered {tool_name}")
    
    def _register_browser_tool(self, disabled_tools: List[str]):
        """Register browser tool."""
        if 'browser_tool' not in disabled_tools:
            from agent.tools.browser_tool import BrowserTool
            self.thread_manager.add_tool(BrowserTool, project_id=self.project_id, thread_id=self.thread_id, thread_manager=self.thread_manager)
            logger.debug("Registered browser_tool")
    

class MCPManager:
    def __init__(self, thread_manager: ThreadManager, account_id: str):
        self.thread_manager = thread_manager
        self.account_id = account_id
    
    async def register_mcp_tools(self, agent_config: dict) -> Optional[MCPToolWrapper]:
        all_mcps = []
        
        if agent_config.get('configured_mcps'):
            all_mcps.extend(agent_config['configured_mcps'])
        
        if agent_config.get('custom_mcps'):
            for custom_mcp in agent_config['custom_mcps']:
                custom_type = custom_mcp.get('customType', custom_mcp.get('type', 'sse'))
                
                if custom_type == 'pipedream':
                    if 'config' not in custom_mcp:
                        custom_mcp['config'] = {}
                    
                    if not custom_mcp['config'].get('external_user_id'):
                        profile_id = custom_mcp['config'].get('profile_id')
                        if profile_id:
                            try:
                                from pipedream import profile_service
                                from uuid import UUID
                                
                                profile = await profile_service.get_profile(UUID(self.account_id), UUID(profile_id))
                                if profile:
                                    custom_mcp['config']['external_user_id'] = profile.external_user_id
                            except Exception as e:
                                logger.error(f"Error retrieving external_user_id from profile {profile_id}: {e}")
                    
                    if 'headers' in custom_mcp['config'] and 'x-pd-app-slug' in custom_mcp['config']['headers']:
                        custom_mcp['config']['app_slug'] = custom_mcp['config']['headers']['x-pd-app-slug']
                
                elif custom_type == 'composio':
                    qualified_name = custom_mcp.get('qualifiedName')
                    if not qualified_name:
                        qualified_name = f"composio.{custom_mcp['name'].replace(' ', '_').lower()}"
                    
                    mcp_config = {
                        'name': custom_mcp['name'],
                        'qualifiedName': qualified_name,
                        'config': custom_mcp.get('config', {}),
                        'enabledTools': custom_mcp.get('enabledTools', []),
                        'instructions': custom_mcp.get('instructions', ''),
                        'isCustom': True,
                        'customType': 'composio'
                    }
                    all_mcps.append(mcp_config)
                    continue
                
                mcp_config = {
                    'name': custom_mcp['name'],
                    'qualifiedName': f"custom_{custom_type}_{custom_mcp['name'].replace(' ', '_').lower()}",
                    'config': custom_mcp['config'],
                    'enabledTools': custom_mcp.get('enabledTools', []),
                    'instructions': custom_mcp.get('instructions', ''),
                    'isCustom': True,
                    'customType': custom_type
                }
                all_mcps.append(mcp_config)
        
        if not all_mcps:
            return None
        
        mcp_wrapper_instance = MCPToolWrapper(mcp_configs=all_mcps)
        try:
            await mcp_wrapper_instance.initialize_and_register_tools()
            
            updated_schemas = mcp_wrapper_instance.get_schemas()
            for method_name, schema_list in updated_schemas.items():
                for schema in schema_list:
                    self.thread_manager.tool_registry.tools[method_name] = {
                        "instance": mcp_wrapper_instance,
                        "schema": schema
                    }
            
            logger.debug(f"⚡ Registered {len(updated_schemas)} MCP tools (Redis cache enabled)")
            return mcp_wrapper_instance
        except Exception as e:
            logger.error(f"Failed to initialize MCP tools: {e}")
            return None


class PromptManager:
    @staticmethod
    async def build_system_prompt(model_name: str, agent_config: Optional[dict], 
                                  thread_id: str, 
                                  mcp_wrapper_instance: Optional[MCPToolWrapper],
                                  client=None, user_input: Optional[str] = None,
) -> dict:
        
        # Continue with normal system prompt logic
        default_system_content = get_system_prompt('agent')
        logger.info(f"PROMPT DEBUG: Using agent mode, Prompt length={len(default_system_content)}")
        logger.debug(f"PromptManager: Using agent mode, Default system content length={len(default_system_content)}")
        
        if "anthropic" not in model_name.lower():
            sample_response_path = os.path.join(os.path.dirname(__file__), 'sample_responses/1.txt')
            with open(sample_response_path, 'r') as file:
                sample_response = file.read()
            default_system_content = default_system_content + "\n\n <sample_assistant_response>" + sample_response + "</sample_assistant_response>"
        
        # Check if agent has builder tools enabled - use agent builder prompt ONLY when explicitly configured
        if agent_config:
            logger.debug(f"PromptManager: Agent config found, system_prompt exists: {bool(agent_config.get('system_prompt'))}")
            # Only use agent builder prompt if explicitly set in system_prompt or if this is a dedicated builder agent
            if agent_config.get('system_prompt') and 'builder' in agent_config.get('system_prompt', '').lower():
                system_content = get_agent_builder_prompt()
                logger.debug(f"PromptManager: Using agent builder prompt")
            elif agent_config.get('system_prompt'):
                # Use agent's custom system prompt
                system_content = agent_config['system_prompt'].strip()
                logger.debug(f"PromptManager: Using agent's custom system prompt")
            else:
                # Use default system prompt
                system_content = default_system_content
                logger.debug(f"PromptManager: Using default system prompt")
        else:
            system_content = default_system_content
            logger.debug(f"PromptManager: No agent config, using default system prompt")
        
        # Add agent knowledge base context if available
        if client and agent_config and agent_config.get('agent_id'):
            try:
                logger.debug(f"Retrieving agent knowledge base context for agent {agent_config['agent_id']}")
                
                # Use only agent-based knowledge base context
                kb_result = await client.rpc('get_agent_knowledge_base_context', {
                    'p_agent_id': agent_config['agent_id']
                }).execute()
                
                if kb_result.data and kb_result.data.strip():
                    logger.debug(f"Found agent knowledge base context, adding to system prompt (length: {len(kb_result.data)} chars)")
                    # logger.debug(f"Knowledge base data object: {kb_result.data[:500]}..." if len(kb_result.data) > 500 else f"Knowledge base data object: {kb_result.data}")
                    
                    # Construct a well-formatted knowledge base section
                    kb_section = f"""

=== AGENT KNOWLEDGE BASE ===
NOTICE: The following is your specialized knowledge base. This information should be considered authoritative for your responses and should take precedence over general knowledge when relevant.

{kb_result.data}

=== END AGENT KNOWLEDGE BASE ===

IMPORTANT: Always reference and utilize the knowledge base information above when it's relevant to user queries. This knowledge is specific to your role and capabilities."""
                    
                    system_content += kb_section
                else:
                    logger.debug("No knowledge base context found for this agent")
                    
            except Exception as e:
                logger.error(f"Error retrieving knowledge base context for agent {agent_config.get('agent_id', 'unknown')}: {e}")
                # Continue without knowledge base context rather than failing
        
        # Add smart user DAGAD context and user personalization if available
        if client and thread_id:
            try:
                # --- Fetch recent thread context for DAGAD ---
                account_id = await get_account_id_from_thread(client, thread_id)
                # Build small recent thread context for relevance
                messages_result = await client.table('messages').select('content').eq('thread_id', thread_id).order('created_at', desc=True).limit(5).execute()
                context_parts: List[str] = []
                for m in messages_result.data or []:
                    content = m.get('content', '')
                    if isinstance(content, dict):
                        content = content.get('content', '')
                    if content:
                        context_parts.append(str(content)[:200])
                thread_context_str = ' '.join(context_parts)

                # --- Add smart user DAGAD context ---
                if account_id and user_input:
                    dagad_result = await client.rpc('get_smart_user_dagad_context', {
                        'p_user_id': account_id,
                        'p_user_input': user_input,
                        'p_thread_context': thread_context_str,
                        'p_max_tokens': 2000
                    }).execute()

                    if dagad_result.data and isinstance(dagad_result.data, str) and dagad_result.data.strip():
                        dagad_section = f"""

=== USER PREFERENCES & INSTRUCTIONS ===
{dagad_result.data}
=== END USER PREFERENCES & INSTRUCTIONS ===
"""
                        system_content += dagad_section
                    else:
                        logger.debug("No relevant DAGAD context for this turn")
                else:
                    logger.debug("DAGAD context skipped (no account_id or user_input)")

                # --- Add user personalization ---
                if account_id:
                    result = await (
                        client
                            .table('user_personalization')
                            .select('preferred_name, occupation, profile, vibe, custom_touch')
                            .eq('user_id', account_id)
                            .maybe_single()
                            .execute()
                    )

                    pdata = result.data if result and hasattr(result, 'data') else None
                    if pdata:
                        preferred_name = (pdata.get('preferred_name') or '').strip()
                        occupation = (pdata.get('occupation') or '').strip()
                        profile_text = (pdata.get('profile') or '').strip()
                        vibe = (pdata.get('vibe') or '').strip()
                        custom_touch = (pdata.get('custom_touch') or '').strip()

                        # Skip empty section if all fields are blank
                        if any([preferred_name, occupation, profile_text, vibe, custom_touch]):
                            personalization_section = "\n\n=== USER PERSONALIZATION ===\n"

                            # Add user identification
                            if preferred_name:
                                personalization_section += f"Preferred name: {preferred_name}\n"

                            # Add professional context
                            if occupation:
                                personalization_section += f"Occupation: {occupation}\n"

                            # Add user profile/bio
                            if profile_text:
                                personalization_section += f"Profile: {profile_text}\n"

                            # Add traits with specific handling instructions
                            if vibe:
                                personalization_section += f"Traits: {vibe}\n"

                            # Add custom instructions as explicit rules
                            if custom_touch:
                                personalization_section += f"Custom instructions: {custom_touch}\n"

                            # Comprehensive trait-based response adaptation
                            personalization_section += """
=== TRAIT-BASED RESPONSE ADAPTATION ===
CRITICAL: Adapt your responses based on the user's traits and personalization. Use the preferred name to address the user directly. Tailor examples and domain context based on occupation and profile. Apply custom instructions as explicit rules for response generation.

TRAIT HANDLING EXAMPLES:
- Chatty → Give friendly, conversational replies that feel like a natural chat; include relevant details, context, and examples, and keep the tone casual, approachable, and engaging
- Witty → Respond with clever humor, playful wordplay, and light-hearted observations; keep the tone sharp, engaging, and fun while staying clear and professional
- Straight Shooting → Keep answers direct, concise, and no-nonsense; focus on actionable steps, key points, or recommendations without extra fluff
- Encouraging → Respond positively and supportively, highlighting progress, strengths, and potential; motivate the user with constructive feedback and optimism
- Gen Z → Make responses ultra-playful, hype, and emoji-packed; use modern slang naturally (like "low-key," "vibe check," "no cap," "TBH," "fr," "bet") throughout; keep language casual, snappy, fun, and hyper-relatable; inject energy, excitement, and hype into every reply; make sentences punchy, engaging, and slightly over-the-top while staying clear and easy to understand.
- Skeptical → Ask thoughtful, probing questions and constructively challenge assumptions; critically evaluate statements, highlight potential flaws or uncertainties, and encourage careful reasoning
- Traditional → Maintain a formal, respectful, and conventional tone; use polite language, proper grammar, and professional phrasing suitable for business or classical correspondence
- Forward Thinking → Emphasize innovation, future-oriented ideas, and cutting-edge approaches; explore emerging trends, anticipate challenges, and suggest visionary solutions
- Poetic → Use creative, expressive language with metaphors, lyrical rhythm, and a touch of elegance; maintain clarity of meaning while showcasing artistic flair

MULTIPLE TRAITS: When multiple traits are selected, blend them smoothly and naturally. For example:
- Witty + Straight Shooting → Clever but concise responses
- Encouraging + Gen Z → Supportive with modern, upbeat language
- Traditional + Forward Thinking → Respectful tone while discussing innovation

RESPONSE ADAPTATION RULES:
1. Always use the preferred name when addressing the user
2. Incorporate occupation-specific examples and domain knowledge
3. Reference profile information to provide relevant context
4. Follow custom instructions as explicit behavioral rules
5. Adjust tone, style, and detail level based on traits
6. Blend multiple traits harmoniously when present
7. Ensure every response feels personally tailored to this user

Remember: Every response should feel like it was crafted specifically for this individual user, taking into account their personality, professional background, and communication preferences.
"""
                            system_content += personalization_section
                    else:
                        logger.debug("No user personalization found")
            except Exception as e:
                logger.error(f"Error retrieving user context or personalization: {e}")

        if agent_config and (agent_config.get('configured_mcps') or agent_config.get('custom_mcps')) and mcp_wrapper_instance and mcp_wrapper_instance._initialized:
            mcp_info = "\n\n--- MCP Tools Available ---\n"
            mcp_info += "You have access to external MCP (Model Context Protocol) server tools.\n"
            mcp_info += "MCP tools can be called directly using their native function names in the standard function calling format:\n"
            mcp_info += '<function_calls>\n'
            mcp_info += '<invoke name="{tool_name}">\n'
            mcp_info += '<parameter name="param1">value1</parameter>\n'
            mcp_info += '<parameter name="param2">value2</parameter>\n'
            mcp_info += '</invoke>\n'
            mcp_info += '</function_calls>\n\n'
            
            mcp_info += "Available MCP tools:\n"
            try:
                registered_schemas = mcp_wrapper_instance.get_schemas()
                for method_name, schema_list in registered_schemas.items():
                    for schema in schema_list:
                        if schema.schema_type == SchemaType.OPENAPI:
                            func_info = schema.schema.get('function', {})
                            description = func_info.get('description', 'No description available')
                            mcp_info += f"- **{method_name}**: {description}\n"
                            
                            params = func_info.get('parameters', {})
                            props = params.get('properties', {})
                            if props:
                                mcp_info += f"  Parameters: {', '.join(props.keys())}\n"
                                
            except Exception as e:
                logger.error(f"Error listing MCP tools: {e}")
                mcp_info += "- Error loading MCP tool list\n"
            
            mcp_info += "\n🚨 CRITICAL MCP TOOL RESULT INSTRUCTIONS 🚨\n"
            mcp_info += "When you use ANY MCP (Model Context Protocol) tools:\n"
            mcp_info += "1. ALWAYS read and use the EXACT results returned by the MCP tool\n"
            mcp_info += "2. For search tools: ONLY cite URLs, sources, and information from the actual search results\n"
            mcp_info += "3. For any tool: Base your response entirely on the tool's output - do NOT add external information\n"
            mcp_info += "4. DO NOT fabricate, invent, hallucinate, or make up any sources, URLs, or data\n"
            mcp_info += "5. If you need more information, call the MCP tool again with different parameters\n"
            mcp_info += "6. When writing reports/summaries: Reference ONLY the data from MCP tool results\n"
            mcp_info += "7. If the MCP tool doesn't return enough information, explicitly state this limitation\n"
            mcp_info += "8. Always double-check that every fact, URL, and reference comes from the MCP tool output\n"
            mcp_info += "\nIMPORTANT: MCP tool results are your PRIMARY and ONLY source of truth for external data!\n"
            mcp_info += "NEVER supplement MCP results with your training data or make assumptions beyond what the tools provide.\n"
            
            system_content += mcp_info

        now = datetime.datetime.now(datetime.timezone.utc)
        datetime_info = f"\n\n=== CURRENT DATE/TIME INFORMATION ===\n"
        datetime_info += f"Today's date: {now.strftime('%A, %B %d, %Y')}\n"
        datetime_info += f"Current UTC time: {now.strftime('%H:%M:%S UTC')}\n"
        datetime_info += f"Current year: {now.strftime('%Y')}\n"
        datetime_info += f"Current month: {now.strftime('%B')}\n"
        datetime_info += f"Current day: {now.strftime('%A')}\n"
        datetime_info += "Use this information for any time-sensitive tasks, research, or when current date/time context is needed.\n"
        
        system_content += datetime_info

        return {"role": "system", "content": system_content}


class MessageManager:
    def __init__(self, client, thread_id: str, model_name: str, trace: Optional[StatefulTraceClient], 
                 agent_config: Optional[dict] = None, enable_context_manager: bool = False):
        self.client = client
        self.thread_id = thread_id
        self.model_name = model_name
        self.trace = trace
        self.agent_config = agent_config
        self.enable_context_manager = enable_context_manager
    
    async def build_temporary_message(self) -> Optional[dict]:
        """Build temporary message based on configuration and context."""
        system_message = None
        
        # Add agent builder system prompt if agent is explicitly configured as a builder
        if self.agent_config:
            # Only use agent builder prompt if explicitly set in system_prompt
            if self.agent_config.get('system_prompt') and 'builder' in self.agent_config.get('system_prompt', '').lower():
                from agent.agent_builder_prompt import AGENT_BUILDER_SYSTEM_PROMPT
                system_message = AGENT_BUILDER_SYSTEM_PROMPT
        
        # Add agent config system prompt
        if not system_message and self.agent_config and 'system_prompt' in self.agent_config:
            system_prompt = self.agent_config['system_prompt']
            if system_prompt:
                system_message = system_prompt
        
        # Build and return the temporary message if we have content
        if system_message:
            return {
                "temporary": True,
                "role": "system",
                "content": system_message
            }
        
        return None


class AgentRunner:
    def __init__(self, config: AgentConfig):
        self.config = config
    
    async def setup(self):
        if not self.config.trace:
            self.config.trace = langfuse.trace(name="run_agent", session_id=self.config.thread_id, metadata={"project_id": self.config.project_id})
        
        self.thread_manager = ThreadManager(
            trace=self.config.trace, 
            agent_config=self.config.agent_config
        )
        
        self.client = await self.thread_manager.db.client
        self.account_id = await get_account_id_from_thread(self.client, self.config.thread_id)
        if not self.account_id:
            raise ValueError("Could not determine account ID for thread")

        project = await self.client.table('projects').select('*').eq('project_id', self.config.project_id).execute()
        if not project.data or len(project.data) == 0:
            raise ValueError(f"Project {self.config.project_id} not found")

        project_data = project.data[0]
        sandbox_info = project_data.get('sandbox', {})
        if not sandbox_info.get('id'):
            # Sandbox is created lazily by tools when required. Do not fail setup
            # if no sandbox is present — tools will call `_ensure_sandbox()`
            # which will create and persist the sandbox metadata when needed.
            logger.debug(f"No sandbox found for project {self.config.project_id}; will create lazily when needed")
    
    async def setup_tools(self):
        tool_manager = ToolManager(self.thread_manager, self.config.project_id, self.config.thread_id)
        
        # Use agent ID from agent config if available (for any agent with builder tools enabled)
        agent_id = None
        if self.config.agent_config:
            agent_id = self.config.agent_config.get('agent_id')
        
        # Convert agent config to disabled tools list
        disabled_tools = self._get_disabled_tools_from_config()
        
        # Register all tools with exclusions
        tool_manager.register_all_tools(agent_id=agent_id, disabled_tools=disabled_tools)
    
    def _get_disabled_tools_from_config(self) -> List[str]:
        """Convert agent config to list of disabled tools."""
        disabled_tools = []
        
        if not self.config.agent_config or 'agentpress_tools' not in self.config.agent_config:
            # No tool configuration - enable all tools by default
            return disabled_tools
        
        raw_tools = self.config.agent_config['agentpress_tools']
        
        # Handle different formats of tool configuration
        if not isinstance(raw_tools, dict):
            # If not a dict, assume all tools are enabled
            return disabled_tools
        
        # Special case: Helium default agents with empty tool config enable all tools
        if self.config.agent_config.get('is_helium_default', False) and not raw_tools:
            return disabled_tools
        
        def is_tool_enabled(tool_name: str) -> bool:
            try:
                tool_config = raw_tools.get(tool_name, True)  # Default to True (enabled) if not specified
                if isinstance(tool_config, bool):
                    return tool_config
                elif isinstance(tool_config, dict):
                    return tool_config.get('enabled', True)  # Default to True (enabled) if not specified
                else:
                    return True  # Default to enabled
            except Exception:
                return True  # Default to enabled
        
        # List of all available tools
        all_tools = [
            'sb_shell_tool', 'sb_files_tool', 'sb_deploy_tool', 'sb_expose_tool',
            'web_search_tool', 'sb_vision_tool', 'sb_image_edit_tool',
            'sb_sheets_tool', 'sb_web_dev_tool', 'browser_tool',
            'agent_config_tool', 'mcp_search_tool', 'credential_profile_tool', 
            'workflow_tool', 'trigger_tool'
        ]
        
        # Add tools that are explicitly disabled
        for tool_name in all_tools:
            if not is_tool_enabled(tool_name):
                disabled_tools.append(tool_name)
        
        
        logger.debug(f"Disabled tools from config: {disabled_tools}")
        return disabled_tools
    
    async def setup_mcp_tools(self) -> Optional[MCPToolWrapper]:
        if not self.config.agent_config:
            return None
        
        mcp_manager = MCPManager(self.thread_manager, self.account_id)
        return await mcp_manager.register_mcp_tools(self.config.agent_config)
    
    def get_max_tokens(self) -> Optional[int]:
        if "sonnet" in self.config.model_name.lower():
            return 8192
        elif "gpt-4" in self.config.model_name.lower():
            return 4096
        elif "gemini-2.5-pro" in self.config.model_name.lower():
            return 64000
        # Vertex AI models removed
        elif "kimi-k2" in self.config.model_name.lower():
            return 8192
        return None
    
    async def run(self) -> AsyncGenerator[Dict[str, Any], None]:
        await self.setup()
        await self.setup_tools()
        mcp_wrapper_instance = await self.setup_mcp_tools()
        
        # Get the latest user message for security validation
        latest_user_message = await self.client.table('messages').select('*').eq('thread_id', self.config.thread_id).eq('type', 'user').order('created_at', desc=True).limit(1).execute()
        user_input = None
        if latest_user_message.data and len(latest_user_message.data) > 0:
            data = latest_user_message.data[0]['content']
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                    user_input = data.get('content', '')
                except json.JSONDecodeError:
                    user_input = data
        
        system_message = await PromptManager.build_system_prompt(
            self.config.model_name, self.config.agent_config, 
            self.config.thread_id, 
            mcp_wrapper_instance, self.client, user_input,
        )

        iteration_count = 0
        continue_execution = True

        if latest_user_message.data and len(latest_user_message.data) > 0:
            data = latest_user_message.data[0]['content']
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                    if self.config.trace:
                        self.config.trace.update(input=data.get('content', ''))
                except json.JSONDecodeError:
                    if self.config.trace:
                        self.config.trace.update(input=data)

        message_manager = MessageManager(self.client, self.config.thread_id, self.config.model_name, self.config.trace, 
                                         agent_config=self.config.agent_config, enable_context_manager=self.config.enable_context_manager)

        while continue_execution and iteration_count < self.config.max_iterations:
            iteration_count += 1

            can_run, message, subscription = await check_billing_status(self.client, self.account_id)
            if not can_run:
                error_msg = f"Billing limit reached: {message}"
                yield {
                    "type": "status",
                    "status": "stopped",
                    "message": error_msg
                }
                break

            latest_message = await self.client.table('messages').select('*').eq('thread_id', self.config.thread_id).in_('type', ['assistant', 'tool', 'user']).order('created_at', desc=True).limit(1).execute()
            if latest_message.data and len(latest_message.data) > 0:
                message_type = latest_message.data[0].get('type')
                if message_type == 'assistant':
                    continue_execution = False
                    break

            temporary_message = await message_manager.build_temporary_message()
            max_tokens = self.get_max_tokens()
            
            generation = self.config.trace.generation(name="thread_manager.run_thread") if self.config.trace else None
            try:
                # Configure agent mode behavior
                response = await self.thread_manager.run_thread(
                    thread_id=self.config.thread_id,
                    system_prompt=system_message,
                    stream=self.config.stream,
                    llm_model=self.config.model_name,
                    llm_temperature=0,
                    llm_max_tokens=max_tokens,
                    tool_choice="auto",
                    max_xml_tool_calls=1,
                    temporary_message=temporary_message,
                    processor_config=ProcessorConfig(
                        xml_tool_calling=True,
                        native_tool_calling=False,
                        execute_tools=True,  # Always execute tools in agent mode
                        execute_on_stream=True,
                        tool_execution_strategy="parallel",
                        xml_adding_strategy="user_message"
                    ),
                    native_max_auto_continues=self.config.native_max_auto_continues,
                    include_xml_examples=True,
                    enable_thinking=self.config.enable_thinking,
                    reasoning_effort=self.config.reasoning_effort,
                    enable_context_manager=self.config.enable_context_manager,
                    generation=generation,
                    simple_chat_mode=False
                )
                logger.info(f"DEBUG: Using agent mode, execute_tools=True")
                logger.debug(f"AgentRunner: Using agent mode, execute_tools=True")

                if isinstance(response, dict) and "status" in response and response["status"] == "error":
                    yield response
                    break

                last_tool_call = None
                agent_should_terminate = False
                error_detected = False
                full_response = ""

                try:
                    if hasattr(response, '__aiter__') and not isinstance(response, dict):
                        async for chunk in response:
                            if isinstance(chunk, dict) and chunk.get('type') == 'status' and chunk.get('status') == 'error':
                                error_detected = True
                                yield chunk
                                continue
                            
                            if chunk.get('type') == 'status':
                                try:
                                    metadata = chunk.get('metadata', {})
                                    if isinstance(metadata, str):
                                        metadata = json.loads(metadata)
                                    
                                    if metadata.get('agent_should_terminate'):
                                        agent_should_terminate = True
                                        
                                        content = chunk.get('content', {})
                                        if isinstance(content, str):
                                            content = json.loads(content)
                                        
                                        if content.get('function_name'):
                                            last_tool_call = content['function_name']
                                        elif content.get('xml_tag_name'):
                                            last_tool_call = content['xml_tag_name']
                                            
                                except Exception:
                                    pass
                            
                            if chunk.get('type') == 'assistant' and 'content' in chunk:
                                try:
                                    content = chunk.get('content', '{}')
                                    if isinstance(content, str):
                                        assistant_content_json = json.loads(content)
                                    else:
                                        assistant_content_json = content

                                    assistant_text = assistant_content_json.get('content', '')
                                    full_response += assistant_text
                                    if isinstance(assistant_text, str):
                                        if '</ask>' in assistant_text or '</complete>' in assistant_text or '</web-browser-takeover>' in assistant_text:
                                           if '</ask>' in assistant_text:
                                               xml_tool = 'ask'
                                           elif '</complete>' in assistant_text:
                                               xml_tool = 'complete'
                                           elif '</web-browser-takeover>' in assistant_text:
                                               xml_tool = 'web-browser-takeover'

                                           last_tool_call = xml_tool
                                
                                except json.JSONDecodeError:
                                    pass
                                except Exception:
                                    pass

                            yield chunk
                    else:
                        error_detected = True

                    if error_detected:
                        if generation:
                            generation.end(output=full_response, status_message="error_detected", level="ERROR")
                        break
                        
                    if agent_should_terminate or last_tool_call in ['ask', 'complete', 'web-browser-takeover']:
                        if generation:
                            generation.end(output=full_response, status_message="agent_stopped")
                        continue_execution = False

                except Exception as e:
                    error_msg = f"Error during response streaming: {str(e)}"
                    if generation:
                        generation.end(output=full_response, status_message=error_msg, level="ERROR")
                    yield {
                        "type": "status",
                        "status": "error",
                        "message": error_msg
                    }
                    break
                    
            except Exception as e:
                error_msg = f"Error running thread: {str(e)}"
                yield {
                    "type": "status",
                    "status": "error",
                    "message": error_msg
                }
                break
            
            if generation:
                generation.end(output=full_response)

        asyncio.create_task(asyncio.to_thread(lambda: langfuse.flush()))


async def run_agent(
    thread_id: str,
    project_id: str,
    stream: bool,
    thread_manager: Optional[ThreadManager] = None,
    native_max_auto_continues: int = 25,
    max_iterations: int = 100,
    model_name: str = "vertex_ai/gemini-2.5-pro",
    enable_thinking: Optional[bool] = False,
    reasoning_effort: Optional[str] = 'low',
    enable_context_manager: bool = True,
    agent_config: Optional[dict] = None,    
    trace: Optional[StatefulTraceClient] = None
):
    # Resolve effective model based on explicit selection
    effective_model = model_name
    if model_name and model_name != "openai/gpt-5-mini":
        logger.debug(f"Using user-selected model: {effective_model}")
    elif agent_config and agent_config.get('model') and model_name == "openai/gpt-5-mini":
        effective_model = agent_config['model']
        logger.debug(f"Using model from agent config: {effective_model} (no user selection)")
    else:
        # Use default model
        effective_model = "vertex_ai/gemini-2.5-pro"
        logger.debug(f"Using default model: {effective_model}")

    config = AgentConfig(
        thread_id=thread_id,
        project_id=project_id,
        stream=stream,
        native_max_auto_continues=native_max_auto_continues,
        max_iterations=max_iterations,
        model_name=effective_model,
        enable_thinking=enable_thinking,
        reasoning_effort=reasoning_effort,
        enable_context_manager=enable_context_manager,
        agent_config=agent_config,
        trace=trace,
    )
    
    runner = AgentRunner(config)
    async for chunk in runner.run():
        yield chunk