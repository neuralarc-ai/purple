from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from utils.logger import logger
from .client import ComposioClient
from .composio_registry import composio_registry, AppCategory, CategorizedApp
from .toolkit_cache import toolkit_cache


class CategoryInfo(BaseModel):
    id: str
    name: str


class ToolkitInfo(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    tags: List[str] = []
    auth_schemes: List[str] = []
    categories: List[str] = []


class AuthConfigField(BaseModel):
    name: str
    displayName: str
    type: str
    description: Optional[str] = None
    required: bool = False
    default: Optional[str] = None
    legacy_template_name: Optional[str] = None


class AuthConfigDetails(BaseModel):
    name: str
    mode: str
    fields: Dict[str, Dict[str, List[AuthConfigField]]]


class DetailedToolkitInfo(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    tags: List[str] = []
    auth_schemes: List[str] = []
    categories: List[str] = []
    auth_config_details: List[AuthConfigDetails] = []
    connected_account_initiation_fields: Optional[Dict[str, List[AuthConfigField]]] = None
    base_url: Optional[str] = None


class ParameterSchema(BaseModel):
    properties: Dict[str, Any] = {}
    required: Optional[List[str]] = None


class ToolInfo(BaseModel):
    slug: str
    name: str
    description: str
    version: str
    input_parameters: ParameterSchema = ParameterSchema()
    output_parameters: ParameterSchema = ParameterSchema()
    scopes: List[str] = []
    tags: List[str] = []
    no_auth: bool = False


class ToolsListResponse(BaseModel):
    items: List[ToolInfo]
    next_cursor: Optional[str] = None
    total_items: int
    current_page: int = 1
    total_pages: int = 1


class ToolkitService:
    def __init__(self, api_key: Optional[str] = None):
        self.client = ComposioClient.get_client(api_key)
        self._all_toolkits_cache_key = "all_toolkits"
        self._categorized_cache_key = "categorized_toolkits"
    
    async def _fetch_all_toolkits_from_api(self) -> List[ToolkitInfo]:
        """Fetch all toolkits from API and cache them"""
        try:
            logger.debug("Fetching all toolkits from Composio API")
            
            # Check cache first
            cached_data = await toolkit_cache.get(self._all_toolkits_cache_key)
            if cached_data:
                logger.debug("Using cached toolkit data")
                return [ToolkitInfo(**toolkit) for toolkit in cached_data["toolkits"]]
            
            # Fetch from API
            params = {
                "limit": 1000,  # Increased limit to get more apps
                "managed_by": "composio"
            }
            
            toolkits_response = self.client.toolkits.list(**params)
            
            if hasattr(toolkits_response, '__dict__'):
                response_data = toolkits_response.__dict__
            else:
                response_data = toolkits_response
            
            items = response_data.get('items', [])
            
            toolkits = []
            for item in items:
                if hasattr(item, '__dict__'):
                    toolkit_data = item.__dict__
                elif hasattr(item, '_asdict'):
                    toolkit_data = item._asdict()
                else:
                    toolkit_data = item
                
                auth_schemes = toolkit_data.get("auth_schemes", [])
                
                logo_url = None
                meta = toolkit_data.get("meta", {})
                if isinstance(meta, dict):
                    logo_url = meta.get("logo")
                elif hasattr(meta, '__dict__'):
                    logo_url = meta.__dict__.get("logo")
                
                if not logo_url:
                    logo_url = toolkit_data.get("logo")
                
                tags = []
                categories = []
                if isinstance(meta, dict) and "categories" in meta:
                    category_list = meta.get("categories", [])
                    for cat in category_list:
                        if isinstance(cat, dict):
                            cat_name = cat.get("name", "")
                            cat_id = cat.get("id", "")
                            tags.append(cat_name)
                            categories.append(cat_id)
                        elif hasattr(cat, '__dict__'):
                            cat_name = cat.__dict__.get("name", "")
                            cat_id = cat.__dict__.get("id", "")
                            tags.append(cat_name)
                            categories.append(cat_id)
                
                description = None
                if isinstance(meta, dict):
                    description = meta.get("description")
                elif hasattr(meta, '__dict__'):
                    description = meta.__dict__.get("description")
                
                if not description:
                    description = toolkit_data.get("description")
                
                toolkit = ToolkitInfo(
                    slug=toolkit_data.get("slug", ""),
                    name=toolkit_data.get("name", ""),
                    description=description,
                    logo=logo_url,
                    tags=tags,
                    auth_schemes=auth_schemes,
                    categories=categories
                )
                toolkits.append(toolkit)
            
            # Cache the results
            cache_data = {
                "toolkits": [toolkit.dict() for toolkit in toolkits],
                "total_items": len(toolkits)
            }
            await toolkit_cache.set(self._all_toolkits_cache_key, cache_data)
            
            logger.debug(f"Successfully fetched and cached {len(toolkits)} toolkits")
            return toolkits
            
        except Exception as e:
            logger.error(f"Failed to fetch toolkits from API: {e}", exc_info=True)
            raise

    async def list_categories(self) -> List[CategoryInfo]:
        try:
            logger.debug("Fetching Composio categories from registry")
            
            registry_categories = composio_registry.get_categories()
            categories = [
                CategoryInfo(id=cat.id, name=cat.name) 
                for cat in registry_categories
            ]
            
            logger.debug(f"Successfully fetched {len(categories)} categories from registry")
            return categories
            
        except Exception as e:
            logger.error(f"Failed to list categories: {e}", exc_info=True)
            raise
    
    async def list_toolkits(self, limit: int = 500, cursor: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        try:
            logger.debug(f"Fetching toolkits with limit: {limit}, cursor: {cursor}, category: {category}")
            params = {
                "limit": limit,
                "managed_by": "composio"
            }
            
            if cursor:
                params["cursor"] = cursor
            if category:
                params["category"] = category
            
            toolkits_response = self.client.toolkits.list(**params)
            
            if hasattr(toolkits_response, '__dict__'):
                response_data = toolkits_response.__dict__
            else:
                response_data = toolkits_response
            
            items = response_data.get('items', [])
            
            toolkits = []
            for item in items:
                if hasattr(item, '__dict__'):
                    toolkit_data = item.__dict__
                elif hasattr(item, '_asdict'):
                    toolkit_data = item._asdict()
                else:
                    toolkit_data = item
                
                auth_schemes = toolkit_data.get("auth_schemes", [])
                composio_managed_auth_schemes = toolkit_data.get("composio_managed_auth_schemes", [])

                # Remove the OAUTH2 filter to include all toolkits
                # The frontend will handle filtering based on authentication requirements
                pass
                
                logo_url = None
                meta = toolkit_data.get("meta", {})
                if isinstance(meta, dict):
                    logo_url = meta.get("logo")
                elif hasattr(meta, '__dict__'):
                    logo_url = meta.__dict__.get("logo")
                
                if not logo_url:
                    logo_url = toolkit_data.get("logo")
                
                tags = []
                categories = []
                if isinstance(meta, dict) and "categories" in meta:
                    category_list = meta.get("categories", [])
                    for cat in category_list:
                        if isinstance(cat, dict):
                            cat_name = cat.get("name", "")
                            cat_id = cat.get("id", "")
                            tags.append(cat_name)
                            categories.append(cat_id)
                        elif hasattr(cat, '__dict__'):
                            cat_name = cat.__dict__.get("name", "")
                            cat_id = cat.__dict__.get("id", "")
                            tags.append(cat_name)
                            categories.append(cat_id)
                
                description = None
                if isinstance(meta, dict):
                    description = meta.get("description")
                elif hasattr(meta, '__dict__'):
                    description = meta.__dict__.get("description")
                
                if not description:
                    description = toolkit_data.get("description")
                
                toolkit = ToolkitInfo(
                    slug=toolkit_data.get("slug", ""),
                    name=toolkit_data.get("name", ""),
                    description=description,
                    logo=logo_url,
                    tags=tags,
                    auth_schemes=auth_schemes,
                    categories=categories
                )
                toolkits.append(toolkit)
            
            result = {
                "items": toolkits,
                "total_items": response_data.get("total_items", len(toolkits)),
                "total_pages": response_data.get("total_pages", 1),
                "current_page": response_data.get("current_page", 1),
                "next_cursor": response_data.get("next_cursor")
            }
            
            logger.debug(f"Successfully fetched {len(toolkits)} toolkits" + (f" for category {category}" if category else ""))
            return result
            
        except Exception as e:
            logger.error(f"Failed to list toolkits: {e}", exc_info=True)
            raise
    
    async def list_categorized_toolkits(self, limit: int = 500, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        Get toolkits organized by categories using the composio registry with caching
        """
        try:
            logger.debug("Fetching and categorizing toolkits with caching")
            
            # Check cache first
            cached_data = await toolkit_cache.get(self._categorized_cache_key)
            if cached_data:
                logger.debug("Using cached categorized toolkit data")
                return cached_data
            
            # Get all toolkits from cache or API
            toolkits = await self._fetch_all_toolkits_from_api()
            
            # Convert to dict format for registry
            toolkit_dicts = []
            for toolkit in toolkits:
                toolkit_dict = {
                    "slug": toolkit.slug,
                    "name": toolkit.name,
                    "description": toolkit.description,
                    "logo": toolkit.logo,
                    "tags": toolkit.tags,
                    "auth_schemes": toolkit.auth_schemes,
                    "categories": toolkit.categories
                }
                toolkit_dicts.append(toolkit_dict)
            
            # Categorize using registry
            categorized_toolkits = composio_registry.categorize_apps(toolkit_dicts)
            
            # Get category info
            categories = composio_registry.get_categories()
            category_info = {cat.id: {"name": cat.name, "description": cat.description} for cat in categories}
            
            result = {
                "categories": category_info,
                "categorized_toolkits": categorized_toolkits,
                "total_items": len(toolkits),
                "total_categories": len([cat for cat in categorized_toolkits.values() if cat])
            }
            
            # Cache the categorized results
            await toolkit_cache.set(self._categorized_cache_key, result)
            
            logger.debug(f"Successfully categorized {len(toolkits)} toolkits into {result['total_categories']} categories")
            return result
            
        except Exception as e:
            logger.error(f"Failed to list categorized toolkits: {e}", exc_info=True)
            raise
    
    async def get_toolkits_by_category(self, category_id: str, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        Get toolkits filtered by a specific category using cached data
        """
        try:
            logger.debug(f"Fetching toolkits for category: {category_id} (using cache)")
            
            # Get categorized data (from cache if available)
            try:
                categorized_data = await self.list_categorized_toolkits()
                categorized_toolkits = categorized_data.get("categorized_toolkits", {})
            except Exception as e:
                logger.error(f"Failed to get categorized data: {e}")
                # Fallback to empty result if categorization fails
                categorized_toolkits = {}
            
            # Get apps for specific category
            category_apps = categorized_toolkits.get(category_id, [])
            
            # Apply limit
            limited_apps = category_apps[:limit]
            
            # Convert back to ToolkitInfo format
            filtered_toolkits = []
            for app in limited_apps:
                # Handle both CategorizedApp objects and dictionaries
                if hasattr(app, 'slug'):
                    # It's a CategorizedApp object
                    toolkit = ToolkitInfo(
                        slug=app.slug,
                        name=app.name,
                        description=app.description,
                        logo=app.logo,
                        tags=app.tags,
                        auth_schemes=app.auth_schemes,
                        categories=[app.category_id]
                    )
                elif isinstance(app, dict):
                    # It's a dictionary
                    toolkit = ToolkitInfo(
                        slug=app.get("slug", ""),
                        name=app.get("name", ""),
                        description=app.get("description"),
                        logo=app.get("logo"),
                        tags=app.get("tags", []),
                        auth_schemes=app.get("auth_schemes", []),
                        categories=[app.get("category_id", "")]
                    )
                else:
                    # Fallback: try to convert to dict
                    app_dict = app.dict() if hasattr(app, 'dict') else {}
                    toolkit = ToolkitInfo(
                        slug=app_dict.get("slug", ""),
                        name=app_dict.get("name", ""),
                        description=app_dict.get("description"),
                        logo=app_dict.get("logo"),
                        tags=app_dict.get("tags", []),
                        auth_schemes=app_dict.get("auth_schemes", []),
                        categories=[app_dict.get("category_id", "")]
                    )
                filtered_toolkits.append(toolkit)
            
            result = {
                "items": filtered_toolkits,
                "total_items": len(category_apps),
                "total_pages": (len(category_apps) + limit - 1) // limit if limit > 0 else 1,
                "current_page": 1,
                "category_id": category_id,
                "category_name": composio_registry.get_category_by_id(category_id).name if composio_registry.get_category_by_id(category_id) else "Unknown"
            }
            
            logger.debug(f"Successfully fetched {len(filtered_toolkits)} toolkits for category {category_id} from cache")
            return result
            
        except Exception as e:
            logger.error(f"Failed to get toolkits for category {category_id}: {e}", exc_info=True)
            raise
    
    async def get_toolkit_by_slug(self, slug: str) -> Optional[ToolkitInfo]:
        try:
            toolkits_response = await self.list_toolkits()
            toolkits = toolkits_response.get("items", [])
            for toolkit in toolkits:
                if toolkit.slug == slug:
                    return toolkit
            return None
        except Exception as e:
            logger.error(f"Failed to get toolkit {slug}: {e}", exc_info=True)
            raise
    
    async def search_toolkits(self, query: str, category: Optional[str] = None, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        try:
            logger.debug(f"Searching toolkits with query: {query}, category: {category}")
            
            # Get all toolkits first
            toolkits_response = await self.list_toolkits(limit=500, cursor=cursor)
            toolkits = toolkits_response.get("items", [])
            
            # Convert to dict format for registry
            toolkit_dicts = []
            for toolkit in toolkits:
                toolkit_dict = {
                    "slug": toolkit.slug,
                    "name": toolkit.name,
                    "description": toolkit.description,
                    "logo": toolkit.logo,
                    "tags": toolkit.tags,
                    "auth_schemes": toolkit.auth_schemes,
                    "categories": toolkit.categories
                }
                toolkit_dicts.append(toolkit_dict)
            
            # Use registry for smart search
            search_results = composio_registry.search_apps(toolkit_dicts, query, category)
            
            # Apply limit
            limited_results = search_results[:limit]
            
            # Convert back to ToolkitInfo format
            result_toolkits = []
            for app in limited_results:
                toolkit = ToolkitInfo(
                    slug=app.slug,
                    name=app.name,
                    description=app.description,
                    logo=app.logo,
                    tags=app.tags,
                    auth_schemes=app.auth_schemes,
                    categories=[app.category_id]
                )
                result_toolkits.append(toolkit)
            
            result = {
                "items": result_toolkits,
                "total_items": len(search_results),
                "total_pages": (len(search_results) + limit - 1) // limit if limit > 0 else 1,
                "current_page": 1,
                "query": query,
                "category": category
            }
            
            logger.debug(f"Found {len(search_results)} toolkits matching query: {query}" + (f" in category {category}" if category else ""))
            return result
            
        except Exception as e:
            logger.error(f"Failed to search toolkits: {e}", exc_info=True)
            raise
    
    async def get_toolkit_icon(self, toolkit_slug: str) -> Optional[str]:
        try:
            logger.debug(f"Fetching toolkit icon for: {toolkit_slug}")
            toolkit_response = self.client.toolkits.retrieve(toolkit_slug)
            
            if hasattr(toolkit_response, 'model_dump'):
                toolkit_dict = toolkit_response.model_dump()
            elif hasattr(toolkit_response, '__dict__'):
                toolkit_dict = toolkit_response.__dict__
            else:
                toolkit_dict = dict(toolkit_response)
            
            meta = toolkit_dict.get('meta', {})
            if isinstance(meta, dict):
                logo = meta.get('logo')
            elif hasattr(meta, '__dict__'):
                logo = meta.__dict__.get('logo')
            else:
                logo = None
            
            logger.debug(f"Successfully fetched icon for {toolkit_slug}: {logo}")
            return logo
            
        except Exception as e:
            logger.error(f"Failed to get toolkit icon for {toolkit_slug}: {e}")
            return None

    async def get_detailed_toolkit_info(self, toolkit_slug: str) -> Optional[DetailedToolkitInfo]:
        try:
            logger.debug(f"Fetching detailed toolkit info for: {toolkit_slug}")
            toolkit_response = self.client.toolkits.retrieve(toolkit_slug)
            
            if hasattr(toolkit_response, 'model_dump'):
                toolkit_dict = toolkit_response.model_dump()
            elif hasattr(toolkit_response, '__dict__'):
                toolkit_dict = toolkit_response.__dict__
            else:
                toolkit_dict = dict(toolkit_response)
            
            logger.debug(f"Raw toolkit response for {toolkit_slug}: {toolkit_response}")
            
            meta = toolkit_dict.get('meta', {})
            if hasattr(meta, '__dict__'):
                meta = meta.__dict__
            
            detailed_toolkit = DetailedToolkitInfo(
                slug=toolkit_dict.get('slug', ''),
                name=toolkit_dict.get('name', ''),
                description=meta.get('description', '') if isinstance(meta, dict) else getattr(meta, 'description', ''),
                logo=meta.get('logo') if isinstance(meta, dict) else getattr(meta, 'logo', None),
                tags=[],
                auth_schemes=toolkit_dict.get('composio_managed_auth_schemes', []),
                categories=[],
                base_url=toolkit_dict.get('base_url')
            )
            
            categories_data = meta.get('categories', []) if isinstance(meta, dict) else getattr(meta, 'categories', [])
            detailed_toolkit.categories = [
                cat.get('name', '') if isinstance(cat, dict) else getattr(cat, 'name', '') 
                for cat in categories_data
            ]
            
            logger.debug(f"Parsed basic toolkit info: {detailed_toolkit}")
            
            auth_config_details = []
            raw_auth_configs = toolkit_dict.get('auth_config_details', [])
            
            for config in raw_auth_configs:
                if hasattr(config, '__dict__'):
                    config_dict = config.__dict__
                else:
                    config_dict = config
                
                fields_obj = config_dict.get('fields')
                if hasattr(fields_obj, '__dict__'):
                    fields_dict = fields_obj.__dict__
                else:
                    fields_dict = fields_obj or {}
                
                auth_fields = {}
                
                for field_type, field_type_obj in fields_dict.items():
                    auth_fields[field_type] = {}
                    
                    if hasattr(field_type_obj, '__dict__'):
                        field_type_dict = field_type_obj.__dict__
                    else:
                        field_type_dict = field_type_obj or {}
                    
                    for requirement_level in ['required', 'optional']:
                        field_list = field_type_dict.get(requirement_level, [])
                        
                        auth_config_fields = []
                        for field in field_list:
                            if hasattr(field, '__dict__'):
                                field_dict = field.__dict__
                            else:
                                field_dict = field
                            
                            auth_config_fields.append(AuthConfigField(
                                name=field_dict.get('name', ''),
                                displayName=field_dict.get('display_name', ''),
                                type=field_dict.get('type', 'string'),
                                description=field_dict.get('description'),
                                required=field_dict.get('required', False),
                                default=field_dict.get('default'),
                                legacy_template_name=field_dict.get('legacy_template_name')
                            ))
                        auth_fields[field_type][requirement_level] = auth_config_fields
                
                auth_config_details.append(AuthConfigDetails(
                    name=config_dict.get('name', ''),
                    mode=config_dict.get('mode', ''),
                    fields=auth_fields
                ))
            
            detailed_toolkit.auth_config_details = auth_config_details
            
            connected_account_initiation = None
            for config in raw_auth_configs:
                if hasattr(config, '__dict__'):
                    config_dict = config.__dict__
                else:
                    config_dict = config
                
                fields_obj = config_dict.get('fields')
                if hasattr(fields_obj, '__dict__'):
                    fields_dict = fields_obj.__dict__
                else:
                    fields_dict = fields_obj or {}
                
                initiation_obj = fields_dict.get('connected_account_initiation')
                if initiation_obj:
                    if hasattr(initiation_obj, '__dict__'):
                        initiation_dict = initiation_obj.__dict__
                    else:
                        initiation_dict = initiation_obj
                    
                    connected_account_initiation = {}
                    for requirement_level in ['required', 'optional']:
                        field_list = initiation_dict.get(requirement_level, [])
                        initiation_fields = []
                        for field in field_list:
                            if hasattr(field, '__dict__'):
                                field_dict = field.__dict__
                            else:
                                field_dict = field
                            
                            initiation_fields.append(AuthConfigField(
                                name=field_dict.get('name', ''),
                                displayName=field_dict.get('display_name', ''),
                                type=field_dict.get('type', 'string'),
                                description=field_dict.get('description'),
                                required=field_dict.get('required', False),
                                default=field_dict.get('default'),
                                legacy_template_name=field_dict.get('legacy_template_name')
                            ))
                        connected_account_initiation[requirement_level] = initiation_fields
                    break
            
            detailed_toolkit.connected_account_initiation_fields = connected_account_initiation
            
            logger.debug(f"Successfully fetched detailed info for {toolkit_slug}")
            logger.debug(f"Initiation fields: {connected_account_initiation}")
            return detailed_toolkit
            
        except Exception as e:
            logger.error(f"Failed to get detailed toolkit info for {toolkit_slug}: {e}", exc_info=True)
            return None

    async def get_toolkit_tools(self, toolkit_slug: str, limit: int = 50, cursor: Optional[str] = None) -> ToolsListResponse:
        try:
            logger.debug(f"Fetching tools for toolkit: {toolkit_slug}")
            
            params = {
                "limit": limit,
                "toolkit_slug": toolkit_slug
            }
            
            if cursor:
                params["cursor"] = cursor
            
            tools_response = self.client.tools.list(**params)
            
            if hasattr(tools_response, '__dict__'):
                response_data = tools_response.__dict__
            else:
                response_data = tools_response
            
            items = response_data.get('items', [])
            
            tools = []
            for item in items:
                if hasattr(item, '__dict__'):
                    tool_data = item.__dict__
                elif hasattr(item, '_asdict'):
                    tool_data = item._asdict()
                else:
                    tool_data = item
                
                input_params_raw = tool_data.get("input_parameters", {})
                output_params_raw = tool_data.get("output_parameters", {})
                
                input_parameters = ParameterSchema()
                if isinstance(input_params_raw, dict):
                    input_parameters.properties = input_params_raw.get("properties", input_params_raw)
                    input_parameters.required = input_params_raw.get("required")
                
                output_parameters = ParameterSchema()  
                if isinstance(output_params_raw, dict):
                    output_parameters.properties = output_params_raw.get("properties", output_params_raw)
                    output_parameters.required = output_params_raw.get("required")
                
                tool = ToolInfo(
                    slug=tool_data.get("slug", ""),
                    name=tool_data.get("name", ""),
                    description=tool_data.get("description", ""),
                    version=tool_data.get("version", "1.0.0"),
                    input_parameters=input_parameters,
                    output_parameters=output_parameters,
                    scopes=tool_data.get("scopes", []),
                    tags=tool_data.get("tags", []),
                    no_auth=tool_data.get("no_auth", False)
                )
                tools.append(tool)
            
            result = ToolsListResponse(
                items=tools,
                total_items=response_data.get("total_items", len(tools)),
                total_pages=response_data.get("total_pages", 1),
                current_page=response_data.get("current_page", 1),
                next_cursor=response_data.get("next_cursor")
            )
            
            logger.debug(f"Successfully fetched {len(tools)} tools for toolkit {toolkit_slug}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to get tools for toolkit {toolkit_slug}: {e}", exc_info=True)
            return ToolsListResponse(
                items=[],
                total_items=0,
                current_page=1,
                total_pages=1
            ) 