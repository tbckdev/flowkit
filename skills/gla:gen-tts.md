# gla:gen-tts — Generate TTS Narration

Generate TTS narration for all scenes in a video using OmniVoice.

Usage: `/gla:gen-tts <project_id> <video_id>`

## IMPORTANT: Voice Template Required

**Always set up a voice template FIRST** using `gla:gen-tts-template`. Without a template, each scene generates with slightly different voice characteristics. With a template, voice cloning ensures 100% consistency across all scenes.

```
Recommended workflow:
1. gla:gen-tts-template  → Create & verify voice template
2. gla:gen-tts           → Narrate all scenes using template
```

## Step 1: Check prerequisites

```bash
curl -s http://127.0.0.1:8100/health
```

Verify:
- Server is up
- Voice template exists: `GET /api/tts/templates`
- Scenes have `narrator_text`: `GET /api/scenes?video_id=<VID>`

## Step 2: Populate narrator_text on scenes

Each scene needs a `narrator_text` field. Tips:
- Text should fill 5-7s of the scene duration (not too short = dead air, not too long = rushed)
- At 1.1x speed, ~30-35 Vietnamese words or ~25-30 English words per 8s scene
- Write documentary-style narration based on `video_prompt` content
- Leave `narrator_text` null for scenes that should have no narration (action-only)

```bash
curl -X PATCH http://127.0.0.1:8100/api/scenes/<SID> \
  -H "Content-Type: application/json" \
  -d '{"narrator_text": "Narration text for this scene."}'
```

## Step 3: Generate narration with voice template

```bash
curl -X POST "http://127.0.0.1:8100/api/videos/<VID>/narrate" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<PID>",
    "template": "narrator_male_vn",
    "orientation": "HORIZONTAL",
    "speed": 1.1,
    "mix": true,
    "sfx_volume": 0.3
  }'
```

### Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `template` | — | Voice template name (recommended, ensures consistency) |
| `speed` | 1.0 | TTS speed multiplier (1.1-1.2 recommended for military docs) |
| `mix` | true | Auto-overlay narration onto scene video files |
| `sfx_volume` | 0.4 | Veo SFX volume when mixing (0.0-1.0, lower = narration dominant) |
| `orientation` | HORIZONTAL | HORIZONTAL or VERTICAL |
| `instruct` | — | Voice design override (fallback if no template) |
| `ref_audio` | — | Manual ref WAV path (fallback if no template) |

### Priority order for voice:
1. `template` (name) → resolves ref_audio + ref_text from saved template
2. `ref_audio` + auto-resolved ref_text from template metadata
3. `instruct` or project's `narrator_voice` → voice design (less consistent)

## Step 4: Review results

Response includes:
- `scenes_narrated` — scenes with WAV generated
- `scenes_skipped` — scenes without narrator_text
- `scenes_failed` — errors
- `total_narration_duration` — total seconds of narration

## Step 5: Concat final video

After narration is mixed, concat narrated videos:

```bash
# Download narrated scene videos from ${OUTDIR}/tts/ (*_mixed.mp4)
# Or use the original scene videos + overlay manually with ffmpeg
# Then concat using gla:concat or ffmpeg
```

## Single clip TTS

```bash
curl -X POST http://127.0.0.1:8100/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Text to speak",
    "ref_audio": "/path/to/voice_template.wav",
    "ref_text": "Transcript of the template audio",
    "speed": 1.1
  }'
```

## Performance Notes

- **CPU only** — MPS (Apple Silicon) produces audio artifacts, CPU+float32 is reliable
- Per-scene generation: ~15-20s on CPU
- 40 scenes batch: ~10-12 minutes
- Model loads once, reuses for all scenes in a batch
- WAV files saved to `${OUTDIR}/tts/`

## Recommended Settings for Military Documentary

```json
{
  "template": "narrator_male_vn",
  "speed": 1.1,
  "mix": true,
  "sfx_volume": 0.3
}
```

Speed video playback to 1.2x for urgent pacing → narrator fills most of the scene → viewer stays hooked.
