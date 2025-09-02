from typing import Optional
from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
import httpx
from io import BytesIO
import uuid
from litellm import aimage_generation, aimage_edit
import base64


class SandboxImageEditTool(SandboxToolsBase):
    """Tool for generating or editing images via LiteLLM image endpoints (no mask support).

    Notes:
    - Uses LiteLLM `aimage_generation` and `aimage_edit` which proxy to the configured provider.
    - Response formats vary by provider; parsing is hardened to support common shapes.
    - Default model targets Vertex AI Gemini 2.5 Flash Image Preview.
    """

    def __init__(self, project_id: str, thread_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.thread_id = thread_id
        self.thread_manager = thread_manager

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "image_edit_or_generate",
                "description": "Generate a new image from a prompt, or edit an existing image (no mask support) using LiteLLM image API (e.g., Vertex AI Gemini image preview). Stores the result in the thread context.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mode": {
                            "type": "string",
                            "enum": ["generate", "edit"],
                            "description": "'generate' to create a new image from a prompt, 'edit' to edit an existing image.",
                        },
                        "prompt": {
                            "type": "string",
                            "description": "Text prompt describing the desired image or edit.",
                        },
                        "image_path": {
                            "type": "string",
                            "description": "(edit mode only) Path to the image file to edit. Can be: 1) Relative path to /workspace (e.g., 'generated_image_abc123.png'), or 2) Full URL (e.g., 'https://example.com/image.png'). Required when mode='edit'.",
                        },
                    },
                    "required": ["mode", "prompt"],
                },
            },
        }
    )
    @usage_example("""
        Generate mode example (new image):
        <function_calls>
        <invoke name="image_edit_or_generate">
        <parameter name="mode">generate</parameter>
        <parameter name="prompt">A futuristic cityscape at sunset</parameter>
        </invoke>
        </function_calls>
        
        Edit mode example (modifying existing):
        <function_calls>
        <invoke name="image_edit_or_generate">
        <parameter name="mode">edit</parameter>
        <parameter name="prompt">Add a red hat to the person in the image</parameter>
        <parameter name="image_path">generated_image_abc123.png</parameter>
        </invoke>
        </function_calls>
        
        Multi-turn workflow (follow-up edits):
        1. User: "Create a logo" → generate mode
        2. User: "Make it more colorful" → edit mode (automatic)
        3. User: "Add text to it" → edit mode (automatic)
        """)
    async def image_edit_or_generate(
        self,
        mode: str,
        prompt: str,
        image_path: Optional[str] = None,
    ) -> ToolResult:
        """Generate or edit images via LiteLLM image API (no mask support)."""
        try:
            await self._ensure_sandbox()

            if mode == "generate":
                response = await aimage_generation(
                    model="vertex_ai/imagen-4.0-generate-001",
                    prompt=prompt,
                    n=1,
                    size="1024x1024",
                )
            elif mode == "edit":
                if not image_path:
                    return self.fail_response("'image_path' is required for edit mode.")

                image_bytes = await self._get_image_bytes(image_path)
                if isinstance(image_bytes, ToolResult):  # Error occurred
                    return image_bytes

                # Create BytesIO object with proper filename to set MIME type
                image_io = BytesIO(image_bytes)
                image_io.name = (
                    "image.png"  # Set filename to ensure proper MIME type detection
                )

                response = await aimage_edit(
                    image=[image_io],  # Type in the LiteLLM SDK expects list-like for some providers
                    prompt=prompt,
                    model="vertex_ai/imagen-4.0-generate-001",
                    n=1,
                    size="1024x1024",
                )
            else:
                return self.fail_response("Invalid mode. Use 'generate' or 'edit'.")

            # Download and save the generated image to sandbox
            image_filename = await self._process_image_response(response)
            if isinstance(image_filename, ToolResult):  # Error occurred
                return image_filename

            return self.success_response(
                f"Successfully generated image using mode '{mode}'. Image saved as: {image_filename}. You can use the ask tool to display the image."
            )

        except Exception as e:
            return self.fail_response(
                f"An error occurred during image generation/editing: {str(e)}"
            )

    async def _get_image_bytes(self, image_path: str) -> bytes | ToolResult:
        """Get image bytes from URL or local file path."""
        if image_path.startswith(("http://", "https://")):
            return await self._download_image_from_url(image_path)
        else:
            return await self._read_image_from_sandbox(image_path)

    async def _download_image_from_url(self, url: str) -> bytes | ToolResult:
        """Download image from URL."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
        except Exception:
            return self.fail_response(f"Could not download image from URL: {url}")

    async def _read_image_from_sandbox(self, image_path: str) -> bytes | ToolResult:
        """Read image from sandbox filesystem."""
        try:
            cleaned_path = self.clean_path(image_path)
            full_path = f"{self.workspace_path}/{cleaned_path}"

            # Check if file exists and is not a directory
            file_info = await self.sandbox.fs.get_file_info(full_path)
            if file_info.is_dir:
                return self.fail_response(
                    f"Path '{cleaned_path}' is a directory, not an image file."
                )

            return await self.sandbox.fs.download_file(full_path)

        except Exception as e:
            return self.fail_response(
                f"Could not read image file from sandbox: {image_path} - {str(e)}"
            )

    def _extract_b64_image(self, response) -> Optional[str]:
        """Extract a base64-encoded image string from various provider response shapes."""
        # Handle object with attributes (e.g., pydantic-like)
        try:
            if hasattr(response, "data") and response.data:
                first = response.data[0]
                if hasattr(first, "b64_json") and first.b64_json:
                    return first.b64_json
                if hasattr(first, "image_base64") and first.image_base64:
                    return first.image_base64
        except Exception:
            pass

        # Handle dict-like responses
        try:
            if isinstance(response, dict):
                # OpenAI-like
                data = response.get("data")
                if isinstance(data, list) and data:
                    item = data[0]
                    if isinstance(item, dict):
                        if item.get("b64_json"):
                            return item["b64_json"]
                        if item.get("image_base64"):
                            return item["image_base64"]
                # Some providers put it at top-level
                if response.get("b64_json"):
                    return response["b64_json"]
                if response.get("image_base64"):
                    return response["image_base64"]
        except Exception:
            pass

        return None

    async def _process_image_response(self, response) -> str | ToolResult:
        """Download generated image and save to sandbox with random name."""
        try:
            original_b64_str = self._extract_b64_image(response)
            if not original_b64_str:
                return self.fail_response(
                    "Provider did not return image bytes in a recognized format."
                )

            # Decode base64 image data
            image_data = base64.b64decode(original_b64_str)

            # Generate random filename
            random_filename = f"generated_image_{uuid.uuid4().hex[:8]}.png"
            sandbox_path = f"{self.workspace_path}/{random_filename}"

            # Save image to sandbox
            await self.sandbox.fs.upload_file(image_data, sandbox_path)
            return random_filename

        except Exception as e:
            return self.fail_response(f"Failed to download and save image: {str(e)}")
