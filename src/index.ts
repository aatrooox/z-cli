#!/usr/bin/env node

import { logger } from './core/logger.js';
import { tinyCommand } from './commands/tiny/index.js';
import { setCommand } from './commands/set.js';
import { configCommand } from './commands/config.js';

const VERSION = '1.0.0';

interface ParsedArgs {
  command?: string;
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const command = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  const flags: Record<string, string | boolean> = {};

  for (let i = command ? 1 : 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        flags[key] = nextArg;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        flags[key] = nextArg;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }

  return { command, flags };
}

function showHelp(command?: string) {
  if (!command) {
    logger.info(`
z-cli v${VERSION} - 轻量级图片压缩工具

用法:
  z <command> [options]
  zz <command> [options]

命令:
  tiny          压缩图片文件
  set           更新配置
  config        查看或管理配置

选项:
  -h, --help    显示帮助信息
  -v, --version 显示版本信息

示例:
  z tiny -f ./image.jpg -q 80
  z set -q 90
  z config --path
`);
    return;
  }

  switch (command) {
    case 'tiny':
      logger.info(`
用法: z tiny [options]

选项:
  -f, --file <path>      要压缩的文件或目录路径 (必需)
  -q, --quality <1-100>  压缩质量 (默认: 75)
  -r, --recursive        递归处理目录
  -o, --overwrite        覆盖原文件
  --output <dir>         输出目录

示例:
  z tiny -f ./image.jpg -q 80
  z tiny -f ./images -r
  z tiny -f ./image.jpg -o
`);
      break;
    case 'set':
      logger.info(`
用法: z set [options]

选项:
  -q, --quality <1-100>  设置默认压缩质量
  -r, --recursive        设置默认递归选项
  -o, --overwrite        设置默认覆盖选项
  --output <dir>         设置默认输出目录

示例:
  z set -q 90
  z set -r
  z set --output ./compressed
`);
      break;
    case 'config':
      logger.info(`
用法: z config [options]

选项:
  --path         显示配置文件路径
  --reset        重置配置为默认值

示例:
  z config
  z config --path
  z config --reset
`);
      break;
    default:
      logger.error(`未知命令: ${command}`);
      showHelp();
  }
}

async function main() {
  const { command, flags } = parseArgs(process.argv);

  // 处理全局选项
  if (flags.h || flags.help) {
    showHelp(command);
    process.exit(0);
  }

  if (flags.v || flags.version) {
    logger.info(`v${VERSION}`);
    process.exit(0);
  }

  // 执行命令
  try {
    switch (command) {
      case 'tiny':
        await tinyCommand({
          file: (flags.f || flags.file) as string,
          quality: flags.q || flags.quality 
            ? parseInt((flags.q || flags.quality) as string, 10) 
            : undefined,
          recursive: Boolean(flags.r || flags.recursive),
          overwrite: Boolean(flags.o || flags.overwrite),
          output: flags.output as string | undefined,
        });
        break;

      case 'set':
        await setCommand({
          quality: flags.q || flags.quality 
            ? parseInt((flags.q || flags.quality) as string, 10) 
            : undefined,
          recursive: flags.r || flags.recursive ? Boolean(flags.r || flags.recursive) : undefined,
          overwrite: flags.o || flags.overwrite ? Boolean(flags.o || flags.overwrite) : undefined,
          output: flags.output as string | undefined,
        });
        break;

      case 'config':
        await configCommand({
          reset: Boolean(flags.reset),
          path: Boolean(flags.path),
        });
        break;

      default:
        if (!command) {
          showHelp();
        } else {
          logger.error(`未知命令: ${command}`);
          logger.info('运行 "z --help" 查看可用命令');
        }
        process.exit(1);
    }
  } catch (error) {
    logger.error('命令执行失败:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('未捕获的错误:', error);
  process.exit(1);
});
