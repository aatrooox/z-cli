import type { Command } from 'commander';
import { setCommand } from '../commands/set.js';
import { booleanOptionToUndefined, parseInteger, parseNonNegativeInteger } from './utils.js';

export function registerSet(program: Command): void {
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
        wxTimeout: options.wxTimeout,
      });
    });
}
