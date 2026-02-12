#!/usr/bin/env node

import { logger } from './core/logger.js';
import { tinyCommand } from './commands/tiny/index.js';
import { setCommand } from './commands/set.js';
import { configCommand } from './commands/config.js';
import { wxCommand } from './commands/wx.js';

const VERSION = '1.0.0';

interface ParsedArgs {
  command?: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let command: string | undefined;
  const positionalArgs: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) {
      continue;
    }
    
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
    } else {
      if (!command) {
        command = arg;
      } else {
        positionalArgs.push(arg);
      }
    }
  }

  return { command, args: positionalArgs, flags };
}

function showHelp(command?: string) {
  if (!command) {
    logger.info(`
z-cli v${VERSION} - Agent-First CLI 工具集

用法:
  z <command> [options]
  zz <command> [options]

命令:
  tiny          压缩图片文件
  set           更新配置
  config        查看或管理配置
  wx            微信草稿箱工作流

选项:
  -h, --help    显示帮助信息
  -v, --version 显示版本信息

示例:
  z tiny -f ./image.jpg -q 80
  z set -q 90
  z config --path
  z wx draft --title "标题" --html-file ./article.html
`);
    return;
  }

  switch (command) {
    case 'tiny':
      logger.info(`
用法: z tiny [options]

选项:
  -f, --file <path>      要压缩的文件或目录路径 (必需)
  -q, --quality <1-100>  压缩质量 (默认: 配置值，初始 80)
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
  --wx-base-url <url>    设置微信接口基础地址
  --wx-pat <token>       设置 ZZCLUB_PAT
  --wx-app-id <id>       设置 WX_APPID
  --wx-app-secret <key>  设置 WX_APPSECRET
  --wx-crypto-key <key>  设置 NUXT_PUBLIC_CRYPTO_SECRET_KEY
  --wx-timeout <ms>      设置微信请求超时(毫秒)

示例:
  z set -q 90
  z set -r
  z set --output ./compressed
  z set --wx-base-url https://zzao.club
  z set --wx-app-id XXX --wx-app-secret YYY --wx-pat ZZZ
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
    case 'wx':
      logger.info(`
用法: z wx <action> [options]

Action:
  token           获取 access_token
  upload          上传图片素材
  draft           创建图文草稿(news)
  newspic         创建小绿书草稿(newspic)

通用选项:
  -a, --action <name>        指定 action（可用位置参数）
  --base-url <url>           接口基础地址 (默认: config.wx.baseUrl / https://zzao.club)
  --pat <token>              ZZCLUB_PAT (可用环境变量)
  --app-id <id>              WX_APPID (可用环境变量)
  --app-secret <secret>      WX_APPSECRET (可用环境变量)
  --crypto-key <key>         NUXT_PUBLIC_CRYPTO_SECRET_KEY (可用环境变量)
  --timeout <ms>             请求超时 (毫秒)

配置优先级:
  命令行参数 > 环境变量 > config

草稿选项:
  -t, --title <title>        草稿标题
  --html <html>              HTML 内容（图文 draft）
  --html-file <path>         HTML 文件路径（图文 draft）
  --content <text>           内容（newspic）
  --content-file <path>      内容文件路径（newspic）
  --photos <list>            图片列表（逗号分隔或文件路径）

说明:
  未传 --photos 时会从 HTML/content 自动提取图片链接，无图片会报错

示例:
  z wx token
  z wx upload --photos ./a.jpg,https://example.com/b.png
  z wx draft --title "标题" --html-file ./article.html
  z wx newspic --title "标题" --content "正文" --photos ./a.jpg
`);
      break;
    default:
      logger.error(`未知命令: ${command}`);
      showHelp();
  }
}

async function main() {
  const { command, args, flags } = parseArgs(process.argv);

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
          wxBaseUrl: flags['wx-base-url'] as string | undefined,
          wxPat: flags['wx-pat'] as string | undefined,
          wxAppId: flags['wx-app-id'] as string | undefined,
          wxAppSecret: flags['wx-app-secret'] as string | undefined,
          wxCryptoKey: flags['wx-crypto-key'] as string | undefined,
          wxTimeout: flags['wx-timeout']
            ? parseInt(flags['wx-timeout'] as string, 10)
            : undefined,
        });
        break;

      case 'config':
        await configCommand({
          reset: Boolean(flags.reset),
          path: Boolean(flags.path),
        });
        break;
      case 'wx':
        await wxCommand({
          action: (flags.a || flags.action || args[0]) as string | undefined,
          baseUrl: flags['base-url'] as string | undefined,
          title: (flags.t || flags.title) as string | undefined,
          html: flags.html as string | undefined,
          htmlFile: flags['html-file'] as string | undefined,
          content: flags.content as string | undefined,
          contentFile: flags['content-file'] as string | undefined,
          photos: flags.photos as string | undefined,
          pat: flags.pat as string | undefined,
          appId: flags['app-id'] as string | undefined,
          appSecret: flags['app-secret'] as string | undefined,
          cryptoKey: flags['crypto-key'] as string | undefined,
          timeout: flags.timeout ? parseInt(flags.timeout as string, 10) : undefined,
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
