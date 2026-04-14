# Google Flow Agent

Base URL: `http://127.0.0.1:8100`

## Pre-flight

```bash
curl -s http://127.0.0.1:8100/health
# Must return: {"extension_connected": true}
```

## How to work

- Always use `/gla:*` skills — all rules and workflows live inside each skill
- Never write scripts to loop API calls — use `POST /api/requests/batch`
- `media_id` is always UUID format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`), never `CAMS...` strings

## Skills

| Skill | When to use |
|-------|-------------|
| `/gla:create-project` | New project with entities + scenes |
| `/gla:research` | Fact-check before scripting |
| `/gla:gen-refs` | Generate reference images for entities |
| `/gla:gen-images` | Generate scene images |
| `/gla:gen-videos` | Generate scene videos |
| `/gla:gen-chain-videos` | Videos with scene chaining transitions |
| `/gla:review-video` | Review video quality before upscale |
| `/gla:review-board` | Visual scene review board for feedback |
| `/gla:concat` | Download + concat final video |
| `/gla:concat-fit-narrator` | Concat trimmed to narrator duration |
| `/gla:gen-narrator` | Generate narrator text + TTS |
| `/gla:gen-text-overlays` | Generate text overlays from narrator text |
| `/gla:gen-tts-template` | Create voice template for narration |
| `/gla:gen-music` | Generate music via Suno |
| `/gla:creative-mix` | Creative video mixing techniques |
| `/gla:pipeline` | Full pipeline orchestration |
| `/gla:monitor` | Monitor running pipeline |
| `/gla:status` | Project status dashboard |
| `/gla:switch-project` | Switch active project |
| `/gla:fix-uuids` | Fix non-UUID media_ids |
| `/gla:refresh-urls` | Refresh expired GCS URLs |
| `/gla:add-material` | Set image material style |
| `/gla:change-model` | Change video/image model |
| `/gla:insert-scene` | Insert scenes into chain |
| `/gla:upload-image` | Upload local image to get media_id |
| `/gla:thumbnail` | Generate YouTube thumbnails |
| `/gla:brand-logo` | Apply channel logo watermark |
| `/gla:youtube-seo` | Generate YouTube metadata |
| `/gla:youtube-upload` | Upload to YouTube |
| `/gla:camera-guide` | Cinematic camera reference |
| `/gla:thumbnail-guide` | Thumbnail design reference |
| `/gla:import-voice` | Import existing voice template |
| `/gla:dashboard` | Live statusline setup |
