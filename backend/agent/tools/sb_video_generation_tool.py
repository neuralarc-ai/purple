from typing import Optional, Union
from agentpress.tool import ToolResult, openapi_schema, usage_example
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
import httpx
from io import BytesIO
import uuid
import time
from utils.config import config
from PIL import Image
from utils.logger import logger
import asyncio
import base64
import json
from typing import Any, Dict
import mimetypes
try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleAuthRequest
except Exception:
    service_account = None


class SandboxVideoGenerationTool(SandboxToolsBase):
    """Tool for generating videos using Google Veo (Vertex AI) video generation API.

    Notes:
    - Uses Vertex AI REST API with service account credentials.
    - Supports text-to-video and image-to-video generation.
    - Generates 8-second videos with audio at 720p or 1080p resolution.
    """

    def __init__(self, project_id: str, thread_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.thread_id = thread_id
        self.thread_manager = thread_manager

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "generate_video",
                "description": "Generate a video using Google Veo 3 model via Gemini API. Supports text-to-video and image-to-video generation with audio.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Text description for the video. Supports audio cues like dialogue, sound effects, and ambient noise.",
                        },
                        "reference_image": {
                            "type": "string",
                            "description": "(Optional) Path to an image file to use as the starting frame for video generation. Can be: 1) Relative path to /workspace (e.g., 'generated_image_abc123.png'), or 2) Full URL (e.g., 'https://example.com/image.png').",
                        },
                        "style_image": {
                            "type": "string",
                            "description": "(Optional) Path to an image file to use as style reference for video generation. Can be: 1) Relative path to /workspace, or 2) Full URL. This will influence the visual style of the generated video.",
                        },
                        "negative_prompt": {
                            "type": "string",
                            "description": "(Optional) Text describing what not to include in the video.",
                        },
                        "aspect_ratio": {
                            "type": "string",
                            "enum": ["16:9", "9:16"],
                            "description": "The video's aspect ratio. Default is '16:9'.",
                            "default": "16:9",
                        },
                        "resolution": {
                            "type": "string",
                            "enum": ["720p", "1080p"],
                            "description": "The video's resolution. '1080p' is only available for 16:9 aspect ratio. Default is '720p'.",
                            "default": "1080p",
                        },
                        "person_generation": {
                            "type": "string",
                            "enum": ["allow_all", "allow_adult", "dont_allow"],
                            "description": "Controls the generation of people. Default is 'allow_all'.",
                            "default": "allow_all",
                        },
                    },
                    "required": ["prompt"],
                },
            },
        }
    )
    @usage_example("""
        Character-driven narrative example:
        <function_calls>
        <invoke name="generate_video">
        <parameter name="prompt">A medium shot frames an old sailor, his knitted blue sailor hat casting a shadow over his eyes, a thick grey beard obscuring his chin. He holds his pipe in one hand, gesturing with it towards the churning, grey sea beyond the ship's railing. "This ocean, it's a force, a wild, untamed might. And she commands your awe, with every breaking light." Wind howling through rigging, waves crashing against hull.</parameter>
        <parameter name="aspect_ratio">16:9</parameter>
        <parameter name="resolution">1080p</parameter>
        </invoke>
        </function_calls>
        
        World-building with atmosphere example:
        <function_calls>
        <invoke name="generate_video">
        <parameter name="prompt">The bunny runs away with the chocolate bar</parameter>
        <parameter name="reference_image">bunny_image.png</parameter>
        <parameter name="aspect_ratio">16:9</parameter>
        </invoke>
        </function_calls>
        
        Style transfer example:
        <function_calls>
        <invoke name="generate_video">
        <parameter name="prompt">A cat playing in a garden</parameter>
        <parameter name="reference_image">cat_photo.jpg</parameter>
        <parameter name="style_image">van_gogh_style.png</parameter>
        <parameter name="aspect_ratio">16:9</parameter>
        </invoke>
        </function_calls>
        
        Video with dialogue example:
        <function_calls>
        <invoke name="generate_video">
        <parameter name="prompt">A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. "This must be it. That's the secret code." The woman looks at him and whispering excitedly, "What did you find?"</parameter>
        <parameter name="negative_prompt">cartoon, drawing, low quality</parameter>
        </invoke>
        </function_calls>
        """)
    async def generate_video(
        self,
        prompt: str,
        reference_image: Optional[str] = None,
        style_image: Optional[str] = None,
        image_path: Optional[str] = None,  # Backward compatibility
        negative_prompt: Optional[str] = None,
        aspect_ratio: str = "16:9",
        resolution: str = "720p",
        person_generation: str = "allow_all",
    ) -> ToolResult:
        """Generate a video using Google Veo 3 model via Gemini API."""
        try:
            await self._ensure_sandbox()

            # Vertex AI REST for Veo (required)
            project_id = (
                getattr(config, "VERTEXAI_PROJECT", None)
                or getattr(config, "GOOGLE_CLOUD_PROJECT_ID", None)
            )
            vertex_location = (
                getattr(config, "VERTEXAI_LOCATION", None)
                or getattr(config, "GOOGLE_CLOUD_LOCATION", None)
                or "us-central1"
            )
            if (
                project_id
                and (getattr(config, "GOOGLE_APPLICATION_CREDENTIALS", None) or getattr(config, "VERTEXAI_CREDENTIALS", None))
                and service_account is not None
            ):
                model_id = getattr(config, "VEO_MODEL_DEFAULT", None) or "veo-3.0-generate-001"

                # Obtain access token from service account credentials
                try:
                    if getattr(config, "GOOGLE_APPLICATION_CREDENTIALS", None):
                        creds = service_account.Credentials.from_service_account_file(
                            config.GOOGLE_APPLICATION_CREDENTIALS,
                            scopes=["https://www.googleapis.com/auth/cloud-platform"],
                        )
                    else:
                        creds = service_account.Credentials.from_service_account_info(
                            json.loads(config.VERTEXAI_CREDENTIALS),
                            scopes=["https://www.googleapis.com/auth/cloud-platform"],
                        )
                    creds.refresh(GoogleAuthRequest())
                    access_token = creds.token
                except Exception as auth_err:
                    return self.fail_response(f"Failed to obtain Vertex AI access token: {str(auth_err)}")

                # Build request body per Vertex Veo API
                instances: Dict[str, Any] = {"prompt": prompt}
                
                # Process reference image if provided (support both new and old parameter names)
                image_to_process = reference_image or image_path
                if image_to_process:
                    image_result = await self._process_image(image_to_process, "reference")
                    if isinstance(image_result, ToolResult):
                        return image_result
                    instances["image"] = image_result
                
                # Process style image if provided (Note: Veo API may not support multiple images in one request)
                # For now, we'll log a warning if both are provided
                if style_image:
                    logger.warning("Style image provided but Veo API may not support multiple images in single request")
                    # TODO: Implement style image support when Veo API supports it

                parameters: Dict[str, Any] = {
                    "aspectRatio": aspect_ratio,
                    "generateAudio": True,
                    "durationSeconds": 8,
                }
                if negative_prompt:
                    parameters["negativePrompt"] = negative_prompt
                if person_generation:
                    parameters["personGeneration"] = person_generation
                if resolution:
                    parameters["resolution"] = resolution

                url = (
                    f"https://{vertex_location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/"
                    f"{vertex_location}/publishers/google/models/{model_id}:predictLongRunning"
                )
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }

                async with httpx.AsyncClient(timeout=600) as http:
                    start_resp = await http.post(
                        url,
                        headers=headers,
                        json={"instances": [instances], "parameters": parameters},
                    )
                    start_resp.raise_for_status()
                    op_name = start_resp.json().get("name")
                    if not op_name:
                        return self.fail_response("Vertex AI did not return an operation name.")

                    poll_url = (
                        f"https://{vertex_location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/"
                        f"{vertex_location}/publishers/google/models/{model_id}:fetchPredictOperation"
                    )
                    poll_count = 0
                    poll_seconds = getattr(config, "VEO_POLL_SECONDS", 10) or 10
                    max_polls = getattr(config, "VEO_MAX_POLLS", 60) or 60
                    while True:
                        poll_count += 1
                        if poll_count > max_polls:
                            return self.fail_response("Video generation timed out after polling Vertex AI.")
                        await asyncio.sleep(poll_seconds)
                        poll_resp = await http.post(
                            poll_url,
                            headers=headers,
                            json={"operationName": op_name},
                        )
                        poll_resp.raise_for_status()
                        body = poll_resp.json()
                        if body.get("done"):
                            response = body.get("response", {})
                            videos = response.get("videos", [])
                            if not videos:
                                return self.fail_response("Vertex AI completed but returned no videos.")
                            first = videos[0]
                            b64 = first.get("bytesBase64Encoded")
                            if not b64:
                                gcs_uri = first.get("gcsUri")
                                return self.success_response(
                                    f"Video generated and stored at {gcs_uri}. Provide GCS access or set storageUri to store outputs."
                                )
                            video_bytes = base64.b64decode(b64)
                            video_filename = f"generated_video_{uuid.uuid4().hex[:8]}.mp4"
                            sandbox_path = f"{self.workspace_path}/{video_filename}"
                            await self.sandbox.fs.upload_file(video_bytes, sandbox_path)
                            return self.success_response(
                                f"Successfully generated video using Veo (Vertex AI). Video saved as: {video_filename}. "
                                f"The video is 8 seconds long with audio at {resolution} in {aspect_ratio}."
                            )

            # If Vertex is not configured properly, return a clear error
            return self.fail_response(
                "Vertex AI is not configured. Set either (VERTEXAI_PROJECT or GOOGLE_CLOUD_PROJECT_ID) and GOOGLE_APPLICATION_CREDENTIALS or VERTEXAI_CREDENTIALS to use Veo."
            )

        except Exception as e:
            logger.error(f"Video generation failed: {e}", exc_info=True)
            return self.fail_response(
                f"An error occurred during video generation: {str(e)}"
            )

    async def _process_image(self, image_path: str, image_type: str) -> Dict[str, str] | ToolResult:
        """Process and validate an image for Veo API."""
        try:
            # Get image bytes
            image_bytes = await self._get_image_bytes(image_path)
            if isinstance(image_bytes, ToolResult):
                return image_bytes
            
            # Validate and process the image
            return await self._validate_and_encode_image(image_bytes, image_type)
            
        except Exception as e:
            logger.error(f"Error processing {image_type} image: {e}", exc_info=True)
            return self.fail_response(f"Failed to process {image_type} image: {str(e)}")

    async def _get_image_bytes(self, image_path: str) -> bytes | ToolResult:
        """Get image bytes from URL or local file path."""
        if image_path.startswith(("http://", "https://")):
            return await self._download_image_from_url(image_path)
        else:
            return await self._read_image_from_sandbox(image_path)

    async def _download_image_from_url(self, url: str) -> bytes | ToolResult:
        """Download image from URL."""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                if not content_type.startswith('image/'):
                    return self.fail_response(f"URL does not point to an image. Content type: {content_type}")
                
                return response.content
        except httpx.TimeoutException:
            return self.fail_response(f"Timeout downloading image from URL: {url}")
        except httpx.HTTPStatusError as e:
            return self.fail_response(f"HTTP error downloading image from URL: {url} - {e.response.status_code}")
        except Exception as e:
            return self.fail_response(f"Could not download image from URL: {url} - {str(e)}")

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

    async def _validate_and_encode_image(self, image_bytes: bytes, image_type: str) -> Dict[str, str] | ToolResult:
        """Validate image format and encode for Veo API."""
        try:
            # Open image with PIL to validate format
            image = Image.open(BytesIO(image_bytes))
            
            # Check image format
            if image.format not in ['JPEG', 'PNG', 'WEBP']:
                return self.fail_response(
                    f"Unsupported image format: {image.format}. Supported formats: JPEG, PNG, WEBP"
                )
            
            # Check image dimensions
            width, height = image.size
            if width < 64 or height < 64:
                return self.fail_response(
                    f"Image too small: {width}x{height}. Minimum size: 64x64 pixels"
                )
            
            if width > 4096 or height > 4096:
                return self.fail_response(
                    f"Image too large: {width}x{height}. Maximum size: 4096x4096 pixels"
                )
            
            # Check file size (10MB limit)
            if len(image_bytes) > 10 * 1024 * 1024:
                return self.fail_response(
                    f"Image too large: {len(image_bytes)} bytes. Maximum size: 10MB"
                )
            
            # Determine MIME type
            mime_type = f"image/{image.format.lower()}"
            if image.format == 'JPEG':
                mime_type = "image/jpeg"
            
            logger.info(f"Successfully validated {image_type} image: {width}x{height}, format: {image.format}, size: {len(image_bytes)} bytes")
            
            return {
                "bytesBase64Encoded": base64.b64encode(image_bytes).decode("utf-8"),
                "mimeType": mime_type,
            }
            
        except Exception as e:
            logger.error(f"Error validating {image_type} image: {e}", exc_info=True)
            return self.fail_response(f"Invalid image format for {image_type} image: {str(e)}")
