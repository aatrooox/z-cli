#!/usr/bin/env node

import { logger } from './core/logger.js';
import { Command } from 'commander';
import { registerConfig } from './cli/register-config.js';
import { registerSet } from './cli/register-set.js';
import { registerTiny } from './cli/register-tiny.js';
import { registerWx } from './cli/register-wx.js';
import { getBinName, getPackageVersion } from './cli/utils.js';

async function main() {
  const VERSION = getPackageVersion();
  const program = new Command();

  program
    .name(getBinName())
    .description('Agent-First CLI 工具集')
    .version(VERSION, '-v, --version', '显示版本信息')
    .helpOption('-h, --help', '显示帮助信息')
    .showHelpAfterError();

  registerTiny(program);
  registerSet(program);
  registerConfig(program);
  registerWx(program);

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
