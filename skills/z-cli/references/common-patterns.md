# Common Patterns and Workflows

This file contains reusable patterns for common image compression workflows.

## Table of Contents

- [Pipeline Integration](#pipeline-integration)
- [Multi-Tier Processing](#multi-tier-processing)
- [Quality Testing](#quality-testing)
- [Error Recovery](#error-recovery)

---

## Pipeline Integration

### Download → Compress → Upload

```bash
# Complete workflow example
# 1. Download source images
curl -O https://example.com/images.zip
unzip images.zip -d ./source

# 2. Compress for target use case
bunx @zzclub/z-cli tiny -f ./source -r -q 80 --output ./compressed

# 3. Verify results
du -sh ./source ./compressed

# 4. Upload to destination
# (use your upload tool)
```

### Git Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Auto-compress staged images

STAGED_IMAGES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(jpg|jpeg|png|webp)$')

if [ -n "$STAGED_IMAGES" ]; then
  for img in $STAGED_IMAGES; do
    bunx @zzclub/z-cli tiny -f "$img" -q 80 -o
    git add "$img"
  done
fi
```

### Continuous Integration

```yaml
# .github/workflows/optimize-images.yml
name: Optimize Images
on: [push]
jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bunx @zzclub/z-cli tiny -f ./public/images -r -q 80 --output ./optimized
      - run: cp -r ./optimized/* ./public/images/
      - run: git add ./public/images && git commit -m "Optimize images" && git push
```

---

## Multi-Tier Processing

### Responsive Image Variants

```bash
# Generate multiple quality tiers for responsive delivery

SOURCE="./originals"

# Desktop full resolution
bunx @zzclub/z-cli tiny -f "$SOURCE" -r -q 88 --output ./variants/desktop

# Tablet medium resolution
bunx @zzclub/z-cli tiny -f "$SOURCE" -r -q 80 --output ./variants/tablet

# Mobile standard
bunx @zzclub/z-cli tiny -f "$SOURCE" -r -q 75 --output ./variants/mobile

# Mobile 2G fallback
bunx @zzclub/z-cli tiny -f "$SOURCE" -r -q 60 --output ./variants/mobile-2g
```

### Mobile App Asset Organization

```bash
# Different quality for different asset types

# App icons - highest quality (sharp edges matter)
bunx @zzclub/z-cli tiny -f ./raw/icons -r -q 92 --output ./app/icons

# Splash screens - high quality
bunx @zzclub/z-cli tiny -f ./raw/splash -r -q 88 --output ./app/splash

# Content images - balanced
bunx @zzclub/z-cli tiny -f ./raw/content -r -q 80 --output ./app/content

# User avatars - lower quality acceptable
bunx @zzclub/z-cli tiny -f ./raw/avatars -r -q 70 --output ./app/avatars

# Thumbnails - aggressive compression
bunx @zzclub/z-cli tiny -f ./raw/thumbnails -r -q 65 --output ./app/thumbnails
```

### E-commerce Product Images

```bash
# Different tiers for different pages

# Product detail page - high quality
bunx @zzclub/z-cli tiny -f ./products -r -q 90 --output ./cdn/product-detail

# Category listing - medium quality
bunx @zzclub/z-cli tiny -f ./products -r -q 78 --output ./cdn/listing

# Search results thumbnails - lower quality
bunx @zzclub/z-cli tiny -f ./products -r -q 65 --output ./cdn/thumbnails
```

---

## Quality Testing

### Side-by-Side Comparison

```bash
# Test multiple quality levels on representative sample

SAMPLE="./test-image.jpg"

for Q in 50 65 75 85 95; do
  bunx @zzclub/z-cli tiny -f "$SAMPLE" -q $Q --output "./compare/q$Q"
done

# Generate size report
echo "Quality | Size | Reduction"
echo "--------|------|----------"
ORIGINAL_SIZE=$(stat -c%s "$SAMPLE" 2>/dev/null || stat -f%z "$SAMPLE")
for Q in 50 65 75 85 95; do
  COMPRESSED=$(stat -c%s "./compare/q$Q/test-image-tiny.jpg" 2>/dev/null || stat -f%z "./compare/q$Q/test-image-tiny.jpg")
  REDUCTION=$(echo "scale=1; (1 - $COMPRESSED / $ORIGINAL_SIZE) * 100" | bc)
  echo "Q$Q | $COMPRESSED bytes | $REDUCTION%"
done
```

### Batch Quality Analysis

```bash
# Analyze entire directory at different quality levels

for Q in 70 80 90; do
  bunx @zzclub/z-cli tiny -f ./sample-set -r -q $Q --output "./analysis/q$Q"
  echo "Quality $Q: $(du -sh ./analysis/q$Q | cut -f1)"
done
```

---

## Error Recovery

### Handle Large Batches with Memory Limits

```bash
# Split large directories into chunks to avoid OOM

find ./huge-archive -name "*.jpg" -print0 | \
  xargs -0 -n 50 -P 1 -I {} \
  bunx @zzclub/z-cli tiny -f {} -q 80 --output ./processed
```

### Conditional Processing Based on Size

```bash
# Only compress files larger than 1MB

for img in ./photos/*; do
  SIZE=$(stat -c%s "$img" 2>/dev/null || stat -f%z "$img")
  if [ $SIZE -gt 1048576 ]; then
    echo "Compressing $img"
    bunx @zzclub/z-cli tiny -f "$img" -q 80 --output ./optimized
  else
    echo "Skipping $img (already small)"
    cp "$img" ./optimized/
  fi
done
```

### Resume After Interruption

```bash
# Process only files that haven't been compressed yet

for src in ./source/*.jpg; do
  filename=$(basename "$src")
  dest="./compressed/${filename%.jpg}-tiny.jpg"
  
  if [ ! -f "$dest" ]; then
    echo "Processing $filename"
    bunx @zzclub/z-cli tiny -f "$src" -q 80 --output ./compressed
  else
    echo "Skipping $filename (already processed)"
  fi
done
```

### Verify Integrity After Compression

```bash
# Ensure all files were processed

ORIGINAL_COUNT=$(find ./source -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l)
COMPRESSED_COUNT=$(find ./compressed -type f | wc -l)

if [ $ORIGINAL_COUNT -eq $COMPRESSED_COUNT ]; then
  echo "✓ All $ORIGINAL_COUNT files processed successfully"
else
  echo "✗ File count mismatch!"
  echo "  Original: $ORIGINAL_COUNT"
  echo "  Compressed: $COMPRESSED_COUNT"
  echo "  Missing: $((ORIGINAL_COUNT - COMPRESSED_COUNT))"
fi
```

---

## Advanced Patterns

### Parallel Processing

```bash
# Process large batches faster with GNU parallel
# (Requires: gnu-parallel)

find ./large-batch -name "*.jpg" | \
  parallel -j 4 \
  'bunx @zzclub/z-cli tiny -f {} -q 80 --output ./processed'
```

### Watch Directory for New Images

```bash
# Auto-compress new images dropped into directory
# (Requires: inotify-tools on Linux, fswatch on macOS)

# Linux
inotifywait -m ./watch-dir -e create -e moved_to |
  while read path action file; do
    if [[ "$file" =~ \.(jpg|jpeg|png|webp)$ ]]; then
      bunx @zzclub/z-cli tiny -f "$path$file" -q 80 --output ./compressed
    fi
  done

# macOS
fswatch -0 ./watch-dir | while read -d "" file; do
  if [[ "$file" =~ \.(jpg|jpeg|png|webp)$ ]]; then
    bunx @zzclub/z-cli tiny -f "$file" -q 80 --output ./compressed
  fi
done
```

### Archive with Metadata Preservation

```bash
# Compress while preserving timestamps and permissions

for img in ./archive/*.jpg; do
  bunx @zzclub/z-cli tiny -f "$img" -q 92 --output ./compressed
  
  # Restore original timestamp
  touch -r "$img" "./compressed/$(basename "${img%.jpg}")-tiny.jpg"
done
```
