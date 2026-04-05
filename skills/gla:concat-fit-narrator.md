Trim each scene video to fit its TTS narrator duration, then concatenate into a final video.

Usage: `/gla:concat-fit-narrator <video_id> [--buffer 0.5] [--4k]`

Default: trims each scene to `narrator_duration + 0.5s`, preserves 4K, mixes SFX + TTS.

## Step 1: Get project, video, and scenes

```bash
curl -s http://127.0.0.1:8100/api/videos/<VID>
# Get project_id from video response
curl -s http://127.0.0.1:8100/api/projects/<PID>
curl -s "http://127.0.0.1:8100/api/scenes?video_id=<VID>"
```

Note: project name (for output folder), orientation (HORIZONTAL or VERTICAL).
Sort scenes by `display_order`.

## Step 2: Locate video + TTS for each scene

For each scene (sorted by display_order, index = IDX starting at 0):

**Video source** (priority order):
1. `output/4k_raw/{scene_id}.mp4` (local 4K rawBytes — best quality)
2. `horizontal_upscale_url` or `vertical_upscale_url` (4K signed URL)
3. `horizontal_video_url` or `vertical_video_url` (standard quality)

**TTS source** (check both paths):
1. `output/{project_name}/tts/scene_{IDX3}_{scene_id}.wav`
2. `output/tts/{video_id}/scene_{IDX3}_{scene_id}.wav`

Where `IDX3` = zero-padded 3-digit index (000, 001, ...).

**ABORT** if any scene has no video source. Tell user to run `/gla:gen-videos` first.

If a scene has no TTS file, keep its full original duration (no trim).

## Step 3: Get TTS duration for each scene

```bash
for each scene:
  TTS_DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$TTS_WAV")
  CUT_DUR=$(python3 -c "print(round(${TTS_DUR} + ${BUFFER}, 2))")
  VIDEO_DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$VIDEO_FILE")
  
  # Don't extend beyond video length
  if CUT_DUR > VIDEO_DUR: CUT_DUR = VIDEO_DUR
```

Print a table before processing:

```
Scene | TTS Duration | Cut Duration | Video Source
------|-------------|-------------|-------------
  000 |       6.30s |       6.80s | 4k_raw/8fdb...mp4
  001 |       5.86s |       6.36s | 4k_raw/4151...mp4
  002 |       5.63s |       6.13s | 4k_raw/faeb...mp4
  003 |       3.95s |       4.45s | 4k_raw/d6ba...mp4
  ...
Total estimated duration: XXXs (vs 320s at 8s each)
```

Ask user to confirm before processing.

## Step 4: Setup output directory

```bash
PROJECT_NAME="<sanitized_project_name>"  # lowercase, spaces→underscores
mkdir -p output/${PROJECT_NAME}/{trimmed,norm_trimmed}
```

## Step 5: Determine output resolution

- If `--4k` flag or source is 4K: use `3840:2160` (HORIZONTAL) or `2160:3840` (VERTICAL)
- Otherwise: match source resolution from first scene via ffprobe

**IMPORTANT: Never downscale 4K videos. If source is 3840x2160, output must be 3840x2160.**

## Step 6: Trim + normalize + mix audio (per scene)

For each scene, single ffmpeg pass — trim, normalize resolution, and mix TTS:

### Scene WITH TTS:

```bash
ffmpeg -y -i "$VIDEO_FILE" -i "$TTS_WAV" \
  -t ${CUT_DUR} \
  -filter_complex "[0:a]volume=0.3[bg];[1:a]volume=1.5[fg];[bg][fg]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" \
  -c:v libx264 -preset fast -crf 18 \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2" \
  -r 24 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "trimmed/scene_${IDX}.mp4"
```

**Key flags:**
- `-t ${CUT_DUR}` — trims output to narrator duration + buffer
- `duration=first` — audio output matches the first input (video SFX, 8s), which `-t` then trims to cut duration. TTS plays fully within this window since cut = tts_dur + buffer.
- `volume=0.3` for SFX, `volume=1.5` for narrator
- Do NOT use `apad` — it generates infinite silence and stalls the pipeline

### Scene WITHOUT TTS (keep full duration):

```bash
ffmpeg -y -i "$VIDEO_FILE" \
  -c:v libx264 -preset fast -crf 18 \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2" \
  -r 24 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "trimmed/scene_${IDX}.mp4"
```

**CRITICAL: Do NOT use `-an`. Always preserve audio.**

## Step 7: Create concat list and merge

```bash
> concat_trimmed.txt
for i in $(seq 0 $((NUM_SCENES-1))); do
  idx=$(printf "%02d" $i)
  echo "file 'trimmed/scene_${idx}.mp4'" >> concat_trimmed.txt
done

ffmpeg -y -f concat -safe 0 -i concat_trimmed.txt -c copy -movflags +faststart \
  "${PROJECT_NAME}_narrator_cut.mp4"
```

## Step 8: Verify and output

```bash
# Verify final video
ffprobe -v quiet -show_entries stream=width,height,codec_name,codec_type -of csv=p=0 "${PROJECT_NAME}_narrator_cut.mp4"
ls -lh "${PROJECT_NAME}_narrator_cut.mp4"
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${PROJECT_NAME}_narrator_cut.mp4"

# Verify audio is present
ffmpeg -t 10 -i "${PROJECT_NAME}_narrator_cut.mp4" -af "volumedetect" -f null /dev/null 2>&1 | grep "mean_volume"
# mean_volume should be between -30 and -10 dB (not -inf)
```

Print:
```
Narrator-fit concat complete: <project_name>
  Output: output/<project_name>/<filename>.mp4
  Duration: X:XX (saved Ys vs full 8s scenes)
  Resolution: WxH
  Audio: AAC (SFX 30% + TTS narrator 150%)
  Size: XXX MB
  Scenes: N (N with TTS, M without)
  Buffer: 0.5s

Per-scene breakdown:
  000: 6.30s TTS → 6.80s cut (saved 1.20s)
  001: 5.86s TTS → 6.36s cut (saved 1.64s)
  ...
  Total saved: XXs
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| TTS cuts out mid-sentence | Buffer too small | Increase buffer: `--buffer 1.0` |
| Pipeline stalls at ~2s | `apad` generates infinite silence | Remove `apad`, use `duration=first` only |
| Video is 1080p not 4K | Wrong scale in normalize | Match source resolution, never downscale |
| Scene order wrong | Not sorted by display_order | Sort scenes before processing |
| TTS file not found | Wrong path or naming mismatch | Check both TTS path patterns |
| Abrupt video cut | No fade-out at trim point | Add optional `-af "afade=t=out:st={CUT_DUR-0.3}:d=0.3"` |
