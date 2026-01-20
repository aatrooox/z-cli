/**
 * 全局配置接口
 */
export interface GlobalConfig {
  /** Tiny 命令配置 */
  tiny: TinyConfig;
}

/**
 * Tiny 命令配置
 */
export interface TinyConfig {
  /** 默认压缩质量 (1-100) */
  quality: number;
  /** 是否递归处理目录 */
  recursive: boolean;
  /** 是否覆盖原文件 */
  overwrite: boolean;
  /** 输出目录（为空则在原文件旁边生成） */
  outputDir: string | null;
  /** 是否显示详细日志 */
  verbose: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: GlobalConfig = {
  tiny: {
    quality: 80,
    recursive: false,
    overwrite: false,
    outputDir: null,
    verbose: false,
  },
};

/**
 * 配置文件路径
 */
export const CONFIG_DIR = '.zzclub-z-cli';
export const CONFIG_FILE = 'config.json';
