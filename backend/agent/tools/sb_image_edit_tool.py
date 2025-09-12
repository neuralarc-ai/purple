from typing import Optional
from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
import httpx
from io import BytesIO
import uuid
from utils.config import config
from PIL import Image
from google import genai


class SandboxImageEditTool(SandboxToolsBase):
    """Tool for generating or editing images via Google Gemini API (no mask support).

    Notes:
    - Uses direct `google-genai` client with `GEMINI_API_KEY`.
    - Default model targets Gemini 2.5 Flash Image Preview.
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
                "description": "Generate a new image from a prompt, or edit an existing image (no mask support) using the Google Gemini API with GEMINI_API_KEY. Stores the result in the thread context.",
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
        Generate mode example (new image via Gemini):
        <function_calls>
        <invoke name="image_edit_or_generate">
        <parameter name="mode">generate</parameter>
        <parameter name="prompt">A futuristic cityscape at sunset</parameter>
        </invoke>
        </function_calls>
        
        Edit mode example (modifying existing via Gemini):
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
        """Generate or edit images via direct Google Gemini API (no mask support)."""
        try:
            await self._ensure_sandbox()

            # Use direct Google Gemini API via google-genai
            if not config.GEMINI_API_KEY:
                return self.fail_response("GEMINI_API_KEY is not configured.")

            client = genai.Client(api_key=config.GEMINI_API_KEY)

            if mode == "generate":
                response = client.models.generate_content(
                    model="gemini-2.5-flash-image-preview",
                    contents=[prompt],
                )
            elif mode == "edit":
                if not image_path:
                    return self.fail_response("'image_path' is required for edit mode.")
                image_bytes = await self._get_image_bytes(image_path)
                if isinstance(image_bytes, ToolResult):
                    return image_bytes
                pil_image = Image.open(BytesIO(image_bytes))
                response = client.models.generate_content(
                    model="gemini-2.5-flash-image-preview",
                    contents=[prompt, pil_image],
                )
            else:
                return self.fail_response("Invalid mode. Use 'generate' or 'edit'.")

            image_filename = await self._process_gemini_response(response)
            if isinstance(image_filename, ToolResult):  # Error occurred
                return image_filename

            return self.success_response(
                f"Successfully generated image using Gemini API and mode '{mode}'. Image saved as: {image_filename}. You can use the ask tool to display the image."
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

    

    async def _process_gemini_response(self, response) -> str | ToolResult:
        """Process Google Gemini response: save first inline_data image to sandbox."""
        try:
            # Find first image part
            parts = []
            try:
                parts = response.candidates[0].content.parts or []
            except Exception:
                parts = []

            image_bytes: Optional[bytes] = None
            for part in parts:
                # Prefer image parts
                inline_data = getattr(part, "inline_data", None)
                if inline_data is not None and getattr(inline_data, "data", None) is not None:
                    image_bytes = inline_data.data
                    break

            if not image_bytes:
                return self.fail_response("Gemini response did not include image data.")

            random_filename = f"generated_image_{uuid.uuid4().hex[:8]}.png"
            sandbox_path = f"{self.workspace_path}/{random_filename}"
            await self.sandbox.fs.upload_file(image_bytes, sandbox_path)
            return random_filename

        except Exception as e:
            return self.fail_response(f"Failed to process Gemini response: {str(e)}")
