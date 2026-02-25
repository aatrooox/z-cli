import type { Command } from 'commander';
import { apiCommand } from '../commands/api.js';

export function registerApi(program: Command): void {
  program
    .command('api')
    .description('调用配置化 HTTP API（按 endpoint 名称加载配置）')
    .argument('<name>', 'endpoint 名称，对应 config/api/<name>.json')
    .option('--content <text>', '模板变量 content（与 {{content}} 对应）')
    .option('--content-file <path>', '从文件读取 content（优先级高于 --content）')
    .option('--photos <value>', '模板变量 photos（可为 JSON 或任意文本，与 {{photos}} 对应）')
    .option('--photos-file <path>', '从文件读取 photos（优先级高于 --photos）')
    .option(
      '--env <key=value>',
      '注入 env 变量（可重复），用于 {{env.KEY}} 模板渲染；优先级高于 z set --api 与 process.env',
      (value: string, prev: string[]) => {
        prev.push(value);
        return prev;
      },
      [],
    )
    .option('--dry-run', '仅渲染并打印最终请求，不发送请求')
    .option('--verbose', '打印更详细的调试信息')
    .action(async (name: string, options) => {
      await apiCommand({
        name,
        content: options.content,
        contentFile: options.contentFile,
        photos: options.photos,
        photosFile: options.photosFile,
        env: options.env,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    });
}
