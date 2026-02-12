import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { Command } from 'commander';
import { InvalidArgumentError } from 'commander';

export function getPackageVersion(): string {
  try {
    const candidates = [
      new URL('../../../package.json', import.meta.url),
      new URL('../../package.json', import.meta.url),
    ];

    let raw: string | undefined;
    for (const url of candidates) {
      try {
        if (existsSync(url)) {
          raw = readFileSync(url, 'utf-8');
          break;
        }
      } catch {
      }
    }

    if (!raw) {
      return '0.0.0';
    }

    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || !parsed) {
      return '0.0.0';
    }

    const maybe = parsed as { version?: unknown };
    return typeof maybe.version === 'string' ? maybe.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new InvalidArgumentError(`Invalid number: ${value}`);
  }
  return parsed;
}

export function parseNonNegativeInteger(value: string): number {
  const parsed = parseInteger(value);
  if (parsed < 0) {
    throw new InvalidArgumentError(`Invalid number: ${value}`);
  }
  return parsed;
}

export function getBinName(): string {
  const argv1 = process.argv[1];
  if (!argv1) {
    return 'z';
  }
  const name = basename(argv1);
  if (name === 'z' || name === 'zz' || name === 'z-cli') {
    return name;
  }
  return 'z';
}

export function booleanOptionToUndefined(value: boolean, cmd: Command, optionName: string): boolean | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const source = cmd.getOptionValueSource(optionName);
    if (source !== 'cli') {
      return undefined;
    }
  } catch {
  }
  return true;
}
