import { ConfigManager } from '../core/config-manager.js';
import { createLogger, logJson } from '../core/logger.js';

export interface SetCliOptions {
  quality?: number;
  recursive?: boolean;
  overwrite?: boolean;
  output?: string;
  wxAccount?: string;
  wxDefaultAccount?: string;
  wxBaseUrl?: string;
  wxPat?: string;
  wxAppId?: string;
  wxAppSecret?: string;
  wxTimeout?: number;
  apiEnv?: string[];
}

function normalizeWxAccountName(value: string, optionName: string): string {
  const account = value.trim();
  if (!account) {
    throw new Error(`${optionName} 不能为空`);
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(account)) {
    throw new Error(`${optionName} 非法: ${value}（仅允许字母、数字、下划线、点、连字符）`);
  }
  return account;
}

/**
 * Set 命令 - 更新配置
 */
export async function setCommand(options: SetCliOptions): Promise<void> {
  try {
    const log = createLogger('set');
    const configManager = new ConfigManager();
    const currentWxConfig = configManager.getWxConfig();
    const tinyUpdates: Record<string, unknown> = {};
    const wxGlobalUpdates: Record<string, unknown> = {};
    const wxAccountUpdates: Record<string, string> = {};
    const apiUpdates: Record<string, string> = {};
    const targetWxAccount = options.wxAccount
      ? normalizeWxAccountName(options.wxAccount, '--wx-account')
      : currentWxConfig.defaultAccount;
    const nextDefaultWxAccount = options.wxDefaultAccount
      ? normalizeWxAccountName(options.wxDefaultAccount, '--wx-default-account')
      : undefined;

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
      wxGlobalUpdates.baseUrl = options.wxBaseUrl;
    }

    if (options.wxPat !== undefined) {
      wxAccountUpdates.pat = options.wxPat;
    }

    if (options.wxAppId !== undefined) {
      wxAccountUpdates.appId = options.wxAppId;
    }

    if (options.wxAppSecret !== undefined) {
      wxAccountUpdates.appSecret = options.wxAppSecret;
    }

    if (options.wxTimeout !== undefined) {
      if (options.wxTimeout < 0 || !Number.isFinite(options.wxTimeout)) {
        log.error('微信请求超时必须为非负数字');
        process.exit(1);
      }
      wxGlobalUpdates.timeout = options.wxTimeout;
    }

    if (
      Object.keys(tinyUpdates).length === 0 &&
      Object.keys(wxGlobalUpdates).length === 0 &&
      Object.keys(wxAccountUpdates).length === 0 &&
      !nextDefaultWxAccount &&
      Object.keys(apiUpdates).length === 0
    ) {
      log.warn('没有提供任何配置更新');
      process.exit(0);
    }

    if (Object.keys(tinyUpdates).length > 0) {
      configManager.updateTinyConfig(tinyUpdates);
    }

    if (Object.keys(wxGlobalUpdates).length > 0) {
      configManager.updateWxConfig(wxGlobalUpdates);
    }

    if (Object.keys(wxAccountUpdates).length > 0) {
      configManager.updateWxAccount(targetWxAccount, wxAccountUpdates);
    }

    if (nextDefaultWxAccount) {
      if (!configManager.getWxConfig().accounts[nextDefaultWxAccount]) {
        log.error(`微信账号不存在: ${nextDefaultWxAccount}`);
        process.exit(1);
      }
      configManager.setDefaultWxAccount(nextDefaultWxAccount);
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
