import { consola, createConsola } from 'consola';
import type { ConsolaInstance } from 'consola';
import { colors } from 'consola/utils';

/**
 * 全局日志实例
 */
export const logger = consola;

/**
 * 创建带标签的日志实例
 */
export function createLogger(tag: string) {
  return createConsola({
    defaults: { tag },
  });
}

export class CliError extends Error {
  public readonly fix?: string[];
  public readonly details?: string[];
  public readonly cause?: unknown;

  constructor(message: string, options?: { fix?: string[]; details?: string[]; cause?: unknown }) {
    super(message);
    this.name = 'CliError';
    this.fix = options?.fix;
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

export function logJson(log: ConsolaInstance, data: unknown, title?: string): void {
  if (title) {
    log.info(title);
  }
  log.info(JSON.stringify(data, null, 2));
}

export function logStep(log: ConsolaInstance, current: number, total: number, message: string): void {
  log.info(`${colors.cyan(`[${current}/${total}]`)} ${message}`);
}

export function logSummary(log: ConsolaInstance, title: string, lines: string[]): void {
  log.box(`${colors.bold(title)}\n\n${lines.join('\n')}`);
}

export function logFatal(log: ConsolaInstance, error: unknown): void {
  const cliError = error instanceof CliError ? error : undefined;
  const message =
    cliError?.message ?? (error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error));

  const lines: string[] = [];
  lines.push(colors.red(colors.bold(message)));

  const details = cliError?.details ?? [];
  if (details.length > 0) {
    lines.push('', colors.yellow(colors.bold('DETAILS')));
    for (const line of details) {
      lines.push(`  - ${line}`);
    }
  }

  const fix = cliError?.fix ?? [];
  if (fix.length > 0) {
    lines.push('', colors.cyan(colors.bold('FIX')));
    for (const line of fix) {
      lines.push(`  ${formatFixLine(line)}`);
    }
  }

  log.error(lines.join('\n'));
}

function formatFixLine(line: string): string {
  const trimmed = line.trim();
  const isCommand = /^(z|zz|z-cli|bun|npm|npx|pnpm|yarn)\b/.test(trimmed) || trimmed.startsWith('export ');
  if (isCommand) {
    return colors.bold(colors.cyan(trimmed));
  }
  return trimmed;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 格式化压缩率
 */
export function formatCompressionRatio(ratio: number): string {
  return `${ratio.toFixed(1)}%`;
}
