import type { Command } from 'commander';
import { wxCommand } from '../commands/wx.js';
import { parseNonNegativeInteger } from './utils.js';

function applyWxCommonOptions(cmd: Command): Command {
  return cmd
    .option('--base-url <url>', '接口基础地址 (默认: config.wx.baseUrl / https://zzao.club)')
    .option('--pat <token>', 'ZZCLUB_PAT (可用环境变量)')
    .option('--app-id <id>', 'WX_APPID (可用环境变量)')
    .option('--app-secret <secret>', 'WX_APPSECRET (可用环境变量)')
    .option('--crypto-key <key>', 'NUXT_PUBLIC_CRYPTO_SECRET_KEY (可用环境变量)')
    .option('--timeout <ms>', '请求超时 (毫秒)', parseNonNegativeInteger);
}

export function registerWx(program: Command): void {
  const wx = program.command('wx').description('微信草稿箱工作流');

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
}
