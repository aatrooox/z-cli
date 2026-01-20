import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../core/logger.js';

export interface SetCliOptions {
  quality?: number;
  recursive?: boolean;
  overwrite?: boolean;
  output?: string;
}

/**
 * Set 命令 - 更新配置
 */
export async function setCommand(options: SetCliOptions): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const updates: any = {};

    if (options.quality !== undefined) {
      if (options.quality < 1 || options.quality > 100) {
        logger.error('压缩质量必须在 1-100 之间');
        process.exit(1);
      }
      updates.quality = options.quality;
    }

    if (options.recursive !== undefined) {
      updates.recursive = options.recursive;
    }

    if (options.overwrite !== undefined) {
      updates.overwrite = options.overwrite;
    }

    if (options.output !== undefined) {
      updates.outputDir = options.output;
    }

    if (Object.keys(updates).length === 0) {
      logger.warn('没有提供任何配置更新');
      process.exit(0);
    }

    configManager.updateTinyConfig(updates);
    logger.success('配置已更新');

    // 显示当前配置
    const config = configManager.getTinyConfig();
    logger.info('当前配置:');
    console.log(JSON.stringify(config, null, 2));

    process.exit(0);
  } catch (error) {
    logger.error(`配置更新失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
