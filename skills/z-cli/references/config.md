# config - Configuration Management Command

View and manage z-cli configuration settings.

## Basic Usage

```bash
bunx @zzclub/z-cli config [options]
```

## Options

| Flag | Description |
|------|-------------|
| (no flags) | Display current configuration in JSON format |
| `--path` | Show configuration file location |
| `--reset` | Reset configuration to default values |

## Configuration File Location

- **Linux**: `~/.config/zzclub-z-cli/config.json` (or `$XDG_CONFIG_HOME/zzclub-z-cli/config.json`)
- **macOS**: `~/Library/Application Support/zzclub-z-cli/config.json`
- **Windows**: `%APPDATA%\\zzclub-z-cli\\config.json`

## Usage Examples

### View Current Configuration

```bash
bunx @zzclub/z-cli config
```

**Output**:
```json
{
  "tiny": {
    "quality": 80,
    "recursive": false,
    "overwrite": false,
    "outputDir": null,
    "verbose": false
  }
}
```

### Show Config File Path

```bash
bunx @zzclub/z-cli config --path
```

**Output**:
```
Configuration file: /home/user/.config/zzclub-z-cli/config.json
```

### Reset to Defaults

```bash
bunx @zzclub/z-cli config --reset
```

**Confirm with user first**: "This will reset all settings to defaults. Continue?"

## Default Configuration

```json
{
  "tiny": {
    "quality": 80,
    "recursive": false,
    "overwrite": false,
    "outputDir": null,
    "verbose": false
  }
}
```

## Agent Workflow

### Viewing Configuration

When user asks "what are my current settings?":

1. Run `bunx @zzclub/z-cli config`
2. Parse JSON output
3. Present in readable format:
   ```
   Current z-cli settings:
   - Default quality: 80
   - Recursive processing: disabled
   - Overwrite originals: disabled
   - Default output directory: none
   ```

### Showing Config Path

When user asks "where is the config file?":

1. Run `bunx @zzclub/z-cli config --path`
2. Report the path
3. Optionally: "You can manually edit this file if needed"

### Resetting Configuration

When user asks to "reset settings" or "restore defaults":

1. **Confirm first**: "This will reset all settings to defaults. Continue?"
2. Wait for explicit confirmation
3. Run `bunx @zzclub/z-cli config --reset`
4. Report: "Configuration reset to defaults"
5. Show new config with `bunx @zzclub/z-cli config`

## Common Scenarios

### Check Before Using Defaults

```bash
# User runs tiny command without specifying quality
# Agent checks what the default quality is
bunx @zzclub/z-cli config
# Output shows: "quality": 80
# Agent: "I'll compress with quality 80 (your default setting)"
```

### Troubleshooting Unexpected Behavior

```bash
# User: "Why is it overwriting my files?"
# Agent checks config
bunx @zzclub/z-cli config
# Output shows: "overwrite": true
# Agent: "Your default is set to overwrite. Change with: bunx @zzclub/z-cli set --no-overwrite"
```

### Manual Configuration Edit

If user wants to manually edit config:

1. Show path: `bunx @zzclub/z-cli config --path`
2. Suggest: "Open this file in a text editor to modify settings"
3. Warn: "Ensure JSON syntax is valid after editing"

## Configuration Schema

```typescript
{
  tiny: {
    quality: number,      // 1-100, default: 80
    recursive: boolean,   // default: false
    overwrite: boolean,   // default: false
    outputDir: string | null,  // default: null
    verbose: boolean      // default: false
  }
}
```

## Notes

- Configuration persists across sessions
- Settings act as defaults when flags are not specified
- Command-line flags override configuration settings
- Invalid config file triggers fallback to defaults
