# Agent Guidelines for @zzclub/z-cli

This document provides guidelines for AI coding agents working on the `@zzclub/z-cli` project.

## Project Overview

**@zzclub/z-cli** is an all-in-one CLI toolbox for enhancing daily workflow efficiency. It provides commands for i18n extraction, translation, image compression, and PicGo integration.

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js >= 18.18.0 (recommended: 20.18.1)
- **Type**: CLI tool using Commander.js
- **Package Manager**: pnpm (preferred), npm, or bun

## Build, Lint, and Test Commands

### Available Scripts

```bash
# Release commands (version bump + publish)
pnpm release              # Patch version bump
pnpm release:patch        # Same as above
pnpm release:minor        # Minor version bump
pnpm release:major        # Major version bump
pnpm release:main         # Release v1.0.0

# Manual testing (no test suite exists)
# Test commands by running them directly:
z <command> --help        # View command help
zz <command> [options]    # Test specific commands
```

### Testing Individual Commands

There is **no automated test suite**. Test commands manually:

```bash
# Test translate command
zz translate -f ./demo/test.js

# Test tiny command
zz tiny -f ./demo/demo3.jpeg -q 80

# Test i18n extraction
zz i18n -f ./demo/demo.vue

# Test picgo upload
zz picgo -f ./path/to/image.png
```

### Linting and Formatting

**No ESLint or Prettier configuration exists.** Follow the observed code style patterns.

## Code Style Guidelines

### Module System

- **ES Modules only** (`"type": "module"` in package.json)
- Use `.js` extension for all JavaScript files
- Import with explicit file extensions: `import { foo } from './bar.js'`

### Imports

**Standard import order:**

1. Node.js built-in modules (with `node:` prefix)
2. Third-party packages
3. Local utilities
4. Local command modules

```javascript
// Example from translate.js
import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import { translate } from "../translate-api/index.js";
import { readJsonFile } from "../utils/file.js";
import { writeFileContent, getLocalConfig } from "../utils/common.js";
import ora from "ora";
```

### File Naming

- **Commands**: `src/command/<name>.js` (lowercase, hyphenated if needed)
- **Utilities**: `src/utils/<name>.js` (lowercase)
- **APIs**: `src/<feature>-api/index.js` (hyphenated feature name)

### Code Conventions

#### Variable Naming

- **camelCase** for variables and functions: `filePath`, `getLocalConfig`
- **UPPER_CASE** for constants: (not commonly used in this codebase)
- Descriptive names: `statisticsCount`, `replaceMaps`, `file_spinner`

#### Functions

- Prefer `async/await` over Promise chains
- Use arrow functions for callbacks: `(option) => { ... }`
- Export named functions for commands: `export const translateCmd = { ... }`

```javascript
// Command structure pattern
export const commandName = {
  name: "command-name",
  alias: "short", // optional
  description: "What this command does",
  options: [
    {
      flags: "-f, --file <file>",
      description: "File to process",
      defaultValue: null,
    },
  ],
  action: async (option) => {
    // Command implementation
  },
};
```

#### Error Handling

- Use `try/catch` for async operations
- Use `ora` spinners for user feedback:
  - `spinner.succeed()` for success
  - `spinner.fail()` for errors
  - `spinner.warn()` for warnings
- Exit with `process.exit(1)` on fatal errors
- Provide clear error messages with `chalk` for colorization

```javascript
let spinner = ora();
try {
  spinner.start('Processing...');
  // operation
  spinner.succeed('Success message');
} catch (err) {
  spinner.fail('Error message: ' + err);
  process.exit(1);
}
```

#### User Interaction

- Use `ora` for loading indicators and status messages
- Use `chalk` for colored terminal output:
  - `chalk.red()` - errors, warnings
  - `chalk.green()` - success
  - `chalk.yellow()` / `chalk.yellowBright()` - highlights, filenames
- Use `inquirer` for interactive prompts (when needed)

### File Structure

```
src/
├── command/          # Command implementations
│   ├── index.js     # Command registration helpers
│   ├── translate.js
│   ├── tiny.js
│   ├── picgo.js
│   ├── i18n.js
│   ├── set.js
│   └── config.js
├── utils/           # Utility functions
│   ├── common.js    # Config, file writing, version checks
│   ├── file.js      # File operations
│   └── picgo.js     # PicGo HTTP client
├── translate-api/   # Translation API integration
│   ├── index.js
│   └── md5.js
├── config.json      # User config (gitignored)
├── config.default.json # Default config template
└── index.js         # CLI entry point (#!/usr/bin/env node)
```

## Architecture Patterns

### Command Registration

Commands follow a declarative pattern using `registerCommand()`:

```javascript
// In src/index.js
import { registerCommand, initProgram } from "./command/index.js";
import { translateCmd } from "./command/translate.js";

const program = new Command();

initProgram(program, async () => {
  await checkUpdate();
  registerCommand(program, translateCmd);
  program.parse(process.argv);
});
```

### Configuration Management

- Config stored in `~/.zzclub-z-cli/config.json` (user's home directory)
- Use `getLocalConfig()` to read config
- Use `setLocalConfig()` to update config
- Default config in `src/config.default.json`

```javascript
let config = await getLocalConfig();
let translateConfig = config.translate;
```

### Async Patterns

- Use `async/await` throughout
- Use `Promise` constructor only when wrapping callback-based APIs
- Synchronous recursion with async operations (see `execWorkerSync()` in translate.js)

### File Operations

- Use `fs` from `node:fs` (sync methods preferred for simplicity)
- Use `path` from `node:path` for path operations
- Use `process.cwd()` for resolving relative paths: `path.resolve(process.cwd(), filePath)`

## Common Utilities

### From `utils/common.js`

- `getLocalConfig()` - Read user config
- `setLocalConfig(newConfig, spinner)` - Update user config
- `writeFileContent(filePath, content, callback)` - Write file with spinner feedback
- `checkUpdate()` - Check for npm package updates (24h cache)
- `checkNodeVersion()` - Validate Node.js version
- `setHighLightStr(text, highlight, chalkFn)` - Highlight text in terminal

### From `utils/file.js`

- `readJsonFile(filePath)` - Parse JSON file (returns `{}` on error)
- `getFormatedFileSize(bytes)` - Human-readable file size
- `checkFileExist(filePath)` - Check if file exists and is a file
- `getFileInfo(filePath)` - Get file metadata
- `replaceFileContent(file, replaceMaps)` - Batch replace text in file

## Dependencies

### Core Dependencies

- **commander** (11.0.0) - CLI framework
- **inquirer** (9.2.8) - Interactive prompts
- **ora** (7.0.0) - Terminal spinners
- **chalk** (5.3.0) - Terminal colors
- **sharp** (0.33.0) - Image processing
- **shelljs** (0.8.5) - Shell commands
- **latest-version** (^9.0.0) - NPM version checking

## Important Notes

### Security Considerations

- Never commit sensitive data (appId, key) to git
- Config stored in user's home directory, not in project
- Validate user input for file paths to prevent directory traversal

### API Rate Limits

- Baidu Translate API has rate limits:
  - Standard: 1 QPS, 50K chars/month
  - Advanced: 10 QPS, 1M chars/month
- Translation batched in groups of 7 words per second (see `limitWords()`)

### Platform Compatibility

- Primarily developed for Node.js, but also supports Bun
- Uses `node:` prefix for built-in modules
- Cross-platform path handling with `path` module

## Development Workflow

1. **Adding a new command:**
   - Create `src/command/your-command.js`
   - Export command object with `name`, `description`, `options`, `action`
   - Import and register in `src/index.js`

2. **Adding a utility:**
   - Add to appropriate file in `src/utils/`
   - Use named exports
   - Document function purpose with comments

3. **Testing changes:**
   - Test manually with `z <command>` or `zz <command>`
   - Test with various option combinations
   - Verify error handling with invalid inputs

4. **Before releasing:**
   - Update CHANGELOG.md if using changelogen
   - Use `pnpm release` (patch), `pnpm release:minor`, or `pnpm release:major`
   - Changelogen handles version bump, git tag, push, and npm publish

## Common Pitfalls to Avoid

1. **Don't use** `require()` - this is an ES Module project
2. **Don't forget** file extensions in imports (`.js` required)
3. **Don't use** relative imports without `./` or `../`
4. **Don't hardcode** file paths - use `path.resolve()` and `process.cwd()`
5. **Don't suppress** spinner output - users need feedback
6. **Don't forget** to call `spinner.stop()` after operations
7. **Don't use** `eval()` except where already established (translate.js) - security risk
8. **Always validate** file existence before processing
9. **Always provide** clear error messages with context
10. **Always use** `chalk` for terminal output colorization

## Debugging Tips

- Add `console.log()` for debugging (no formal logging framework)
- Use `spinner.warn()` for non-fatal issues
- Check config with: `cat ~/.zzclub-z-cli/config.json`
- Test translation API separately before integrating
- Use `--help` flag to verify command registration

---

**Last Updated**: January 2026
**Maintainer**: aatrox
**Repository**: https://github.com/aatrooox/z-cli
