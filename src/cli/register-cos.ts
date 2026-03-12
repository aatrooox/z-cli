import type { Command } from 'commander';
import { cosCommand } from '../commands/cos.js';
import { parseNonNegativeInteger } from './utils.js';

function applyCosCommonOptions(cmd: Command): Command {
  return cmd
    .option('--base-url <url>', 'COS STS 接口基础地址 (默认: https://zzao.club)')
    .option('--public-base-url <url>', '图片公网域名 (默认: https://img.zzao.club)')
    .option('--pat <token>', 'ZZCLUB_PAT (从 https://zzao.club 中获取的 PAT)')
    .option('--timeout <ms>', '请求超时 (毫秒)', parseNonNegativeInteger);
}

export function registerCos(program: Command): void {
  const cos = program.command('cos').description('腾讯云 COS 上传工具');

  applyCosCommonOptions(
    cos
      .command('upload')
      .description('上传一个或多个图片到 COS')
      .argument('<files...>', '图片文件路径，支持多个')
      .option('--folder <name>', 'COS 子目录名，例如 wechat')
      .option('--json', '输出 JSON 结果')
      .action(async (files, options, command) => {
        const parentOpts = (command?.parent as any)?.opts?.() || {};
        await cosCommand({
          action: 'upload',
          files,
          folder: options.folder ?? parentOpts.folder,
          baseUrl: options.baseUrl ?? parentOpts.baseUrl,
          publicBaseUrl: options.publicBaseUrl ?? parentOpts.publicBaseUrl,
          pat: options.pat ?? parentOpts.pat,
          json: options.json ?? parentOpts.json,
          timeout: options.timeout ?? parentOpts.timeout,
        });
      }),
  );

  cos.option('-a, --action <name>', '指定 action（兼容旧用法）');
  applyCosCommonOptions(cos);
  cos
    .option('--folder <name>', 'COS 子目录名，例如 wechat')
    .option('--json', '输出 JSON 结果')
    .argument('[files...]', '图片文件路径，支持多个')
    .action(async (files, options) => {
      const action = options.action as string | undefined;
      if (!action) {
        cos.help({ error: true });
      }
      await cosCommand({
        action,
        files,
        folder: options.folder,
        baseUrl: options.baseUrl,
        publicBaseUrl: options.publicBaseUrl,
        pat: options.pat,
        json: options.json,
        timeout: options.timeout,
      });
    });
}
