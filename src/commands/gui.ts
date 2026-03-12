import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

import { CliError, createLogger, logFatal } from '../core/logger.js';

const DEFAULT_WECHAT_SCRIPT = '/Users/aatrox/.openclaw/workspace/wechat-automation/send_wechat.sh';

interface GuiCliOptions {
  target?: string;
  chat?: string;
  message?: string;
  messageFile?: string;
  script?: string;
  json?: boolean;
}

export async function guiCommand(options: GuiCliOptions): Promise<void> {
  const log = createLogger('gui');

  try {
    const target = options.target?.trim();
    if (!target) {
      throw new CliError('请提供 GUI 自动化目标', {
        details: ['当前可用目标: wechat'],
        fix: ['z gui wechat --help'],
      });
    }

    switch (target) {
      case 'wechat':
        await handleWechat(log, options);
        break;
      default:
        throw new CliError(`未知 GUI 自动化目标: ${target}`, {
          details: ['当前可用目标: wechat'],
          fix: ['z gui wechat --help'],
        });
    }

    process.exit(0);
  } catch (error) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(formatJsonError(error))}\n`);
    } else {
      logFatal(log, error);
    }
    process.exit(1);
  }
}

async function handleWechat(log: ReturnType<typeof createLogger>, options: GuiCliOptions): Promise<void> {
  const chat = requireNonEmpty('chat', options.chat, ['z gui wechat --chat "目标聊天" --message "消息内容"']);
  const message = await resolveMessage(options.message, options.messageFile);
  const scriptPath = options.script?.trim() || DEFAULT_WECHAT_SCRIPT;

  if (!existsSync(scriptPath)) {
    throw new CliError(`未找到本机微信脚本: ${scriptPath}`, {
      details: ['该命令依赖本机已有的 GUI 自动化脚本，不随 z-cli 分发'],
      fix: [`z gui wechat --chat "${chat}" --message "${previewMessage(message)}" --script /path/to/send_wechat.sh`],
    });
  }

  if (!options.json) {
    log.info(`调用本机微信脚本: ${scriptPath}`);
  }

  const result = await runWechatScript(scriptPath, chat, message);
  if (result.exitCode !== 0) {
    throw new CliError('微信 GUI 自动化发送失败', {
      details: compactLines([result.stderr, result.stdout]),
      fix: [
        '确认微信桌面版已登录且当前桌面可交互',
        '确认终端或宿主进程已授予“辅助功能”权限',
        '查看 /Users/aatrox/.openclaw/workspace/wechat-automation/send_wechat.log',
      ],
    });
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ok: true, target: 'wechat', chat, script: scriptPath })}\n`);
    return;
  }

  log.info(`已发送到聊天: ${chat}`);
}

function requireNonEmpty(name: string, value: string | undefined, fix: string[]): string {
  const resolved = value?.trim();
  if (!resolved) {
    throw new CliError(`缺少必要参数: ${name}`, { fix });
  }
  return resolved;
}

async function resolveMessage(direct?: string, filePath?: string): Promise<string> {
  if (filePath) {
    const { readFile } = await import('node:fs/promises');
    if (!existsSync(filePath)) {
      throw new CliError(`消息文件不存在: ${filePath}`);
    }
    const content = await readFile(filePath, 'utf-8');
    if (!content.trim()) {
      throw new CliError(`消息文件为空: ${filePath}`);
    }
    return content;
  }

  const message = direct ?? '';
  if (!message.trim()) {
    throw new CliError('缺少必要参数: message', {
      fix: [
        'z gui wechat --chat "目标聊天" --message "消息内容"',
        'z gui wechat --chat "目标聊天" --message-file /path/to/message.txt',
      ],
    });
  }
  return message;
}

function runWechatScript(scriptPath: string, chat: string, message: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(scriptPath, [chat, message], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', code => {
      resolve({ exitCode: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function compactLines(values: string[]): string[] {
  return values
    .flatMap(value => value.split('\n'))
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function previewMessage(message: string): string {
  return message.length > 16 ? `${message.slice(0, 16)}...` : message;
}

function formatJsonError(error: unknown): { ok: false; error: string; message: string } {
  if (error instanceof CliError) {
    return {
      ok: false,
      error: 'cli_error',
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      ok: false,
      error: 'unknown_error',
      message: error.message,
    };
  }

  return {
    ok: false,
    error: 'unknown_error',
    message: String(error),
  };
}
