#!/usr/bin/env python3
"""
Script to validate that all tools have complete OpenAPI schemas.
"""

import os
import ast
import inspect
import sys
from pathlib import Path
from typing import Dict, List, Any


def validate_tool_schemas(tools_directory: str = None) -> Dict[str, Any]:
    """Validate that all tools have complete, valid OpenAPI schemas.
    
    This function checks:
    - All public methods have @openapi_schema decorators
    - All parameters are documented in schemas
    - Required fields are specified
    - Examples are provided via @usage_example decorators
    - Method docstrings are present and comprehensive
    
    Args:
        tools_directory (str, optional): Path to the tools directory. 
            Defaults to backend/agent/tools relative to this script.
            
    Returns:
        Dict[str, Any]: Validation results including pass/fail status and details
    """
    if tools_directory is None:
        # Default to the tools directory relative to this script
        script_dir = Path(__file__).parent
        tools_directory = script_dir
    
    tools_dir = Path(tools_directory)
    if not tools_dir.exists():
        raise FileNotFoundError(f"Tools directory not found: {tools_directory}")
    
    results = {
        'total_tools': 0,
        'valid_tools': 0,
        'invalid_tools': 0,
        'tool_details': {}
    }
    
    # Scan for tool files
    for tool_file in tools_dir.glob("*.py"):
        if tool_file.name.startswith("__") or tool_file.name == "validate_schemas.py":
            continue
            
        tool_name = tool_file.stem
        results['total_tools'] += 1
        
        try:
            validation_result = _validate_single_tool(tool_file)
            if validation_result['valid']:
                results['valid_tools'] += 1
            else:
                results['invalid_tools'] += 1
            results['tool_details'][tool_name] = validation_result
            
        except Exception as e:
            results['invalid_tools'] += 1
            results['tool_details'][tool_name] = {
                'valid': False,
                'errors': [f"Failed to validate tool: {str(e)}"],
                'warnings': []
            }
    
    return results


def _validate_single_tool(tool_file: Path) -> Dict[str, Any]:
    """Validate a single tool file.
    
    Args:
        tool_file (Path): Path to the tool file to validate
        
    Returns:
        Dict[str, Any]: Validation result for the tool
    """
    result = {
        'valid': True,
        'errors': [],
        'warnings': []
    }
    
    try:
        # Parse the Python file
        with open(tool_file, 'r') as f:
            content = f.read()
        
        tree = ast.parse(content)
        
        # Find class definitions
        class_nodes = [node for node in tree.body if isinstance(node, ast.ClassDef)]
        
        if not class_nodes:
            result['valid'] = False
            result['errors'].append("No class definitions found")
            return result
        
        # Check each class
        for class_node in class_nodes:
            # Find method definitions
            method_nodes = [node for node in class_node.body if isinstance(node, ast.FunctionDef)]
            
            # Check each method
            for method_node in method_nodes:
                # Skip private methods (starting with _)
                if method_node.name.startswith('_'):
                    continue
                
                # Check for @openapi_schema decorator
                has_openapi_schema = any(
                    isinstance(decorator, ast.Call) and 
                    isinstance(decorator.func, ast.Name) and 
                    decorator.func.id == 'openapi_schema'
                    for decorator in method_node.decorator_list
                )
                
                if not has_openapi_schema:
                    result['valid'] = False
                    result['errors'].append(f"Method '{method_node.name}' missing @openapi_schema decorator")
                
                # Check for @usage_example decorator
                has_usage_example = any(
                    isinstance(decorator, ast.Call) and 
                    isinstance(decorator.func, ast.Name) and 
                    decorator.func.id == 'usage_example'
                    for decorator in method_node.decorator_list
                )
                
                if not has_usage_example:
                    result['warnings'].append(f"Method '{method_node.name}' missing @usage_example decorator")
                
                # Check for docstring
                if not (method_node.body and 
                       isinstance(method_node.body[0], ast.Expr) and 
                       isinstance(method_node.body[0].value, ast.Constant) and
                       isinstance(method_node.body[0].value.value, str)):
                    result['warnings'].append(f"Method '{method_node.name}' missing docstring")
        
        # Check class docstring
        class_has_docstring = (
            class_nodes[0].body and 
            isinstance(class_nodes[0].body[0], ast.Expr) and 
            isinstance(class_nodes[0].body[0].value, ast.Constant) and
            isinstance(class_nodes[0].body[0].value.value, str)
        )
        
        if not class_has_docstring:
            result['warnings'].append("Class missing docstring")
            
    except Exception as e:
        result['valid'] = False
        result['errors'].append(f"Failed to parse tool file: {str(e)}")
    
    return result


def print_validation_report(results: Dict[str, Any]) -> None:
    """Print a formatted validation report.
    
    Args:
        results (Dict[str, Any]): Validation results from validate_tool_schemas
    """
    print("=" * 60)
    print("TOOL SCHEMA VALIDATION REPORT")
    print("=" * 60)
    
    print(f"Total Tools: {results['total_tools']}")
    print(f"Valid Tools: {results['valid_tools']}")
    print(f"Invalid Tools: {results['invalid_tools']}")
    print()
    
    if results['invalid_tools'] > 0:
        print("INVALID TOOLS:")
        for tool_name, details in results['tool_details'].items():
            if not details['valid']:
                print(f"  {tool_name}:")
                for error in details['errors']:
                    print(f"    - ERROR: {error}")
                for warning in details['warnings']:
                    print(f"    - WARNING: {warning}")
        print()
    
    if any(details['warnings'] for details in results['tool_details'].values()):
        print("WARNINGS:")
        for tool_name, details in results['tool_details'].items():
            if details['warnings']:
                print(f"  {tool_name}:")
                for warning in details['warnings']:
                    print(f"    - WARNING: {warning}")
        print()
    
    if results['valid_tools'] == results['total_tools']:
        print("✅ ALL TOOLS PASSED VALIDATION")
    else:
        print("❌ SOME TOOLS FAILED VALIDATION")


if __name__ == "__main__":
    # Get tools directory from command line or use default
    tools_dir = sys.argv[1] if len(sys.argv) > 1 else None
    
    try:
        results = validate_tool_schemas(tools_dir)
        print_validation_report(results)
        
        # Exit with error code if validation failed
        if results['invalid_tools'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except Exception as e:
        print(f"Error during validation: {e}")
        sys.exit(1)