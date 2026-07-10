# Hero Image Generation

Optional step. Goal: one landscape hero at
`public/images/blog/{slug}-hero.jpg`, JPEG, under ~400 KB, no text or
lettering baked into the image (text in AI images renders badly and hurts
reuse as an OG image).

## Writing the prompt

Build the prompt from the article, not the title alone:

- Subject: the concrete scene that best represents the article's core idea.
- Style: match the site's existing hero images — inspect 2–3 in
  `public/images/blog/` first and describe their common style (illustration
  vs photo, palette, mood) in the prompt for consistency.
- Composition: "wide landscape composition, clear focal point, uncluttered
  edges" (edges get cropped in card grids and OG previews).
- Always append: "no text, no words, no lettering, no watermark".

## Provider ladder (use the first that works)

### 1. Image-generation MCP tool in the session

If any image-generation tool is available (Gemini/nanobanana MCP, or similar),
use it with the prompt above, landscape aspect ratio (16:9 or 3:2), and save
the result to the target path.

### 2. Leonardo.ai (`LEONARDO_API_KEY`)

```bash
# Create a generation (Phoenix or FLUX model; 1472x832 is a supported 16:9-ish size)
GEN_ID=$(curl -s -X POST "https://cloud.leonardo.ai/api/rest/v1/generations" \
  -H "Authorization: Bearer $LEONARDO_API_KEY" -H "Content-Type: application/json" \
  -d '{"prompt": "<PROMPT>", "modelId": "b2614463-296c-462a-9586-aafdb8f00e36", "width": 1472, "height": 832, "num_images": 1}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['sdGenerationJob']['generationId'])")

# Poll until complete (typically 10-30s), then download
sleep 20
curl -s "https://cloud.leonardo.ai/api/rest/v1/generations/$GEN_ID" \
  -H "Authorization: Bearer $LEONARDO_API_KEY" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['generations_by_pk']['generated_images'][0]['url'])" \
  | xargs -I{} curl -s -o "public/images/blog/{slug}-hero.jpg" {}
```

If the poll shows `status: PENDING`, wait and retry — do not fail on the
first poll.

### 3. OpenAI (`OPENAI_API_KEY`)

```bash
curl -s https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model": "gpt-image-1", "prompt": "<PROMPT>", "size": "1536x1024", "quality": "medium"}' \
  | python3 -c "import sys,json,base64; open('public/images/blog/{slug}-hero.jpg','wb').write(base64.b64decode(json.load(sys.stdin)['data'][0]['b64_json']))"
```

### 4. No provider available

Skip generation. In your final report, give the user the full prompt, the
target path, and the size/format contract so they can generate it manually.
Remove `heroImage`/`heroAlt` from the frontmatter until the file exists — a
frontmatter path pointing at a missing file breaks the article page's hero
and the OG image.

## Post-processing (all providers)

1. Confirm the file exists and is a real image (`file public/images/blog/{slug}-hero.jpg`).
2. If over ~400 KB, re-encode: `sips -s format jpeg -s formatOptions 70 <file> --out <file>`
   (macOS) or any available tool (`cwebp`, `sharp`, ImageMagick `convert -quality 70`).
3. Write `heroAlt` describing what is actually in the generated image —
   specific, not the article title restated.
