"""Music generation routes — Suno API integration."""
import json
import logging
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent.config import MUSIC_OUTPUT_DIR
from agent.services.suno import get_suno_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/music", tags=["music"])

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "skills" / "song-templates"


# ─── Request Models ──────────────────────────────────────────


class GenerateRequest(BaseModel):
    """Generate music via Suno."""
    prompt: str = ""  # lyrics with [Verse]/[Chorus] tags (custom mode)
    tags: str = ""  # musical style (e.g. "lo-fi hip hop, chill, piano")
    title: str = ""
    make_instrumental: bool = False
    model: str = ""  # override default model
    gpt_description_prompt: str = ""  # natural language description (auto mode)
    template_id: Optional[str] = None  # use a song template
    poll: bool = False  # if True, poll until complete before returning


class GenerateLyricsRequest(BaseModel):
    """Generate lyrics from a prompt."""
    prompt: str
    template_id: Optional[str] = None  # use template guidelines


# ─── Routes ──────────────────────────────────────────────────


@router.get("/templates")
async def list_templates():
    """List available song templates."""
    index_path = TEMPLATES_DIR / "index.json"
    if not index_path.exists():
        raise HTTPException(404, "Song templates index not found")
    return json.loads(index_path.read_text())


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific song template."""
    path = TEMPLATES_DIR / f"{template_id}.json"
    if not path.exists():
        raise HTTPException(404, f"Template '{template_id}' not found")
    return json.loads(path.read_text())


@router.post("/generate")
async def generate_music(body: GenerateRequest):
    """Generate music. Returns clip IDs (or full clips if poll=True).

    Two modes:
    - Custom: provide `prompt` (lyrics) + `tags` (style) + `title`
    - Description: provide `gpt_description_prompt` (AI writes lyrics+style)

    Optional: pass `template_id` to auto-fill tags from a song template.
    """
    client = get_suno_client()

    tags = body.tags
    prompt = body.prompt

    # Apply template if specified
    if body.template_id:
        tpl_path = TEMPLATES_DIR / f"{body.template_id}.json"
        if not tpl_path.exists():
            raise HTTPException(404, f"Template '{body.template_id}' not found")
        tpl = json.loads(tpl_path.read_text())
        if not tags:
            tags = tpl.get("suno_tags", "")
        if not prompt and not body.gpt_description_prompt:
            prompt = tpl.get("example_lyrics", "")

    if not prompt and not body.gpt_description_prompt:
        raise HTTPException(400, "Provide prompt (lyrics), gpt_description_prompt, or template_id")

    try:
        clips = await client.generate(
            prompt=prompt,
            tags=tags,
            title=body.title,
            make_instrumental=body.make_instrumental,
            model=body.model,
            gpt_description_prompt=body.gpt_description_prompt,
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Suno API error: {e.response.text[:500]}")

    if not body.poll:
        return {"clips": clips, "clip_ids": [c["id"] for c in clips]}

    # Poll until all clips complete
    results = []
    for clip in clips:
        try:
            result = await client.poll_clip(clip["id"])
            results.append(result)
        except TimeoutError as e:
            results.append({"id": clip["id"], "status": "timeout", "error": str(e)})

    return {"clips": results}


@router.get("/clips/{clip_id}")
async def get_clip(clip_id: str):
    """Get clip status and audio URL."""
    client = get_suno_client()
    try:
        return await client.get_clip(clip_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Suno API error: {e.response.text[:500]}")


@router.post("/clips/{clip_id}/poll")
async def poll_clip(clip_id: str):
    """Poll a clip until complete. Returns the final clip data."""
    client = get_suno_client()
    try:
        return await client.poll_clip(clip_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except TimeoutError as e:
        raise HTTPException(504, str(e))


@router.post("/clips/{clip_id}/download")
async def download_clip(clip_id: str):
    """Download a completed clip's audio to local output directory."""
    client = get_suno_client()
    try:
        clip = await client.get_clip(clip_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    if clip.get("status") != "complete":
        raise HTTPException(400, f"Clip not complete (status: {clip.get('status')})")

    audio_url = clip.get("audio_url")
    if not audio_url:
        raise HTTPException(400, "No audio_url on clip")

    MUSIC_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    title = clip.get("title", "untitled").replace("/", "_").replace(" ", "_")[:50]
    filename = f"{title}_{clip_id[:8]}.mp3"
    out_path = MUSIC_OUTPUT_DIR / filename

    async with httpx.AsyncClient(timeout=60) as http:
        r = await http.get(audio_url)
        r.raise_for_status()
        out_path.write_bytes(r.content)

    logger.info("Downloaded clip %s → %s (%.1f MB)", clip_id[:8], out_path, len(r.content) / 1e6)
    return {"path": str(out_path), "size_bytes": len(r.content), "clip": clip}


@router.post("/generate-lyrics")
async def generate_lyrics(body: GenerateLyricsRequest):
    """Generate lyrics from a natural language prompt."""
    client = get_suno_client()

    prompt = body.prompt
    if body.template_id:
        tpl_path = TEMPLATES_DIR / f"{body.template_id}.json"
        if tpl_path.exists():
            tpl = json.loads(tpl_path.read_text())
            guidelines = tpl.get("lyrics_guidelines", {})
            tips = guidelines.get("tips", [])
            if tips:
                prompt += f"\n\nStyle guidelines: {'; '.join(tips)}"

    try:
        return await client.generate_lyrics(prompt)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Suno API error: {e.response.text[:500]}")


@router.get("/credits")
async def get_credits():
    """Get Suno billing/credit info."""
    client = get_suno_client()
    try:
        return await client.get_credits()
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Suno API error: {e.response.text[:500]}")
