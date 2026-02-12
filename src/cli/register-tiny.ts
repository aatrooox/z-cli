import type { Command } from 'commander';
import { tinyCommand } from '../commands/tiny/index.js';
import { booleanOptionToUndefined, parseInteger } from './utils.js';

export function registerTiny(program: Command): void {
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
}
