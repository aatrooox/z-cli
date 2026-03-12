import type { Command } from 'commander';
import { guiCommand } from '../commands/gui.js';

export function registerGui(program: Command): void {
  const gui = program.command('gui').description('桌面 GUI 自动化命令');

  gui
    .command('wechat')
    .description('调用本机微信 GUI 脚本发送消息')
    .requiredOption('--chat <name>', '目标聊天名称')
    .option('--message <text>', '消息内容')
    .option('--message-file <path>', '从文件读取消息内容')
    .option('--script <path>', '本机微信脚本路径（默认使用固定路径）')
    .option('--json', '输出机器可读 JSON')
    .action(async options => {
      await guiCommand({
        target: 'wechat',
        chat: options.chat,
        message: options.message,
        messageFile: options.messageFile,
        script: options.script,
        json: options.json,
      });
    });
}
