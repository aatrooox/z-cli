#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { Command, InvalidArgumentError } from 'commander';
import { logger } from './core/logger.js';
import { tinyCommand } from './commands/tiny/index.js';
import { setCommand } from './commands/set.js';
import { configCommand } from './commands/config.js';
import { wxCommand } from './commands/wx.js';

function getPackageVersion(): string {
  try {
    const url = new URL('../package.json', import.meta.url);
    const raw = readFileSync(url, 'utf-8');
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

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new InvalidArgumentError(`Invalid number: ${value}`);
  }
  return parsed;
}

function parseNonNegativeInteger(value: string): number {
  const parsed = parseInteger(value);
  if (parsed < 0) {
    throw new InvalidArgumentError(`Invalid number: ${value}`);
  }
  return parsed;
}

function getBinName(): string {
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

function booleanOptionToUndefined(value: boolean, cmd: Command, optionName: string): boolean | undefined {
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

async function main() {
  const VERSION = getPackageVersion();
  const program = new Command();

  program
    .name(getBinName())
    .description('Agent-First CLI 工具集')
    .version(VERSION, '-v, --version', '显示版本信息')
    .helpOption('-h, --help', '显示帮助信息')
    .showHelpAfterError();

  program
    .command('tiny')
    .description('压缩图片文件')
    .option('-f, --file <path>', '要压缩的文件或目录路径')
    .option('-q, --quality <1-100>', '压缩质量 (默认: 配置值，初始 80)', parseInteger)
    .option('-r, --recursive', '递归处理目录')
    .option('-o, --overwrite', '覆盖原文件')
    .option('--output <dir>', '输出目录')
    .action(async (options, cmd) => {
      await tinyCommand({
        file: options.file,
        quality: options.quality,
        recursive: booleanOptionToUndefined(options.recursive, cmd, 'recursive'),
        overwrite: booleanOptionToUndefined(options.overwrite, cmd, 'overwrite'),
        output: options.output,
      });
    });

  program
    .command('set')
    .description('更新配置')
    .option('-q, --quality <1-100>', '设置默认压缩质量', parseInteger)
    .option('-r, --recursive', '设置默认递归选项')
    .option('-o, --overwrite', '设置默认覆盖选项')
    .option('--output <dir>', '设置默认输出目录')
    .option('--wx-base-url <url>', '设置微信接口基础地址')
    .option('--wx-pat <token>', '设置 ZZCLUB_PAT')
    .option('--wx-app-id <id>', '设置 WX_APPID')
    .option('--wx-app-secret <key>', '设置 WX_APPSECRET')
    .option('--wx-crypto-key <key>', '设置 NUXT_PUBLIC_CRYPTO_SECRET_KEY')
    .option('--wx-timeout <ms>', '设置微信请求超时(毫秒)', parseNonNegativeInteger)
    .action(async (options, cmd) => {
      await setCommand({
        quality: options.quality,
        recursive: booleanOptionToUndefined(options.recursive, cmd, 'recursive'),
        overwrite: booleanOptionToUndefined(options.overwrite, cmd, 'overwrite'),
        output: options.output,
        wxBaseUrl: options.wxBaseUrl,
        wxPat: options.wxPat,
        wxAppId: options.wxAppId,
        wxAppSecret: options.wxAppSecret,
        wxCryptoKey: options.wxCryptoKey,
        wxTimeout: options.wxTimeout,
      });
    });

  program
    .command('config')
    .description('查看或管理配置')
    .option('--path', '显示配置文件路径')
    .option('--reset', '重置配置为默认值')
    .action(async options => {
      await configCommand({
        reset: options.reset,
        path: options.path,
      });
    });

  program
  const wx = program.command('wx').description('微信草稿箱工作流');

  const applyWxCommonOptions = (cmd: Command): Command =>
    cmd
      .option('--base-url <url>', '接口基础地址 (默认: config.wx.baseUrl / https://zzao.club)')
      .option('--pat <token>', 'ZZCLUB_PAT (可用环境变量)')
      .option('--app-id <id>', 'WX_APPID (可用环境变量)')
      .option('--app-secret <secret>', 'WX_APPSECRET (可用环境变量)')
      .option('--crypto-key <key>', 'NUXT_PUBLIC_CRYPTO_SECRET_KEY (可用环境变量)')
      .option('--timeout <ms>', '请求超时 (毫秒)', parseNonNegativeInteger);

  applyWxCommonOptions(
    wx
      .command('token')
      .description('获取 access_token')
      .action(async options => {
        await wxCommand({
          action: 'token',
          baseUrl: options.baseUrl,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
          cryptoKey: options.cryptoKey,
          timeout: options.timeout,
        });
      }),
  );

  applyWxCommonOptions(
    wx
      .command('upload')
      .description('上传图片素材')
      .option('--photos <list>', '图片列表（逗号分隔或文件路径）')
      .action(async options => {
        await wxCommand({
          action: 'upload',
          baseUrl: options.baseUrl,
          photos: options.photos,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
          cryptoKey: options.cryptoKey,
          timeout: options.timeout,
        });
      }),
  );

  applyWxCommonOptions(
    wx
      .command('draft')
      .description('创建图文草稿(news)')
      .option('-t, --title <title>', '草稿标题')
      .option('--html <html>', 'HTML 内容（图文 draft）')
      .option('--html-file <path>', 'HTML 文件路径（图文 draft）')
      .option('--photos <list>', '图片列表（逗号分隔或文件路径）')
      .action(async options => {
        await wxCommand({
          action: 'draft',
          baseUrl: options.baseUrl,
          title: options.title,
          html: options.html,
          htmlFile: options.htmlFile,
          photos: options.photos,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
          cryptoKey: options.cryptoKey,
          timeout: options.timeout,
        });
      }),
  );

  applyWxCommonOptions(
    wx
      .command('newspic')
      .description('创建小绿书草稿(newspic)')
      .option('-t, --title <title>', '草稿标题')
      .option('--content <text>', '内容（newspic）')
      .option('--content-file <path>', '内容文件路径（newspic）')
      .option('--photos <list>', '图片列表（逗号分隔或文件路径）')
      .action(async options => {
        await wxCommand({
          action: 'newspic',
          baseUrl: options.baseUrl,
          title: options.title,
          content: options.content,
          contentFile: options.contentFile,
          photos: options.photos,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
          cryptoKey: options.cryptoKey,
          timeout: options.timeout,
        });
      }),
  );

  wx.option('-a, --action <name>', '指定 action（兼容旧用法）');
  applyWxCommonOptions(wx);
  wx
    .option('-t, --title <title>', '草稿标题')
    .option('--html <html>', 'HTML 内容（图文 draft）')
    .option('--html-file <path>', 'HTML 文件路径（图文 draft）')
    .option('--content <text>', '内容（newspic）')
    .option('--content-file <path>', '内容文件路径（newspic）')
    .option('--photos <list>', '图片列表（逗号分隔或文件路径）')
    .action(async options => {
      const action = options.action as string | undefined;
      if (!action) {
        wx.help({ error: true });
      }
      await wxCommand({
        action,
        baseUrl: options.baseUrl,
        title: options.title,
        html: options.html,
        htmlFile: options.htmlFile,
        content: options.content,
        contentFile: options.contentFile,
        photos: options.photos,
        pat: options.pat,
        appId: options.appId,
        appSecret: options.appSecret,
        cryptoKey: options.cryptoKey,
        timeout: options.timeout,
      });
    });

  if (process.argv.slice(2).length === 0) {
    program.help({ error: true });
  }

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error('未捕获的错误:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('未捕获的错误:', error);
  process.exit(1);
});
