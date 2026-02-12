# set - Update Configuration Command

Update default configuration settings for z-cli commands.

## Basic Usage

```bash
bunx @zzclub/z-cli set [options]
```

## Options

| Flag | Long Form | Type | Description |
|------|-----------|------|-------------|
| `-q` | `--quality <1-100>` | number | Set default compression quality |
| `-r` | `--recursive` | boolean | Enable recursive processing by default |
| | `--no-recursive` | boolean | Disable recursive processing by default |
| `-o` | `--overwrite` | boolean | Enable overwrite by default |
| | `--no-overwrite` | boolean | Disable overwrite by default |
| | `--output <dir>` | string | Set default output directory |

## Usage Examples

### Set Default Quality

```bash
# Set quality to 85
bunx @zzclub/z-cli set -q 85

# Set quality to 90 for high-quality workflow
bunx @zzclub/z-cli set -q 90
```

### Enable/Disable Recursive Processing

```bash
# Enable recursive by default
bunx @zzclub/z-cli set -r

# Disable recursive
bunx @zzclub/z-cli set --no-recursive
```

### Configure Overwrite Behavior

```bash
# Enable overwrite by default (USE WITH CAUTION)
bunx @zzclub/z-cli set -o

# Disable overwrite (RECOMMENDED)
bunx @zzclub/z-cli set --no-overwrite
```

### Set Default Output Directory

```bash
# Set default output directory
bunx @zzclub/z-cli set --output ./compressed

# Clear default output directory
bunx @zzclub/z-cli set --output ""
```

### Multiple Settings at Once

```bash
# Configure multiple settings
bunx @zzclub/z-cli set -q 85 -r --output ./compressed
```

## Agent Workflow

### Step 1: Understand User Intent

Parse what setting(s) the user wants to change:
- Quality level
- Recursive processing
- Overwrite behavior
- Output directory

### Step 2: Validate Input

- **Quality**: Must be 1-100
- **Output directory**: Check if path exists (optional validation)

### Step 3: Confirm Dangerous Settings

**If setting `-o` (overwrite enabled)**:
```
Agent: "⚠️  WARNING: This will make overwrite the DEFAULT behavior.
All future compressions will replace original files unless you specify --no-overwrite.
Are you sure you want to enable this?"

Wait for explicit confirmation before proceeding.
```

### Step 4: Execute

Run the `set` command with validated parameters.

### Step 5: Confirm & Show New Config

```bash
# After setting
bunx @zzclub/z-cli set -q 85
# Show updated config
bunx @zzclub/z-cli config
```

Report to user:
```
✓ Updated settings:
  Default quality: 85
  
Current configuration:
  - Quality: 85
  - Recursive: disabled
  - Overwrite: disabled
```

## Common Scenarios

### User Frequently Uses High Quality

```bash
# User: "I always use quality 90, make it the default"
bunx @zzclub/z-cli set -q 90

# Confirm
Agent: "✓ Set default quality to 90. Future compressions will use this unless you specify -q."
```

### User Always Processes Directories Recursively

```bash
# User: "I always want recursive processing"
bunx @zzclub/z-cli set -r

Agent: "✓ Enabled recursive processing by default. Use --no-recursive to override for specific commands."
```

### User Wants Consistent Output Location

```bash
# User: "Always save to ./compressed directory"
bunx @zzclub/z-cli set --output ./compressed

Agent: "✓ Set default output directory to ./compressed. Override with --output for specific commands."
```

### User Wants to Revert a Setting

```bash
# User: "Disable overwrite, it's too dangerous"
bunx @zzclub/z-cli set --no-overwrite

Agent: "✓ Disabled overwrite by default. Your original files are now safe by default."
```

## Safety Guidelines

### Overwrite Warning

When user tries to enable overwrite as default:

```
⚠️  DANGER: Enabling overwrite by default

This means ALL future image compressions will replace original files.
Consider these safer alternatives:

1. Keep overwrite disabled (default)
2. Use --output ./compressed to preserve originals
3. Only use -o flag when explicitly needed

Continue with enabling overwrite? (yes/no)
```

### Quality Recommendations

Guide users on quality settings:

```
Setting default quality to <value>

Quality guidelines:
- 60-70: Aggressive (email, bandwidth constraints)
- 75-80: Standard web delivery (recommended default)
- 85-90: High quality (portfolio, showcase)
- 90-95: Near-lossless archival

Your choice of <value> is suitable for: <use case>
```

## Configuration Persistence

All settings are saved to `$XDG_CONFIG_HOME/zzclub-z-cli/config.json` (or `~/.config/zzclub-z-cli/config.json` on Linux) and persist across:
- Terminal sessions
- System reboots
- CLI version updates (within same major version)

## Priority Order

Settings are applied in this priority (highest to lowest):

1. **Command-line flags** (e.g., `-q 80`)
2. **Configuration file** (set via this command)
3. **Built-in defaults** (quality: 75, recursive: false, overwrite: false)

Example:
```bash
# Config has quality: 85
bunx @zzclub/z-cli set -q 85

# This uses quality 70 (command-line flag overrides config)
bunx @zzclub/z-cli tiny -f image.jpg -q 70

# This uses quality 85 (from config)
bunx @zzclub/z-cli tiny -f image.jpg
```

## Resetting Individual Settings

To reset a specific setting to default without resetting everything:

```bash
# Reset quality to default (75)
bunx @zzclub/z-cli set -q 75

# Clear output directory
bunx @zzclub/z-cli set --output ""

# Disable recursive
bunx @zzclub/z-cli set --no-recursive

# Disable overwrite
bunx @zzclub/z-cli set --no-overwrite
```

For full reset, use: `bunx @zzclub/z-cli config --reset`
