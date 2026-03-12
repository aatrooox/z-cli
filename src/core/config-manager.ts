import { homedir, platform } from 'node:os';
import { basename, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import type { GlobalConfig, WxAccountConfig, WxConfig } from '../types/config.js';
import {
  DEFAULT_CONFIG,
  DEFAULT_WX_ACCOUNT_CONFIG,
  DEFAULT_WX_ACCOUNT_NAME,
  CONFIG_DIR,
  CONFIG_FILE,
} from '../types/config.js';

/**
 * 配置管理器
 */
export class ConfigManager {
  private configPath: string;
  private config: GlobalConfig;

  constructor() {
    const configDir = this.getConfigDir();
    this.configPath = join(configDir, CONFIG_FILE);
    this.migrateLegacyConfig(configDir, this.configPath);
    
    // 确保配置目录存在
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // 加载配置
    this.config = this.load();
  }

  private getConfigDir(): string {
    const home = homedir();
    const currentPlatform = platform();

    if (currentPlatform === 'win32') {
      const appData = process.env.APPDATA;
      if (appData) {
        return join(appData, CONFIG_DIR);
      }
      return join(home, 'AppData', 'Roaming', CONFIG_DIR);
    }

    if (currentPlatform === 'darwin') {
      return join(home, 'Library', 'Application Support', CONFIG_DIR);
    }

    const xdgConfigHome = process.env.XDG_CONFIG_HOME;
    if (xdgConfigHome && xdgConfigHome.trim().length > 0) {
      return join(xdgConfigHome, CONFIG_DIR);
    }

    return join(home, '.config', CONFIG_DIR);
  }

  private migrateLegacyConfig(configDir: string, nextConfigPath: string): void {
    const legacyDir = join(homedir(), `.${CONFIG_DIR}`);
    const legacyPath = join(legacyDir, CONFIG_FILE);

    if (!existsSync(legacyPath) || existsSync(nextConfigPath)) {
      return;
    }

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    renameSync(legacyPath, nextConfigPath);

    if (existsSync(legacyDir) && basename(legacyDir) === `.${CONFIG_DIR}`) {
      try {
        rmSync(legacyDir, { recursive: true, force: true });
      } catch {
        return;
      }
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private normalizeWxAccount(value: unknown): WxAccountConfig {
    const source = this.isPlainObject(value) ? value : {};
    return {
      pat: typeof source.pat === 'string' ? source.pat : '',
      appId: typeof source.appId === 'string' ? source.appId : '',
      appSecret: typeof source.appSecret === 'string' ? source.appSecret : '',
    };
  }

  private normalizeWxConfig(value: unknown): { config: WxConfig; migrated: boolean } {
    const source = this.isPlainObject(value) ? value : {};
    const baseUrl = typeof source.baseUrl === 'string' && source.baseUrl.trim().length > 0
      ? source.baseUrl
      : DEFAULT_CONFIG.wx.baseUrl;
    const timeout = typeof source.timeout === 'number' && Number.isFinite(source.timeout) && source.timeout >= 0
      ? source.timeout
      : DEFAULT_CONFIG.wx.timeout;
    const defaultAccount = typeof source.defaultAccount === 'string' && source.defaultAccount.trim().length > 0
      ? source.defaultAccount.trim()
      : DEFAULT_WX_ACCOUNT_NAME;

    const accounts: Record<string, WxAccountConfig> = {};
    const rawAccounts = source.accounts;
    if (this.isPlainObject(rawAccounts)) {
      for (const [name, accountValue] of Object.entries(rawAccounts)) {
        const accountName = name.trim();
        if (!accountName) {
          continue;
        }
        accounts[accountName] = this.normalizeWxAccount(accountValue);
      }
    }

    const legacyHasFlatFields =
      typeof source.pat === 'string' ||
      typeof source.appId === 'string' ||
      typeof source.appSecret === 'string';

    const hadAnyAccounts = Object.keys(accounts).length > 0;
    const hadDefaultAccount = Boolean(accounts[defaultAccount]);

    if (legacyHasFlatFields || !hadAnyAccounts) {
      const legacyDefault = this.normalizeWxAccount(source);
      const currentDefault = accounts[defaultAccount] ?? { ...DEFAULT_WX_ACCOUNT_CONFIG };
      accounts[defaultAccount] = {
        pat: currentDefault.pat || legacyDefault.pat,
        appId: currentDefault.appId || legacyDefault.appId,
        appSecret: currentDefault.appSecret || legacyDefault.appSecret,
      };
    }

    if (!accounts[defaultAccount]) {
      accounts[defaultAccount] = { ...DEFAULT_WX_ACCOUNT_CONFIG };
    }

    const migrated =
      legacyHasFlatFields ||
      !this.isPlainObject(rawAccounts) ||
      !hadAnyAccounts ||
      !hadDefaultAccount ||
      typeof source.defaultAccount !== 'string' ||
      source.defaultAccount.trim().length === 0;

    return {
      config: {
        baseUrl,
        timeout,
        defaultAccount,
        accounts,
      },
      migrated,
    };
  }

  /**
   * 加载配置
   */
  private load(): GlobalConfig {
    if (!existsSync(this.configPath)) {
      // 首次运行，创建默认配置
      this.save(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const loadedConfig = JSON.parse(content) as Partial<GlobalConfig>;

      const normalizedWx = this.normalizeWxConfig(loadedConfig.wx);
      const normalizedConfig: GlobalConfig = {
        tiny: { ...DEFAULT_CONFIG.tiny, ...loadedConfig.tiny },
        wx: normalizedWx.config,
        apiEnv: { ...DEFAULT_CONFIG.apiEnv, ...loadedConfig.apiEnv },
      };

      if (normalizedWx.migrated) {
        this.save(normalizedConfig);
      }

      return normalizedConfig;
    } catch (error) {
      console.error(`配置文件解析失败，使用默认配置: ${error}`);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * 保存配置
   */
  private save(config: GlobalConfig): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`配置保存失败: ${error}`);
    }
  }

  /**
   * 获取完整配置
   */
  getConfig(): GlobalConfig {
    return this.config;
  }

  /**
   * 获取 Tiny 配置
   */
  getTinyConfig() {
    return this.config.tiny;
  }

  getWxConfig() {
    return this.config.wx;
  }

  /**
   * 更新 Tiny 配置
   */
  updateTinyConfig(updates: Partial<GlobalConfig['tiny']>): void {
    this.config.tiny = { ...this.config.tiny, ...updates };
    this.save(this.config);
  }

  updateWxConfig(updates: Partial<GlobalConfig['wx']>): void {
    this.config.wx = { ...this.config.wx, ...updates };
    this.save(this.config);
  }

  updateWxAccount(accountName: string, updates: Partial<WxAccountConfig>): void {
    const current = this.config.wx.accounts[accountName] ?? { ...DEFAULT_WX_ACCOUNT_CONFIG };
    this.config.wx.accounts = {
      ...this.config.wx.accounts,
      [accountName]: { ...current, ...updates },
    };
    this.save(this.config);
  }

  setDefaultWxAccount(accountName: string): void {
    this.config.wx.defaultAccount = accountName;
    if (!this.config.wx.accounts[accountName]) {
      this.config.wx.accounts = {
        ...this.config.wx.accounts,
        [accountName]: { ...DEFAULT_WX_ACCOUNT_CONFIG },
      };
    }
    this.save(this.config);
  }

  updateApiEnv(env: Record<string, string>): void {
    this.config.apiEnv = { ...env };
    this.save(this.config);
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = DEFAULT_CONFIG;
    this.save(this.config);
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }
}
