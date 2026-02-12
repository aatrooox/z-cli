---
name: z-cli
description: Image compression and optimization using @zzclub/z-cli. Use when working with images that need compression, size reduction, or batch optimization. Triggers include "compress image", "reduce image size", "optimize images", "batch process images", or any task involving image file size reduction for web, email, or storage. Also handles CLI configuration management.
---

# z-cli

Provides access to `@zzclub/z-cli` commands for image processing and configuration management.

## Quick Start

All commands use `bunx @zzclub/z-cli` (no global installation required).

**Prerequisites**: Verify Bun is installed:
```bash
bun --version
```

If not available, guide user to install Bun first.

## Command Reference

Based on user intent, load the appropriate reference file:

### Image Compression (`tiny` command)
**When to use**: User wants to compress, optimize, or reduce image file sizes.

**Read**: [references/tiny.md](./references/tiny.md)

**Quick example**:
```bash
bunx @zzclub/z-cli tiny -f <path> -q <quality>
```

### Configuration Management (`config` command)
**When to use**: User wants to view, check, or reset CLI configuration.

**Read**: [references/config.md](./references/config.md)

**Quick example**:
```bash
bunx @zzclub/z-cli config
```

### Set Defaults (`set` command)
**When to use**: User wants to change default settings for compression quality, recursion, or output behavior.

**Read**: [references/set.md](./references/set.md)

**Quick example**:
```bash
bunx @zzclub/z-cli set -q 85
```

## Decision Tree

```
User request about images?
├─ Yes: Needs compression/optimization?
│  ├─ Yes → Load references/tiny.md
│  └─ No: About default settings?
│     ├─ Yes: Viewing config? → Load references/config.md
│     └─ No: Changing config? → Load references/set.md
└─ No: Configuration/settings related?
   └─ Yes → Load references/config.md or references/set.md
```

## General Guidelines

1. **Always validate paths** before executing commands
2. **Never use `-o` (overwrite) without explicit user confirmation**
3. **Use `--output` for batch operations** to preserve originals
4. **Report results clearly**: original size → compressed size, reduction %

## Supported Formats

- JPEG / JPG
- PNG
- WebP

## Common Patterns

For detailed examples and workflows, see [references/common-patterns.md](references/common-patterns.md).

---

**Adding new commands**: Create a new `references/<command>.md` file and add routing logic above.
