# tiny - Image Compression Command

Compress and optimize images with quality control.

## Basic Usage

```bash
bunx @zzclub/z-cli tiny -f <path> -q <quality>
```

## Parameters

| Flag | Long Form | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `-f` | `--file <path>` | string | required | Image file or directory path |
| `-q` | `--quality <1-100>` | number | 75 | Compression quality (1-100) |
| `-r` | `--recursive` | boolean | false | Process subdirectories |
| `-o` | `--overwrite` | boolean | false | Replace original files |
| | `--output <dir>` | string | - | Output directory |

## Supported Formats

- JPEG / JPG (optimized with mozjpeg)
- PNG (optimized with pngquant)
- WebP

## Quality Guidelines

| Use Case | Recommended Quality | Notes |
|----------|---------------------|-------|
| Email attachments | 60-70 | Aggressive compression for size limits |
| Web thumbnails | 65-75 | Balance size vs quality |
| Web images | 75-80 | Standard web delivery |
| High quality web | 85-90 | Portfolio, hero images |
| Archival | 90-95 | Minimal loss, space savings |

## Usage Patterns

### Single File Compression

```bash
# Basic compression
bunx @zzclub/z-cli tiny -f ./photo.jpg -q 80

# Overwrite original (REQUIRES user confirmation)
bunx @zzclub/z-cli tiny -f ./photo.jpg -q 80 -o

# Specify output directory
bunx @zzclub/z-cli tiny -f ./photo.jpg -q 80 --output ./compressed
```

### Batch Directory Compression

```bash
# Process directory (non-recursive)
bunx @zzclub/z-cli tiny -f ./images -q 80

# Process directory recursively
bunx @zzclub/z-cli tiny -f ./images -r -q 80

# Batch with output directory (RECOMMENDED - preserves originals)
bunx @zzclub/z-cli tiny -f ./images -r -q 80 --output ./compressed
```

## Agent Workflow

### Step 1: Validate Input

- Confirm path exists (`ls -la <path>`)
- Check if file or directory
- Verify format is supported (JPEG/PNG/WebP)

### Step 2: Determine Strategy

**For single file**:
- Default: `bunx @zzclub/z-cli tiny -f <file> -q 80`
- User wants overwrite: Ask confirmation first, then use `-o`

**For directory**:
- Always recommend `--output` to preserve originals
- Use `-r` if subdirectories should be processed
- Suggest quality based on use case

### Step 3: Execute

Run the command with validated parameters.

### Step 4: Report Results

```
✓ Compressed: <original-size> → <compressed-size> (<reduction>%)

Summary:
- Files processed: <count>
- Original total: <size>
- Compressed total: <size>
- Average reduction: <percent>%
```

## Common Scenarios

### Web Optimization

```bash
# Standard web images
bunx @zzclub/z-cli tiny -f ./site-images -r -q 78 --output ./web-optimized

# Portfolio/showcase
bunx @zzclub/z-cli tiny -f ./portfolio -r -q 88 --output ./showcase
```

### Email Preparation

```bash
# Aggressive compression for email
bunx @zzclub/z-cli tiny -f ./photos -r -q 65 --output ./email-ready
```

### Mobile App Assets

```bash
# Different tiers for different asset types
bunx @zzclub/z-cli tiny -f ./icons -r -q 90 --output ./app/icons
bunx @zzclub/z-cli tiny -f ./backgrounds -r -q 80 --output ./app/bg
bunx @zzclub/z-cli tiny -f ./thumbnails -r -q 70 --output ./app/thumbs
```

### Quality Comparison Testing

```bash
# Test multiple quality levels
for Q in 60 75 90; do
  bunx @zzclub/z-cli tiny -f sample.jpg -q $Q --output ./test-q$Q
done
```

## Safety Rules

1. **NEVER use `-o` without explicit user confirmation**
   - Always warn: "This will overwrite original files. Confirm?"
   - Wait for explicit "yes" before proceeding

2. **For batch operations, recommend `--output`**
   - Preserves original files
   - User can compare before/after
   - Can always delete originals later if satisfied

3. **Validate paths before execution**
   - Check file/directory exists
   - Verify write permissions for output directory
   - Check available disk space for large batches

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported format" | File is not JPEG/PNG/WebP | Check file format, convert if needed |
| "Permission denied" | No read/write access | Check permissions with `ls -la` |
| "Out of memory" | Large batch or high quality | Process smaller batches, reduce quality |
| "File not found" | Invalid path | Verify path with `ls <path>` |

## Output Naming

Compressed files are named with `-tiny` suffix:
- `photo.jpg` → `photo-tiny.jpg`
- `image.png` → `image-tiny.png`

When using `-o`, originals are replaced directly.

## Performance Notes

- Sharp (libvips) is 4-5x faster than ImageMagick/GraphicsMagick
- Batch processing is efficient with recursive flag
- Memory usage scales with image size and quality
