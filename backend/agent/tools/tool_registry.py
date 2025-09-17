"""
Tool Registry for dynamic tool discovery and documentation.
"""

import inspect
import importlib
import os
from typing import Dict, List, Any, Optional
from pathlib import Path
from agentpress.tool import Tool


class ToolRegistry:
    """Registry for discovering and documenting available tools."""
    
    def __init__(self):
        self.tools = {}
        self.schemas = {}
        
    def discover_tools(self) -> Dict[str, Any]:
        """Dynamically discover all available tools and their schemas.
        
        This method scans the tools directory for Python files that define tool classes
        and extracts their schemas and documentation.
        
        Returns:
            Dict[str, Any]: A dictionary mapping tool names to their class instances
        """
        tools_dir = Path(__file__).parent
        for tool_file in tools_dir.glob("*.py"):
            if tool_file.name.startswith("__"):
                continue
            self._register_tool_from_file(tool_file)
        return self.tools
    
    def _register_tool_from_file(self, tool_file: Path) -> None:
        """Register a tool from a Python file.
        
        Args:
            tool_file (Path): Path to the Python file containing the tool definition
        """
        try:
            # Import the module
            module_name = tool_file.stem
            spec = importlib.util.spec_from_file_location(module_name, tool_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Find tool classes in the module
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if issubclass(obj, Tool) and obj != Tool:
                    # Create an instance of the tool
                    try:
                        tool_instance = obj()
                        tool_name = name.lower().replace("tool", "")
                        self.tools[tool_name] = tool_instance
                        
                        # Get schemas if available
                        if hasattr(tool_instance, 'get_schemas'):
                            self.schemas[tool_name] = tool_instance.get_schemas()
                    except Exception as e:
                        print(f"Warning: Could not instantiate tool {name}: {e}")
                        continue
                        
        except Exception as e:
            print(f"Warning: Could not load tool from {tool_file}: {e}")
    
    def get_tool_schema(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get complete schema for a specific tool.
        
        Args:
            tool_name (str): The name of the tool to get the schema for
            
        Returns:
            Optional[Dict[str, Any]]: The schema for the tool, or None if not found
        """
        return self.schemas.get(tool_name, None)
    
    def list_available_tools(self) -> List[str]:
        """List all available tool names.
        
        Returns:
            List[str]: A list of all available tool names
        """
        return list(self.tools.keys())
    
    def get_tool_documentation(self, tool_name: str) -> Optional[str]:
        """Get human-readable documentation for a tool.
        
        Args:
            tool_name (str): The name of the tool to get documentation for
            
        Returns:
            Optional[str]: The documentation for the tool, or None if not found
        """
        tool = self.tools.get(tool_name)
        if tool and hasattr(tool, '__doc__'):
            return tool.__doc__
        return None
    
    def get_tool_instance(self, tool_name: str) -> Optional[Tool]:
        """Get an instance of a specific tool.
        
        Args:
            tool_name (str): The name of the tool to get an instance for
            
        Returns:
            Optional[Tool]: An instance of the tool, or None if not found
        """
        return self.tools.get(tool_name, None)


# Global registry instance
tool_registry = ToolRegistry()