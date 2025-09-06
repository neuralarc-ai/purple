from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from utils.files_utils import should_exclude_file, clean_path
from agentpress.thread_manager import ThreadManager
from utils.logger import logger
from utils.config import config
import os
import json
import asyncio
from typing import Optional
from services.llm import make_llm_api_call

class SandboxFilesTool(SandboxToolsBase):
    """Tool for executing file system operations in a Daytona sandbox. All operations are performed relative to the /workspace directory."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.SNIPPET_LINES = 4  # Number of context lines to show around edits
        self.workspace_path = "/workspace"  # Ensure we're always operating in /workspace

    def clean_path(self, path: str) -> str:
        """Clean and normalize a path to be relative to /workspace"""
        return clean_path(path, self.workspace_path)

    def _should_exclude_file(self, rel_path: str) -> bool:
        """Check if a file should be excluded based on path, name, or extension"""
        return should_exclude_file(rel_path)

    async def _file_exists(self, path: str) -> bool:
        """Check if a file exists in the sandbox"""
        try:
            await self.sandbox.fs.get_file_info(path)
            return True
        except Exception:
            return False

    async def get_workspace_state(self) -> dict:
        """Get the current workspace state by reading all files"""
        files_state = {}
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            files = await self.sandbox.fs.list_files(self.workspace_path)
            for file_info in files:
                rel_path = file_info.name
                
                # Skip excluded files and directories
                if self._should_exclude_file(rel_path) or file_info.is_dir:
                    continue

                try:
                    full_path = f"{self.workspace_path}/{rel_path}"
                    content = (await self.sandbox.fs.download_file(full_path)).decode()
                    files_state[rel_path] = {
                        "content": content,
                        "is_dir": file_info.is_dir,
                        "size": file_info.size,
                        "modified": file_info.mod_time
                    }
                except Exception as e:
                    print(f"Error reading file {rel_path}: {e}")
                except UnicodeDecodeError:
                    print(f"Skipping binary file: {rel_path}")

            return files_state
        
        except Exception as e:
            print(f"Error getting workspace state: {str(e)}")
            return {}


    # def _get_preview_url(self, file_path: str) -> Optional[str]:
    #     """Get the preview URL for a file if it's an HTML file."""
    #     if file_path.lower().endswith('.html') and self._sandbox_url:
    #         return f"{self._sandbox_url}/{(file_path.replace('/workspace/', ''))}"
    #     return None

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_file",
            "description": "Create a new file with the provided contents at a given path in the workspace. The path must be relative to /workspace (e.g., 'src/main.py' for /workspace/src/main.py)",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to be created, relative to /workspace (e.g., 'src/main.py')"
                    },
                    "file_contents": {
                        "type": "string",
                        "description": "The content to write to the file"
                    },
                    "permissions": {
                        "type": "string",
                        "description": "File permissions in octal format (e.g., '644')",
                        "default": "644"
                    }
                },
                "required": ["file_path", "file_contents"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="create_file">
        <parameter name="file_path">src/main.py</parameter>
        <parameter name="file_contents">
        # This is the file content
        def main():
            print("Hello, World!")
        
        if __name__ == "__main__":
            main()
        </parameter>
        </invoke>
        </function_calls>
        ''')
    async def create_file(self, file_path: str, file_contents: str, permissions: str = "644") -> ToolResult:
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            file_path = self.clean_path(file_path)
            full_path = f"{self.workspace_path}/{file_path}"
            if await self._file_exists(full_path):
                return self.fail_response(f"File '{file_path}' already exists. Use update_file to modify existing files.")
            
            # Create parent directories if needed
            parent_dir = '/'.join(full_path.split('/')[:-1])
            if parent_dir:
                await self.sandbox.fs.create_folder(parent_dir, "755")
            
            # convert to json string if file_contents is a dict
            if isinstance(file_contents, dict):
                file_contents = json.dumps(file_contents, indent=4)
            
            # Write the file content
            await self.sandbox.fs.upload_file(file_contents.encode(), full_path)
            await self.sandbox.fs.set_file_permissions(full_path, permissions)
            
            message = f"File '{file_path}' created successfully."
            
            # Check if index.html was created and add 8080 server info (only in root workspace)
            if file_path.lower() == 'index.html':
                try:
                    website_link = await self.sandbox.get_preview_link(8080)
                    website_url = website_link.url if hasattr(website_link, 'url') else str(website_link).split("url='")[1].split("'")[0]
                    message += f"\n\n[Auto-detected index.html - HTTP server available at: {website_url}]"
                    message += "\n[Note: Use the provided HTTP server URL above instead of starting a new server]"
                except Exception as e:
                    logger.warning(f"Failed to get website URL for index.html: {str(e)}")
            
            return self.success_response(message)
        except Exception as e:
            return self.fail_response(f"Error creating file: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "str_replace",
            "description": "Replace specific text in a file. The file path must be relative to /workspace (e.g., 'src/main.py' for /workspace/src/main.py). IMPORTANT: Prefer using edit_file for faster, shorter edits to avoid repetition. Only use this tool when you need to replace a unique string that appears exactly once in the file and edit_file is not suitable.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the target file, relative to /workspace (e.g., 'src/main.py')"
                    },
                    "old_str": {
                        "type": "string",
                        "description": "Text to be replaced (must appear exactly once)"
                    },
                    "new_str": {
                        "type": "string",
                        "description": "Replacement text"
                    }
                },
                "required": ["file_path", "old_str", "new_str"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="str_replace">
        <parameter name="file_path">src/main.py</parameter>
        <parameter name="old_str">text to replace (must appear exactly once in the file)</parameter>
        <parameter name="new_str">replacement text that will be inserted instead</parameter>
        </invoke>
        </function_calls>
        ''')
    async def str_replace(self, file_path: str, old_str: str, new_str: str) -> ToolResult:
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            file_path = self.clean_path(file_path)
            full_path = f"{self.workspace_path}/{file_path}"
            if not await self._file_exists(full_path):
                return self.fail_response(f"File '{file_path}' does not exist")
            
            content = (await self.sandbox.fs.download_file(full_path)).decode()
            old_str = old_str.expandtabs()
            new_str = new_str.expandtabs()
            
            occurrences = content.count(old_str)
            if occurrences == 0:
                return self.fail_response(f"String '{old_str}' not found in file")
            if occurrences > 1:
                lines = [i+1 for i, line in enumerate(content.split('\n')) if old_str in line]
                return self.fail_response(f"Multiple occurrences found in lines {lines}. Please ensure string is unique")
            
            # Perform replacement
            new_content = content.replace(old_str, new_str)
            await self.sandbox.fs.upload_file(new_content.encode(), full_path)
            
            # Show snippet around the edit
            replacement_line = content.split(old_str)[0].count('\n')
            start_line = max(0, replacement_line - self.SNIPPET_LINES)
            end_line = replacement_line + self.SNIPPET_LINES + new_str.count('\n')
            snippet = '\n'.join(new_content.split('\n')[start_line:end_line + 1])
            
            # Get preview URL if it's an HTML file
            # preview_url = self._get_preview_url(file_path)
            message = f"Replacement successful."
            # if preview_url:
            #     message += f"\n\nYou can preview this HTML file at: {preview_url}"
            
            return self.success_response(message)
            
        except Exception as e:
            return self.fail_response(f"Error replacing string: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "full_file_rewrite",
            "description": "Completely rewrite an existing file with new content. The file path must be relative to /workspace (e.g., 'src/main.py' for /workspace/src/main.py). IMPORTANT: Always prefer using edit_file for making changes to code. Only use this tool when edit_file fails or when you need to replace the entire file content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to be rewritten, relative to /workspace (e.g., 'src/main.py')"
                    },
                    "file_contents": {
                        "type": "string",
                        "description": "The new content to write to the file, replacing all existing content"
                    },
                    "permissions": {
                        "type": "string",
                        "description": "File permissions in octal format (e.g., '644')",
                        "default": "644"
                    }
                },
                "required": ["file_path", "file_contents"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="full_file_rewrite">
        <parameter name="file_path">src/main.py</parameter>
        <parameter name="file_contents">
        This completely replaces the entire file content.
        Use when making major changes to a file or when the changes
        are too extensive for str-replace.
        All previous content will be lost and replaced with this text.
        </parameter>
        </invoke>
        </function_calls>
        ''')
    async def full_file_rewrite(self, file_path: str, file_contents: str, permissions: str = "644") -> ToolResult:
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            file_path = self.clean_path(file_path)
            full_path = f"{self.workspace_path}/{file_path}"
            if not await self._file_exists(full_path):
                return self.fail_response(f"File '{file_path}' does not exist. Use create_file to create a new file.")
            
            await self.sandbox.fs.upload_file(file_contents.encode(), full_path)
            await self.sandbox.fs.set_file_permissions(full_path, permissions)
            
            message = f"File '{file_path}' completely rewritten successfully."
            
            # Check if index.html was rewritten and add 8080 server info (only in root workspace)
            if file_path.lower() == 'index.html':
                try:
                    website_link = await self.sandbox.get_preview_link(8080)
                    website_url = website_link.url if hasattr(website_link, 'url') else str(website_link).split("url='")[1].split("'")[0]
                    message += f"\n\n[Auto-detected index.html - HTTP server available at: {website_url}]"
                    message += "\n[Note: Use the provided HTTP server URL above instead of starting a new server]"
                except Exception as e:
                    logger.warning(f"Failed to get website URL for index.html: {str(e)}")
            
            return self.success_response(message)
        except Exception as e:
            return self.fail_response(f"Error rewriting file: {str(e)}")

    async def _call_gemini_api(self, file_content: str, code_edit: str, instructions: str, file_path: str) -> tuple[Optional[str], Optional[str]]:
        """
        Call Vertex AI Gemini 2.5 Pro via LiteLLM to apply edits to file content.
        Returns a tuple (new_content, error_message).
        On success, error_message is None. On failure, new_content is None.
        """
        try:
            model_name = "vertex_ai/gemini-2.5-pro"
            prompt = (
                f"<instruction>{instructions}</instruction>\n"
                f"<file_content>{file_content}</file_content>\n"
                f"<update>{code_edit}</update>\n\n"
                f"You are an expert file editor capable of handling multiple file types:\n"
                f"- Code files (Python, JavaScript, TypeScript, HTML, CSS, etc.)\n"
                f"- Data files (CSV, JSON, XML, YAML, etc.)\n"
                f"- Documents (Markdown, plain text, configuration files)\n"
                f"- Spreadsheets (CSV format, structured data)\n"
                f"- Configuration files (config, env, ini, etc.)\n\n"
                f"Apply the changes specified in the <update> section to the content in the <file_content> section. "
                f"For code files: maintain proper syntax, indentation, and formatting. "
                f"For data files: preserve structure and data integrity. "
                f"For documents: maintain readability and formatting. "
                f"For CSV/structured data: ensure proper delimiters and headers.\n\n"
                f"CRITICAL: Return ONLY the raw file content without any XML tags, CDATA wrappers, markdown code blocks, or explanations. "
                f"Do NOT wrap your response in <![CDATA[...]]>, ```code```, or any other formatting tags. "
                f"Do not include the instruction text in your response. "
                f"Preserve the original file's encoding and line endings where applicable. "
                f"The output should be the exact content that should be written to the file."
            )
            messages = [{"role": "user", "content": prompt}]

            logger.debug("Using Claude Sonnet 4 from Bedrock via LiteLLM for file editing.")
            response = await make_llm_api_call(
                messages=messages,
                model_name=model_name,
                temperature=0.0,
                max_tokens=None,
                response_format=None,
                tools=None,
                tool_choice="none",
                api_key=None,
                api_base=None,
                stream=False,
                top_p=None,
                model_id=None,
                enable_thinking=False,
                reasoning_effort='low'
            )

            # LiteLLM ModelResponse: extract message content
            content = None
            try:
                if hasattr(response, 'choices') and response.choices:
                    content = response.choices[0].message.content
                elif isinstance(response, dict):
                    content = response.get('choices', [{}])[0].get('message', {}).get('content')
            except Exception:
                content = None

            if not content:
                return None, f"Invalid response from Claude Sonnet 4 API: {response}"

            # Clean up the response content
            content_str = content.strip() if isinstance(content, str) else str(content).strip()
            
            # Remove CDATA wrappers if present
            if content_str.startswith("<![CDATA[") and content_str.endswith("]]>"):
                content_str = content_str[9:-3].strip()
            
            # Remove markdown code blocks if present
            if content_str.startswith("```") and content_str.endswith("```"):
                lines = content_str.split('\n')
                if len(lines) > 2:
                    content_str = '\n'.join(lines[1:-1])
            
            # Remove any remaining XML-like tags that might wrap the content
            if content_str.startswith("<") and ">" in content_str:
                # Find the first > and last < to extract content between tags
                first_close = content_str.find(">")
                last_open = content_str.rfind("<")
                if first_close != -1 and last_open != -1 and first_close < last_open:
                    content_str = content_str[first_close + 1:last_open].strip()

            return content_str, None
        except Exception as e:
            error_message = f"AI model call for file edit failed. Exception: {str(e)}"
            logger.error(f"Error calling Claude Sonnet 4: {error_message}", exc_info=True)
            return None, error_message

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Use this tool to make an edit to an existing file.\n\nThis will be read by a less intelligent model, which will quickly apply the edit. You should make it clear what the edit is, while also minimizing the unchanged code you write.\nWhen writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines.\n\nFor example:\n\n// ... existing code ...\nFIRST_EDIT\n// ... existing code ...\nSECOND_EDIT\n// ... existing code ...\nTHIRD_EDIT\n// ... existing code ...\n\nYou should still bias towards repeating as few lines of the original file as possible to convey the change.\nBut, each edit should contain sufficient context of unchanged code around the code you're editing to resolve ambiguity.\nDO NOT omit spans of pre-existing code (or comments) without using the // ... existing code ... comment to indicate its absence. If you omit the existing code comment, the model may inadvertently delete these lines.\nIf you plan on deleting a section, you must provide context before and after to delete it. If the initial code is ```code \\n Block 1 \\n Block 2 \\n Block 3 \\n code```, and you want to remove Block 2, you would output ```// ... existing code ... \\n Block 1 \\n  Block 3 \\n // ... existing code ...```.\nMake sure it is clear what the edit should be, and where it should be applied.\nALWAYS make all edits to a file in a single edit_file instead of multiple edit_file calls to the same file. The apply model can handle many distinct edits at once.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_file": {
                        "type": "string",
                        "description": "The target file to modify"
                    },
                    "instructions": {
                        "type": "string", 
                        "description": "A single sentence written in the first person describing what you're changing. Used to help disambiguate uncertainty in the edit."
                    },
                    "code_edit": {
                        "type": "string",
                        "description": "Specify ONLY the precise lines of code that you wish to edit. Use // ... existing code ... for unchanged sections."
                    }
                },
                "required": ["target_file", "instructions", "code_edit"]
            }
        }
    })
    @usage_example('''
        <!-- Example: Update CSV data with new records -->
        <function_calls>
        <invoke name="edit_file">
        <parameter name="target_file">data/customers.csv</parameter>
        <parameter name="instructions">I am adding new customer records to the CSV file</parameter>
        <parameter name="code_edit">
// ... existing code ...
John,Doe,john.doe@email.com,555-0123,New York
Jane,Smith,jane.smith@email.com,555-0124,Los Angeles
Bob,Johnson,bob.johnson@email.com,555-0125,Chicago
// ... existing code ...
        </parameter>
        </invoke>
        </function_calls>

        <!-- Example: Update configuration file with new settings -->
        <function_calls>
        <invoke name="edit_file">
        <parameter name="target_file">config/settings.env</parameter>
        <parameter name="instructions">I am adding new environment variables for database and API configuration</parameter>
        <parameter name="code_edit">
// ... existing code ...
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
API_KEY=sk-1234567890abcdef
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
// ... existing code ...
        </parameter>
        </invoke>
        </function_calls>

        <!-- Example: Update JSON configuration -->
        <function_calls>
        <invoke name="edit_file">
        <parameter name="target_file">package.json</parameter>
        <parameter name="instructions">I am adding new dependencies and updating the scripts section</parameter>
        <parameter name="code_edit">
// ... existing code ...
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "lodash": "^4.17.21"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "lint": "eslint src/"
  }
// ... existing code ...
        </parameter>
        </invoke>
        </function_calls>

        <!-- Example: Update Markdown documentation -->
        <function_calls>
        <invoke name="edit_file">
        <parameter name="target_file">README.md</parameter>
        <parameter name="instructions">I am adding installation instructions and usage examples to the README</parameter>
        <parameter name="code_edit">
// ... existing code ...
## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the application: `npm start`

## Usage

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## Features

- User authentication
- Real-time updates
- Responsive design
// ... existing code ...
        </parameter>
        </invoke>
        </function_calls>
        ''')
    async def edit_file(self, target_file: str, instructions: str, code_edit: str) -> ToolResult:
        """Edit a file using AI-powered intelligent editing with Claude Sonnet 4 from Bedrock"""
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            target_file = self.clean_path(target_file)
            full_path = f"{self.workspace_path}/{target_file}"
            if not await self._file_exists(full_path):
                return self.fail_response(f"File '{target_file}' does not exist")
            
            # Read current content
            original_content = (await self.sandbox.fs.download_file(full_path)).decode()
            
            # Try Vertex AI Gemini 2.5 Pro editing
            logger.debug(f"Attempting AI-powered edit for file '{target_file}' with instructions: {instructions[:100]}...")
            new_content, error_message = await self._call_gemini_api(original_content, code_edit, instructions, target_file)

            if error_message:
                return ToolResult(success=False, output=json.dumps({
                    "message": f"Vertex AI Gemini 2.5 Pro editing failed: {error_message}",
                    "file_path": target_file,
                    "original_content": original_content,
                    "updated_content": None
                }))

            if new_content is None:
                return ToolResult(success=False, output=json.dumps({
                    "message": "AI editing failed for an unknown reason. The model returned no content.",
                    "file_path": target_file,
                    "original_content": original_content,
                    "updated_content": None
                }))

            if new_content == original_content:
                return ToolResult(success=True, output=json.dumps({
                    "message": f"AI editing resulted in no changes to the file '{target_file}'.",
                    "file_path": target_file,
                    "original_content": original_content,
                    "updated_content": original_content
                }))

            # AI editing successful
            await self.sandbox.fs.upload_file(new_content.encode(), full_path)
            
            # Return rich data for frontend diff view
            return ToolResult(success=True, output=json.dumps({
                "message": f"File '{target_file}' edited successfully.",
                "file_path": target_file,
                "original_content": original_content,
                "updated_content": new_content
            }))
                    
        except Exception as e:
            logger.error(f"Unhandled error in edit_file: {str(e)}", exc_info=True)
            # Try to get original_content if possible
            original_content_on_error = None
            try:
                full_path_on_error = f"{self.workspace_path}/{self.clean_path(target_file)}"
                if await self._file_exists(full_path_on_error):
                    original_content_on_error = (await self.sandbox.fs.download_file(full_path_on_error)).decode()
            except:
                pass
            
            return ToolResult(success=False, output=json.dumps({
                "message": f"Error editing file: {str(e)}",
                "file_path": target_file,
                "original_content": original_content_on_error,
                "updated_content": None
            }))

    # @openapi_schema({
    #     "type": "function",
    #     "function": {
    #         "name": "read_file",
    #         "description": "Read and return the contents of a file. This tool is essential for verifying data, checking file contents, and analyzing information. Always use this tool to read file contents before processing or analyzing data. The file path must be relative to /workspace.",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {
    #                 "file_path": {
    #                     "type": "string",
    #                     "description": "Path to the file to read, relative to /workspace (e.g., 'src/main.py' for /workspace/src/main.py). Must be a valid file path within the workspace."
    #                 },
    #                 "start_line": {
    #                     "type": "integer",
    #                     "description": "Optional starting line number (1-based). Use this to read specific sections of large files. If not specified, reads from the beginning of the file.",
    #                     "default": 1
    #                 },
    #                 "end_line": {
    #                     "type": "integer",
    #                     "description": "Optional ending line number (inclusive). Use this to read specific sections of large files. If not specified, reads to the end of the file.",
    #                     "default": None
    #                 }
    #             },
    #             "required": ["file_path"]
    #         }
    #     }
    # })
    # @xml_schema(
    #     tag_name="read-file",
    #     mappings=[
    #         {"param_name": "file_path", "node_type": "attribute", "path": "."},
    #         {"param_name": "start_line", "node_type": "attribute", "path": ".", "required": False},
    #         {"param_name": "end_line", "node_type": "attribute", "path": ".", "required": False}
    #     ],
    #     example='''
    #     <!-- Example 1: Read entire file -->
    #     <read-file file_path="src/main.py">
    #     </read-file>

    #     <!-- Example 2: Read specific lines (lines 10-20) -->
    #     <read-file file_path="src/main.py" start_line="10" end_line="20">
    #     </read-file>

    #     <!-- Example 3: Read from line 5 to end -->
    #     <read-file file_path="config.json" start_line="5">
    #     </read-file>

    #     <!-- Example 4: Read last 10 lines -->
    #     <read-file file_path="logs/app.log" start_line="-10">
    #     </read-file>
    #     '''
    # )
    # async def read_file(self, file_path: str, start_line: int = 1, end_line: Optional[int] = None) -> ToolResult:
    #     """Read file content with optional line range specification.
        
    #     Args:
    #         file_path: Path to the file relative to /workspace
    #         start_line: Starting line number (1-based), defaults to 1
    #         end_line: Ending line number (inclusive), defaults to None (end of file)
            
    #     Returns:
    #         ToolResult containing:
    #         - Success: File content and metadata
    #         - Failure: Error message if file doesn't exist or is binary
    #     """
    #     try:
    #         file_path = self.clean_path(file_path)
    #         full_path = f"{self.workspace_path}/{file_path}"
            
    #         if not await self._file_exists(full_path):
    #             return self.fail_response(f"File '{file_path}' does not exist")
            
    #         # Download and decode file content
    #         content = await self.sandbox.fs.download_file(full_path).decode()
            
    #         # Split content into lines
    #         lines = content.split('\n')
    #         total_lines = len(lines)
            
    #         # Handle line range if specified
    #         if start_line > 1 or end_line is not None:
    #             # Convert to 0-based indices
    #             start_idx = max(0, start_line - 1)
    #             end_idx = end_line if end_line is not None else total_lines
    #             end_idx = min(end_idx, total_lines)  # Ensure we don't exceed file length
                
    #             # Extract the requested lines
    #             content = '\n'.join(lines[start_idx:end_idx])
            
    #         return self.success_response({
    #             "content": content,
    #             "file_path": file_path,
    #             "start_line": start_line,
    #             "end_line": end_line if end_line is not None else total_lines,
    #             "total_lines": total_lines
    #         })
            
    #     except UnicodeDecodeError:
    #         return self.fail_response(f"File '{file_path}' appears to be binary and cannot be read as text")
    #     except Exception as e:
    #         return self.fail_response(f"Error reading file: {str(e)}")