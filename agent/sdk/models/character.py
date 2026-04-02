"""SDK Character domain model."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Optional

from agent.sdk.models.base import DomainModel

if TYPE_CHECKING:
    from agent.sdk.models.project import Project


@dataclass
class Character(DomainModel):
    """A reference entity (character, location, creature, visual_asset, etc.)."""

    _table: str = field(default="character", init=False, repr=False, compare=False)

    name: str = ""
    entity_type: str = "character"
    description: Optional[str] = None
    image_prompt: Optional[str] = None
    voice_description: Optional[str] = None
    reference_image_url: Optional[str] = None
    media_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # Back-reference set after construction
    _project: Optional[Project] = field(default=None, repr=False, compare=False)

    # ------------------------------------------------------------------
    # Generation helpers
    # ------------------------------------------------------------------

    async def generate_image(self, *, project_id: Optional[str] = None) -> str:
        """Submit a GENERATE_CHARACTER_IMAGE request. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        pid = project_id or (self._project.id if self._project else None)
        if not pid:
            raise ValueError("project_id required (not attached to a project)")
        ops = get_operations()
        return await ops.generate_character_image(
            character_id=self.id,
            project_id=pid,
        )

    async def edit_image(
        self,
        edit_prompt: str,
        *,
        project_id: Optional[str] = None,
        source_media_id: Optional[str] = None,
    ) -> str:
        """Submit an EDIT_IMAGE request for this entity. Returns the request id."""
        from agent.sdk.services.operations import get_operations

        pid = project_id or (self._project.id if self._project else None)
        if not pid:
            raise ValueError("project_id required (not attached to a project)")
        ops = get_operations()
        return await ops.edit_character_image(
            character_id=self.id,
            project_id=pid,
            edit_prompt=edit_prompt,
            source_media_id=source_media_id or self.media_id,
        )
