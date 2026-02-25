import { ConfigManager } from '../core/config-manager.js';
import { createLogger, logJson } from '../core/logger.js';

export interface SetCliOptions {
  quality?: number;
  recursive?: boolean;
  overwrite?: boolean;
  output?: string;
  wxBaseUrl?: string;
  wxPat?: string;
  wxAppId?: string;
  wxAppSecret?: string;
  wxTimeout?: number;
  apiEnv?: string[];
}

/**
 * Set 命令 - 更新配置
 */
export async function setCommand(options: SetCliOptions): Promise<void> {
  try {
    const log = createLogger('set');
    const configManager = new ConfigManager();
    const tinyUpdates: Record<string, unknown> = {};
    const wxUpdates: Record<string, unknown> = {};
    const apiUpdates: Record<string, string> = {};

    for (const raw of options.apiEnv ?? []) {
      const idx = raw.indexOf('=');
      if (idx <= 0) {
        log.error(`非法 --api: ${raw}（格式必须为 KEY=VALUE）`);
        process.exit(1);
      }
      const key = raw.slice(0, idx).trim();
      const value = raw.slice(idx + 1);
      if (!key) {
        log.error(`非法 --api: ${raw}（KEY 不能为空）`);
        process.exit(1);
      }
      apiUpdates[key] = value;
    }

    if (options.quality !== undefined) {
        if (options.quality < 1 || options.quality > 100) {
        log.error('压缩质量必须在 1-100 之间');
        process.exit(1);
      }
      tinyUpdates.quality = options.quality;
    }

    if (options.recursive !== undefined) {
      tinyUpdates.recursive = options.recursive;
    }

    if (options.overwrite !== undefined) {
      tinyUpdates.overwrite = options.overwrite;
    }

    if (options.output !== undefined) {
      tinyUpdates.outputDir = options.output;
    }

    if (options.wxBaseUrl !== undefined) {
      wxUpdates.baseUrl = options.wxBaseUrl;
    }

    if (options.wxPat !== undefined) {
      wxUpdates.pat = options.wxPat;
    }

    if (options.wxAppId !== undefined) {
      wxUpdates.appId = options.wxAppId;
    }

    if (options.wxAppSecret !== undefined) {
      wxUpdates.appSecret = options.wxAppSecret;
    }

    if (options.wxTimeout !== undefined) {
      if (options.wxTimeout < 0 || !Number.isFinite(options.wxTimeout)) {
        log.error('微信请求超时必须为非负数字');
        process.exit(1);
      }
      wxUpdates.timeout = options.wxTimeout;
    }

    if (Object.keys(tinyUpdates).length === 0 && Object.keys(wxUpdates).length === 0 && Object.keys(apiUpdates).length === 0) {
      log.warn('没有提供任何配置更新');
      process.exit(0);
    }

    if (Object.keys(tinyUpdates).length > 0) {
      configManager.updateTinyConfig(tinyUpdates);
    }

    if (Object.keys(wxUpdates).length > 0) {
      configManager.updateWxConfig(wxUpdates);
    }

    if (Object.keys(apiUpdates).length > 0) {
      const current = configManager.getConfig().apiEnv;
      configManager.updateApiEnv({ ...current, ...apiUpdates });
    }
    log.success('配置已更新');

    // 显示当前配置
    const config = configManager.getTinyConfig();
    const wxConfig = configManager.getWxConfig();
    const apiEnv = configManager.getConfig().apiEnv;
    logJson(log, { tiny: config, wx: wxConfig, apiEnv }, '当前配置:');

    process.exit(0);
  } catch (error) {
    const log = createLogger('set');
    log.error(`配置更新失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
