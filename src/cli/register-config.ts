import type { Command } from 'commander';
import { configCommand } from '../commands/config.js';

export function registerConfig(program: Command): void {
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
}
