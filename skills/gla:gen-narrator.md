# gla:gen-narrator — Generate Narrator Text + TTS for All Scenes

Auto-generate documentary-style narrator text from scene video_prompts, then generate TTS audio using a voice template.

Usage: `/gla:gen-narrator <video_id> [--force] [--language vi] [--speed 1.1]`

Prepares audio for `/gla:concat-fit-narrator`.

## Step 1: Load project, video, scenes

```bash
curl -s http://127.0.0.1:8100/api/videos/<VID>
curl -s http://127.0.0.1:8100/api/projects/<PID>
curl -s "http://127.0.0.1:8100/api/scenes?video_id=<VID>"
```

Note: project name, language, story context.
Sort scenes by `display_order`.

## Step 2: Check voice template

```bash
curl -s http://127.0.0.1:8100/api/tts/templates
```

If NO templates exist:
```
No voice template found. Run /gla:gen-tts-template first to create one.
Voice consistency requires a template — without it, each scene sounds different.
```
**ABORT** — do not proceed without a voice template.

If templates exist, list them and ask user which to use (or default to the first one).

Also check for `ref_audio` files:
```bash
ls output/_shared/tts_templates/voice_template_*.wav 2>/dev/null
```

User can specify a template name OR a ref_audio path directly.

## Step 3: Generate narrator text for each scene

For each scene (sorted by display_order):

### Skip logic (unless --force):
- If scene already has `narrator_text` AND not --force → skip

### Read the scene's `video_prompt` and `prompt`

The `video_prompt` describes what happens in the 8s video (sub-clip timing).
The `prompt` describes the still image (frame 0).
The project `story` provides overall narrative context.

### Generate narrator_text following these rules:

**Language:** Use `--language` flag or project's `language` field.

**CRITICAL: Narrator MUST be shorter than video.**
Each scene video is 8s. With `-ss 1` trim, usable video = 7s. With 0.5s buffer, narrator must fit in ~6.5s max.
At 1.1x speed: Vietnamese ~5.5 words/sec, English ~4.5 words/sec.

**Word count limits (HARD MAX — never exceed):**

| Language | Max Words | ~Duration | Words/sec | Notes |
|----------|-----------|-----------|-----------|-------|
| Vietnamese | 20 | ~5s | ~4.0 | Tonal, many monosyllabic words but diacritics slow TTS |
| English | 20 | ~5s | ~4.0 | Standard baseline |
| Japanese | 30 | ~5s | ~6.0 | Short words, particles add up fast (は、を、に) |
| Korean | 20 | ~5s | ~4.0 | Agglutinative, long compound words = fewer needed |
| Thai | 22 | ~5s | ~4.5 | Tonal like Vietnamese, no spaces between words |
| Chinese (ZH) | 25 | ~5s | ~5.0 | Each character = 1 syllable, very dense |
| Spanish | 22 | ~5s | ~4.5 | Slightly faster than English |
| French | 22 | ~5s | ~4.5 | Liaison makes speech flow faster |
| Arabic | 18 | ~5s | ~3.5 | Long words, formal style = slower delivery |
| Hindi | 20 | ~5s | ~4.0 | Compound verbs take time |

**Why strict?** TTS duration varies — same word count can produce 5s or 8s depending on syllables, pauses, and voice. Keep conservative so TTS stays under 7s. If narrator is longer than video, it gets cut off mid-sentence.

**Rule of thumb for unlisted languages:** MAX 20 words. Adjust down for languages with long compound words (German, Finnish), adjust up for languages with short particles (Japanese, Chinese).

**Documentary narrator style:**

DO:
- Add context the viewer CAN'T see: historical facts, stakes, motivations
- Add emotion and tension: "One wrong move — and it's war"
- Use short punchy sentences, varied rhythm
- Build narrative arc across scenes (setup → rising → climax → resolution)
- Match the story's genre and tone
- Reference character names from the scene's `character_names`

DON'T:
- Describe what's visually obvious: "We see a ship sailing" (viewer sees it)
- Use filler phrases: "In this scene...", "Meanwhile...", "As we can see..."
- Exceed word count (too long = rushed speech, bad audio)
- Be too short (< 15 words = dead air, awkward silence)
- Use passive voice: "The ship was attacked" → "Iran attacked the ship"

### Example (military documentary, Vietnamese):

Scene video_prompt: `0-3s: Captain Harris stands on the bridge scanning the horizon. 3-6s: Radar shows multiple fast contacts approaching. 6-8s: Captain grabs radio and orders battle stations.`

narrator_text: `Đại tá Harris phát hiện tín hiệu radar bất thường. Hàng chục tàu cao tốc Iran đang lao thẳng về phía đoàn hộ tống. Ông ra lệnh chiến đấu.`
(31 words, ~5.5s at 1.1x, adds context about Iran + convoy not visible in scene)

### Example (military documentary, English):

narrator_text: `Captain Harris spots unusual radar signatures. Dozens of Iranian fast boats are racing straight toward the convoy. He orders battle stations.`
(21 words, ~5s at 1.1x)

## Step 4: Save narrator_text to each scene

For each scene with generated text:

```bash
curl -X PATCH "http://127.0.0.1:8100/api/scenes/<SID>" \
  -H "Content-Type: application/json" \
  -d '{"narrator_text": "<generated_text>"}'
```

## Step 5: Show all narrator texts for review

Print a table:

```
Scene | Words | Est. Duration | Narrator Text
------|-------|---------------|---------------
  000 |    31 |         5.5s  | Đại tá Harris phát hiện tín hiệu...
  001 |    28 |         5.0s  | Tàu dầu Meridian Star nặng nề...
  002 |    33 |         5.8s  | Eo biển Hormuz — nơi 20% dầu mỏ...
  ...
Total: 40 scenes, ~1200 words, ~210s narration
```

Ask user: "Review OK? Type 'yes' to generate TTS, or 'edit N' to modify scene N's text."

## Step 6: Generate TTS for all scenes

**CRITICAL: Always pass BOTH `ref_audio` AND `ref_text` together.**
Without `ref_text`, OmniVoice falls back to generic voice → each scene sounds different.

### Proven workflow (per-scene via `/api/tts/generate`):

The batch endpoint (`/api/videos/<VID>/narrate`) can timeout on large batches (40+ scenes).
Use per-scene generation for reliability:

```python
for scene in scenes:
    curl -s -m 120 -X POST "http://127.0.0.1:8100/api/tts/generate" \
      -H "Content-Type: application/json" \
      -d '{
        "text": "<scene_narrator_text>",
        "ref_audio": "<path_to_voice_template.wav>",
        "ref_text": "<exact_transcript_of_voice_template>",
        "speed": 1.1,
        "output_path": "${OUTDIR}/tts/scene_{IDX3}_{scene_id}.wav"
      }'
```

### Where does `ref_text` come from?

The `ref_text` is the **exact transcript** of what's spoken in `ref_audio`.

- If template was created via `/gla:gen-tts-template`: `ref_text` = the standard base transcript used during creation (stored in `templates.json`)
- If template is a user-provided WAV: transcribe it first using whisper, then use that transcript as `ref_text` for all scenes

### Key rules:
- `ref_audio` = the voice template WAV file (voice timbre source)
- `ref_text` = exact transcript of `ref_audio` (phoneme alignment)
- Both MUST be provided together — never just `ref_audio` alone
- Same `ref_audio` + `ref_text` for ALL scenes = consistent voice
- `speed: 1.1` recommended for documentary pacing

**mix: false** — we don't mix here. Mixing happens in `/gla:concat-fit-narrator`.

## Step 7: Setup output directory

```bash
# Get project output directory (creates dir + meta.json if needed)
PROJ_OUT=$(curl -s http://127.0.0.1:8100/api/projects/<PID>/output-dir)
OUTDIR=$(echo "$PROJ_OUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['path'])")
mkdir -p "${OUTDIR}/tts"
```

Verify file naming matches expected pattern:
```
${OUTDIR}/tts/scene_000_<scene_id>.wav
${OUTDIR}/tts/scene_001_<scene_id>.wav
...
${OUTDIR}/tts/scene_039_<scene_id>.wav
```

## Step 8: Verify and output

```bash
ls "${OUTDIR}/tts/scene_*.wav" | wc -l
# Should match number of scenes with narrator_text

# Check a few durations
for f in $(ls "${OUTDIR}/tts/scene_00*.wav" | head -5); do
  echo "$(basename $f): $(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")s"
done
```

Print:
```
Narrator generation complete: <project_name>
  Scenes narrated: N/M
  Language: Vietnamese
  Voice: <template_name or ref_audio>
  Speed: 1.1x
  Total narration: XXXs
  Output: ${OUTDIR}/tts/

  Next step: /gla:concat-fit-narrator <video_id>
```

## Narrative Arc Guide

When writing narrator text for 30-40 scenes, follow a narrative arc:

| Phase | Scenes | Tone | Example |
|-------|--------|------|---------|
| **Setup** | 1-5 | Calm, informative | "Eo biển Hormuz — tuyến đường huyết mạch..." |
| **Rising** | 6-15 | Building tension | "Radar phát hiện nhiều tín hiệu bất thường..." |
| **Climax** | 16-25 | Intense, urgent | "Iran tấn công! Hàng chục tàu lao về phía đoàn hộ tống!" |
| **Resolution** | 26-35 | Relief, reflection | "Đoàn tàu đã vượt qua eo biển an toàn..." |
| **Epilogue** | 36-40 | Reflective, closing | "Chiến dịch Hormuz Shield — bài học về sức mạnh răn đe..." |

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| TTS sounds different each scene | No voice template | Run /gla:gen-tts-template first |
| Narrator text too long | Exceeds word count | Keep under 35 VN / 30 EN words |
| Dead air in scene | Narrator text too short | Aim for 25+ VN / 20+ EN words |
| Wrong language | Didn't match project language | Use --language flag or check project.language |
| TTS files not found by concat | Wrong output path | Copy to ${OUTDIR}/tts/ |
| Narrator describes visuals | Bad writing style | Remove "we see", describe context/stakes instead |
