import { ConfigManager } from '../core/config-manager.js';
import { createLogger, logJson } from '../core/logger.js';

export interface ConfigCliOptions {
  reset?: boolean;
  path?: boolean;
}

/**
 * Config 命令 - 查看或重置配置
 */
export async function configCommand(options: ConfigCliOptions): Promise<void> {
  try {
    const log = createLogger('config');
    const configManager = new ConfigManager();

    // 显示配置文件路径
    if (options.path) {
      log.info(`配置文件路径: ${configManager.getConfigPath()}`);
      process.exit(0);
    }

    // 重置配置
    if (options.reset) {
      configManager.reset();
      log.success('配置已重置为默认值');
      const config = configManager.getConfig();
      logJson(log, config, '当前配置:');
      process.exit(0);
    }

    // 显示当前配置
    const config = configManager.getConfig();
    logJson(log, config, '当前配置:');

    process.exit(0);
  } catch (error) {
    const log = createLogger('config');
    log.error(`配置操作失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
