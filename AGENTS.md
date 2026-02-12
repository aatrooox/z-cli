# Agent Guidelines for @zzclub/z-cli

This document provides guidelines for AI coding agents working on the `@zzclub/z-cli` project.

## Project Priority

**🔴 P0 - Critical Priority Project**

This project is classified as **P0 (highest priority)** because:

1. **Agent-First Interaction Model**: CLI is the optimal interface for AI Agent workflows. As Agent technology becomes mainstream, CLI tools serve as the primary touchpoint for human-agent collaboration.

2. **Automation Gateway**: This CLI will be integrated into all future automation workflows, serving as a bridge between Agent reasoning and system operations.

3. **Productivity Multiplier**: Direct CLI access enables Agents to perform complex operations (image compression, i18n management) without UI friction, dramatically increasing workflow efficiency.

4. **Extensibility Foundation**: As more Agent-compatible workflows are identified, they will be integrated into this CLI, making it the central command hub for zzclub's automation ecosystem.

**Strategic Goal**: Transform z-cli from a utility tool into the primary interface for Agent-driven development workflows.

## Project Overview

**@zzclub/z-cli** is a high-performance CLI toolbox built for Agent-driven workflows and daily efficiency enhancement. Currently focused on image compression with Sharp, designed for seamless integration into AI Agent automation pipelines.

- **Language**: TypeScript (compiled to ES Modules)
- **Runtime**: Node.js >= 18.18.0 | Bun >= 1.0.0 (primary development environment)
- **Package Manager**: Bun 1.3.7+ (locked via `packageManager` field)
- **Type**: Native CLI implementation with full TypeScript support
- **Framework**: Minimal CLI framework (Commander) for argument parsing + default help; the rest stays lightweight and native

## Build, Lint, and Test Commands

### Available Scripts

```bash
# Release commands (version bump + publish)
bun run release              # Patch version bump
bun run release:patch        # Same as above
bun run release:minor        # Minor version bump
bun run release:major        # Major version bump
bun run release:main         # Release v1.0.0

# Manual testing (no test suite exists)
# Test commands by running them directly:
z <command> --help        # View command help
zz <command> [options]    # Test specific commands
```

### Testing Individual Commands

There is **no automated test suite**. Test commands manually by running them directly with `z` or `zz` command.

### Linting and Formatting

**No ESLint or Prettier configuration exists.** Follow the observed code style patterns in existing TypeScript files.

## Key Architecture Decisions

### Technology Stack

- **TypeScript**: Full type safety, compile to ES Modules
- **Consola**: Unified logging (replaces ora/chalk patterns)
- **Sharp**: High-performance image processing
- **Commander**: Argument parsing + default help output (avoid hand-rolled argv/help)

### Project Structure

```
src/
├── commands/          # Command implementations
│   ├── config.ts      # Config viewing/management
│   ├── set.ts         # Config updates
│   └── tiny/          # Image compression module
├── core/              # Core utilities
│   ├── config-manager.ts
│   └── logger.ts
├── types/             # TypeScript type definitions
└── index.ts           # CLI entry point
```

### Configuration Management

- Config location:
  - Linux: `~/.config/zzclub-z-cli/config.json` (or `$XDG_CONFIG_HOME/zzclub-z-cli/config.json`)
  - macOS: `~/Library/Application Support/zzclub-z-cli/config.json`
  - Windows: `%APPDATA%\zzclub-z-cli\config.json`
- Default config: `config.default.json` at project root
- Access via `ConfigManager.load()` and `ConfigManager.save()`

## Development Principles

### Code Style

1. **ES Modules**: Use `.js` extensions in imports (TypeScript compiles to .js)
2. **Import Order**: Node.js built-ins → third-party → local modules
3. **Node.js Prefix**: Use `node:` prefix for built-ins (e.g., `import fs from 'node:fs'`)
4. **Type Safety**: Never use `as any` or `@ts-ignore`

### Error Handling

- Use `try/catch` for async operations
- Use Consola for user feedback (replaces ora spinners)
- Exit with `process.exit(1)` on fatal errors
- Always validate file paths to prevent directory traversal

### Testing Strategy

- Manual testing only (no automated test suite)
- Test commands directly: `zz tiny -f ./demo -r`
- Verify error handling with invalid inputs

### Skill Integration Policy (scripts → z-cli; skills = thin wrappers)

To stay consistent with the README's core idea (“move scripts into z-cli, keep Skills thin”), **all feature logic / automation scripts MUST live in z-cli as CLI commands**. Skills are only a lightweight description layer that tells an agent how to call those commands.

- Implement feature logic under `src/commands/` and register it in `src/index.ts`.
- Skills MUST NOT contain heavy scripting or duplicated implementations.
  - Skills should include: intent description + a few example invocations (prefer `bunx @zzclub/z-cli ...`) + minimal argument mapping when unavoidable.

### Skills Repo Sync Policy (MANDATORY)

When this project adds/changes requirements, commands, flags, outputs, or workflows, you MUST sync the corresponding docs in:

- `/root/code/zzclub/skills/z-cli`

Minimum required updates in the skills repo:

1. Create/update `references/<command>.md` for the command.
2. Update `SKILL.md` routing/links so agents can discover the new/changed command.
3. If config/defaults changed, update `references/config.md` and/or `references/set.md`.

After updating the skills repo, you MUST:

- auto-generate an appropriate commit message (follow the repo's `feat/docs/chore:` style)
- commit the changes in the skills repo
- push the commit to the remote (no force push)

---

- When adding new automation:
  1. Add/extend the CLI command in `src/commands/`.
  2. Ensure help/usage is clear via CLI `--help`.
  3. Update the corresponding skill references to show the new CLI invocation.

### Git Commit Habit

- Default: **one commit per fully completed requirement** (end-to-end, verified), unless the user explicitly asks for a different granularity (e.g. split commits, squash, or no commit).
- Do not create partial “WIP” commits in this repo.
- Always run `bun run type-check` (and `bun run build` when relevant) before committing.

## Common Pitfalls to Avoid

1. **Module System**: Never use `require()` - this is ES Modules only
2. **Import Extensions**: Always include `.js` in imports (compiled output)
3. **File Paths**: Use `path.resolve(process.cwd(), filePath)` for relative paths
4. **Security**: Validate all user input, especially file paths
5. **Dependencies**: Minimize new dependencies - prefer standard library

## Development Workflow

1. **Adding Commands**: Create in `src/commands/`, register in `src/index.ts`
2. **Testing**: Use `bun run dev` for development testing
3. **Type Checking**: Run `bun run type-check` before committing
4. **Releasing**: Use `bun run release:patch|minor|major` (automated via changelogen)

---

**Last Updated**: January 2026
**Maintainer**: aatrox
**Repository**: https://github.com/aatrooox/z-cli
