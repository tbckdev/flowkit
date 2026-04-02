"""SDK OperationService — orchestration brain for media generation operations.

Wraps the business logic extracted from agent/worker/processor.py handler
functions into an SDK-friendly interface that works against domain models
instead of raw CRUD dicts.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

from agent.db import crud
from agent.worker.processor import _build_video_prompt
from agent.sdk.services.media_resolver import resolve_references

if TYPE_CHECKING:
    from agent.services.flow_client import FlowClient
    from agent.sdk.repository import Repository

logger = logging.getLogger(__name__)


class OperationService:
    """Orchestrates media generation operations using FlowClient + Repository.

    Each method mirrors a handler from processor.py but operates on SDK domain
    models and returns structured results rather than mutating raw dicts.
    """

    def __init__(self, flow_client: FlowClient, repo: Repository):
        self._client = flow_client
        self._repo = repo

    # ------------------------------------------------------------------
    # Scene image operations
    # ------------------------------------------------------------------

    async def generate_scene_image(
        self,
        scene_id: str,
        project_id: str,
        video_id: str,
        orientation: str = "VERTICAL",
    ) -> str:
        """Generate a scene image (GENERATE_IMAGES flow with reference imageInputs).

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="GENERATE_IMAGE",
            orientation=orientation,
            scene_id=scene_id,
            project_id=project_id,
            video_id=video_id,
        )
        return row["id"]

    async def edit_scene_image(
        self,
        scene_id: str,
        project_id: str,
        video_id: str,
        orientation: str = "VERTICAL",
        edit_prompt: Optional[str] = None,
        source_media_id: Optional[str] = None,
    ) -> str:
        """Edit an existing scene image (EDIT_IMAGE flow).

        The prompt comes from the scene's current prompt field (scene.effective_image_prompt())
        unless edit_prompt is explicitly provided. The user updates the scene prompt first,
        then calls edit.

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="EDIT_IMAGE",
            orientation=orientation,
            scene_id=scene_id,
            project_id=project_id,
            video_id=video_id,
            edit_prompt=edit_prompt,
            source_media_id=source_media_id,
        )
        return row["id"]

    async def generate_scene_video(
        self,
        scene_id: str,
        project_id: str,
        video_id: str,
        orientation: str = "VERTICAL",
    ) -> str:
        """Generate video from a scene image (GENERATE_VIDEO / i2v flow).

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="GENERATE_VIDEO",
            orientation=orientation,
            scene_id=scene_id,
            project_id=project_id,
            video_id=video_id,
        )
        return row["id"]

    async def generate_scene_video_refs(
        self,
        scene_id: str,
        project_id: str,
        video_id: str,
        orientation: str = "VERTICAL",
    ) -> str:
        """Generate video from character reference images (GENERATE_VIDEO_REFS / r2v flow).

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="GENERATE_VIDEO_REFS",
            orientation=orientation,
            scene_id=scene_id,
            project_id=project_id,
            video_id=video_id,
        )
        return row["id"]

    async def upscale_scene_video(
        self,
        scene_id: str,
        project_id: str,
        video_id: str,
        orientation: str = "VERTICAL",
    ) -> str:
        """Upscale a completed scene video to 4K (UPSCALE_VIDEO flow).

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="UPSCALE_VIDEO",
            orientation=orientation,
            scene_id=scene_id,
            project_id=project_id,
            video_id=video_id,
        )
        return row["id"]

    # ------------------------------------------------------------------
    # Reference image operations
    # ------------------------------------------------------------------

    async def generate_reference_image(
        self,
        character_id: str,
        project_id: str,
    ) -> str:
        """Generate a reference image for a character/entity (GENERATE_CHARACTER_IMAGE flow).

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="GENERATE_CHARACTER_IMAGE",
            character_id=character_id,
            project_id=project_id,
        )
        return row["id"]

    # Alias used by Character.generate_image()
    async def generate_character_image(
        self,
        character_id: str,
        project_id: str,
    ) -> str:
        return await self.generate_reference_image(character_id, project_id)

    async def edit_character_image(
        self,
        character_id: str,
        project_id: str,
        edit_prompt: Optional[str] = None,
        source_media_id: Optional[str] = None,
    ) -> str:
        """Edit a character reference image.

        Returns the created request id.
        """
        row = await crud.create_request(
            req_type="EDIT_CHARACTER_IMAGE",
            character_id=character_id,
            project_id=project_id,
            edit_prompt=edit_prompt,
            source_media_id=source_media_id,
        )
        return row["id"]

    # ------------------------------------------------------------------
    # Prompt building
    # ------------------------------------------------------------------

    async def _build_video_prompt(self, scene: dict, project_id: Optional[str]) -> str:
        """Enhance video prompt with character voice context and no-music instruction.

        Delegates to processor._build_video_prompt which reads voice_description
        from project characters and appends audio instructions.
        """
        base_prompt = scene.get("video_prompt") or scene.get("prompt", "")
        return await _build_video_prompt(base_prompt, scene, project_id)


# ------------------------------------------------------------------
# Module-level singleton
# ------------------------------------------------------------------

_ops: Optional[OperationService] = None


def init_operations(flow_client: FlowClient, repo: Repository) -> OperationService:
    """Initialize the module-level OperationService singleton."""
    global _ops
    _ops = OperationService(flow_client=flow_client, repo=repo)
    return _ops


def get_operations() -> OperationService:
    """Return the initialized OperationService singleton.

    Raises RuntimeError if init_operations() has not been called yet.
    """
    if _ops is None:
        raise RuntimeError(
            "OperationService not initialized — call init_operations(flow_client, repo) first"
        )
    return _ops
