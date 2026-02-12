import { homedir, platform } from 'node:os';
import { basename, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import type { GlobalConfig } from '../types/config.js';
import { DEFAULT_CONFIG, CONFIG_DIR, CONFIG_FILE } from '../types/config.js';

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
      
      // 合并默认配置（处理新增字段）
      return {
        tiny: { ...DEFAULT_CONFIG.tiny, ...loadedConfig.tiny },
      };
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

  /**
   * 更新 Tiny 配置
   */
  updateTinyConfig(updates: Partial<GlobalConfig['tiny']>): void {
    this.config.tiny = { ...this.config.tiny, ...updates };
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
