"""SDK Scene domain model."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from agent.sdk.models.base import DomainModel
from agent.sdk.models.media import MediaAsset, OrientationSlot


def _slot_from_row(row: dict[str, Any], prefix: str) -> OrientationSlot:
    """Build an OrientationSlot from a flat DB row using *prefix* (vertical/horizontal)."""
    return OrientationSlot(
        image=MediaAsset(
            media_id=row.get(f"{prefix}_image_media_id"),
            url=row.get(f"{prefix}_image_url"),
            status=row.get(f"{prefix}_image_status", "PENDING"),
        ),
        video=MediaAsset(
            media_id=row.get(f"{prefix}_video_media_id"),
            url=row.get(f"{prefix}_video_url"),
            status=row.get(f"{prefix}_video_status", "PENDING"),
        ),
        upscale=MediaAsset(
            media_id=row.get(f"{prefix}_upscale_media_id"),
            url=row.get(f"{prefix}_upscale_url"),
            status=row.get(f"{prefix}_upscale_status", "PENDING"),
        ),
        end_scene_media_id=row.get(f"{prefix}_end_scene_media_id"),
    )


@dataclass
class Scene(DomainModel):
    """A single scene inside a video."""

    _table: str = field(default="scene", init=False, repr=False, compare=False)

    video_id: str = ""
    display_order: int = 0
    prompt: Optional[str] = None
    image_prompt: Optional[str] = None
    video_prompt: Optional[str] = None
    character_names: Optional[list[str]] = field(default=None)
    parent_scene_id: Optional[str] = None
    chain_type: str = "ROOT"

    vertical: OrientationSlot = field(default_factory=OrientationSlot)
    horizontal: OrientationSlot = field(default_factory=OrientationSlot)

    trim_start: Optional[float] = None
    trim_end: Optional[float] = None
    duration: Optional[float] = None

    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # ------------------------------------------------------------------
    # Construction from flat DB row
    # ------------------------------------------------------------------

    @classmethod
    def from_row(cls, row: dict[str, Any], repo: Any = None) -> Scene:
        """Create a Scene from a flat DB/API row, inflating OrientationSlots."""
        import json as _json

        names_raw = row.get("character_names")
        if isinstance(names_raw, str):
            try:
                names_raw = _json.loads(names_raw)
            except (ValueError, TypeError):
                names_raw = None

        return cls(
            id=row.get("id", ""),
            video_id=row.get("video_id", ""),
            display_order=row.get("display_order", 0),
            prompt=row.get("prompt"),
            image_prompt=row.get("image_prompt"),
            video_prompt=row.get("video_prompt"),
            character_names=names_raw,
            parent_scene_id=row.get("parent_scene_id"),
            chain_type=row.get("chain_type", "ROOT"),
            vertical=_slot_from_row(row, "vertical"),
            horizontal=_slot_from_row(row, "horizontal"),
            trim_start=row.get("trim_start"),
            trim_end=row.get("trim_end"),
            duration=row.get("duration"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            _repo=repo,
        )

    # ------------------------------------------------------------------
    # Generation helpers
    # ------------------------------------------------------------------

    async def generate_image(
        self,
        *,
        orientation: str = "VERTICAL",
        project_id: str,
        video_id: Optional[str] = None,
    ) -> str:
        """Submit a GENERATE_IMAGE request. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        ops = get_operations()
        return await ops.generate_scene_image(
            scene_id=self.id,
            project_id=project_id,
            video_id=video_id or self.video_id,
            orientation=orientation,
        )

    async def edit_image(
        self,
        edit_prompt: str,
        *,
        orientation: str = "VERTICAL",
        project_id: str,
        video_id: Optional[str] = None,
        source_media_id: Optional[str] = None,
    ) -> str:
        """Submit an EDIT_IMAGE request for this scene. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        slot = self.vertical if orientation == "VERTICAL" else self.horizontal
        ops = get_operations()
        return await ops.edit_scene_image(
            scene_id=self.id,
            project_id=project_id,
            video_id=video_id or self.video_id,
            orientation=orientation,
            edit_prompt=edit_prompt,
            source_media_id=source_media_id or slot.image.media_id,
        )

    async def generate_video(
        self,
        *,
        orientation: str = "VERTICAL",
        project_id: str,
        video_id: Optional[str] = None,
    ) -> str:
        """Submit a GENERATE_VIDEO request. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        ops = get_operations()
        return await ops.generate_scene_video(
            scene_id=self.id,
            project_id=project_id,
            video_id=video_id or self.video_id,
            orientation=orientation,
        )

    async def upscale_video(
        self,
        *,
        orientation: str = "VERTICAL",
        project_id: str,
        video_id: Optional[str] = None,
    ) -> str:
        """Submit an UPSCALE_VIDEO request. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        ops = get_operations()
        return await ops.upscale_scene_video(
            scene_id=self.id,
            project_id=project_id,
            video_id=video_id or self.video_id,
            orientation=orientation,
        )
