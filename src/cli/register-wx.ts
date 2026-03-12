import type { Command } from 'commander';
import { wxCommand } from '../commands/wx.js';
import { parseNonNegativeInteger } from './utils.js';

function applyWxCommonOptions(cmd: Command): Command {
  return cmd
    .option('--account <name>', '微信账号名（默认使用 config.wx.defaultAccount）')
    .option('--base-url <url>', '接口基础地址 (默认: config.wx.baseUrl / https://zzao.club)')
    .option('--pat <token>', 'ZZCLUB_PAT (从 https://zzao.club 中获取的 PAT)')
    .option('--app-id <id>', 'WX_APPID (从公众号后台获取的 AppID)')
    .option('--app-secret <secret>', 'WX_APPSECRET (从公众号后台获取的 AppSecret)')
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
          account: options.account,
          baseUrl: options.baseUrl,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
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
          account: options.account,
          baseUrl: options.baseUrl,
          photos: options.photos,
          pat: options.pat,
          appId: options.appId,
          appSecret: options.appSecret,
          timeout: options.timeout,
        });
      }),
  );

  applyWxCommonOptions(
    wx
      .command('draft')
      .description('创建图文草稿(news)')
      .option('-t, --title <title>', '草稿标题')
      .option('--html <html>', '富文本 HTML 片段（字符串，将作为 content 直接写入公众号编辑器）')
      .option('--html-file <path>', '富文本 HTML 片段文件路径（内容将按字符串读取后写入公众号编辑器）')
      .option('--photos <list>', '图片列表（逗号分隔或文件路径）')
      // NOTE: commander 在父命令与子命令存在同名 option（例如 -t/--title）时，
      // 可能会把值解析到父命令上，导致这里的 options.title 为空。
      // 为兼容 `z wx -a draft -t ...` 与 `z wx draft -t ...` 两种写法，这里做一次回退合并。
      .action(async (options, command) => {
        const parentOpts = (command?.parent as any)?.opts?.() || {};
        await wxCommand({
          action: 'draft',
          account: options.account ?? parentOpts.account,
          baseUrl: options.baseUrl ?? parentOpts.baseUrl,
          title: options.title ?? parentOpts.title,
          html: options.html ?? parentOpts.html,
          htmlFile: options.htmlFile ?? parentOpts.htmlFile,
          photos: options.photos ?? parentOpts.photos,
          pat: options.pat ?? parentOpts.pat,
          appId: options.appId ?? parentOpts.appId,
          appSecret: options.appSecret ?? parentOpts.appSecret,
          timeout: options.timeout ?? parentOpts.timeout,
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
      .action(async (options, command) => {
        const parentOpts = (command?.parent as any)?.opts?.() || {};
        await wxCommand({
          action: 'newspic',
          account: options.account ?? parentOpts.account,
          baseUrl: options.baseUrl ?? parentOpts.baseUrl,
          title: options.title ?? parentOpts.title,
          content: options.content ?? parentOpts.content,
          contentFile: options.contentFile ?? parentOpts.contentFile,
          photos: options.photos ?? parentOpts.photos,
          pat: options.pat ?? parentOpts.pat,
          appId: options.appId ?? parentOpts.appId,
          appSecret: options.appSecret ?? parentOpts.appSecret,
          timeout: options.timeout ?? parentOpts.timeout,
        });
      }),
  );

  wx.option('-a, --action <name>', '指定 action（兼容旧用法）');
  applyWxCommonOptions(wx);
  wx
    .option('-t, --title <title>', '草稿标题')
    .option('--html <html>', '富文本 HTML 片段（字符串，将作为 content 直接写入公众号编辑器）')
    .option('--html-file <path>', '富文本 HTML 片段文件路径（内容将按字符串读取后写入公众号编辑器）')
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
        account: options.account,
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
        timeout: options.timeout,
      });
    });
}
