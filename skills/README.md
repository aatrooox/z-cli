# Skills Directory

This directory contains OpenCode skills for AI agents to use the z-cli toolkit effectively.

## Available Skills

### z-cli

**Purpose**: Enable AI agents to efficiently compress and optimize images using @zzclub/z-cli.

**Location**: `z-cli.skill` (packaged skill file)

**Source**: `skills/z-cli/` (development directory)

## Using the Skill

### Installation

To install the skill for your AI agent:

```bash
# Copy the .skill file to your agent's skills directory
cp z-cli.skill ~/.agents/skills/
```

Or use the skill installation command if your agent supports it.

### Triggers

The skill activates when the agent detects:
- "compress image"
- "reduce image size"
- "optimize images"
- "batch process images"
- "shrink files"
- Any image file size reduction task

### What It Provides

1. **Command templates** for common scenarios (single file, batch, overwrite)
2. **Quality guidelines** for different use cases (web, email, archival)
3. **Safety rules** (never overwrite without confirmation)
4. **Error handling** patterns for common issues
5. **Detailed examples** for complex workflows (see references/EXAMPLES.md)

## Skill Structure

```
z-cli/
├── SKILL.md                      # Lightweight routing layer (2.5 KB)
└── references/                   # Command-specific documentation
    ├── tiny.md                   # Image compression command
    ├── config.md                 # Configuration viewing
    ├── set.md                    # Configuration updates
    └── common-patterns.md        # Reusable workflows
```

**Architecture**: SKILL.md acts as a router that directs agents to load specific reference files based on user intent. This modular design allows easy expansion when new commands are added.

## Development

### Rebuilding the Skill

After modifying the skill source in `skills/z-cli/`:

```bash
python3 /root/.agents/skills/skill-creator/scripts/package_skill.py \
  /root/code/zzclub/z-cli/skills/z-cli
```

This validates and packages the skill into `z-cli.skill`.

### Validation

The packaging script automatically validates:
- YAML frontmatter format
- Required fields (name, description)
- File organization
- Resource references

## More Information

- **Skill Creator Documentation**: See `/root/.agents/skills/skill-creator/SKILL.md`
- **z-cli Documentation**: See `readme.md` in project root
- **Agent Guidelines**: See `AGENTS.md` in project root
