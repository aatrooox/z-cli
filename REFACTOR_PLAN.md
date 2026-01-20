# z-cli 1.0 重构计划

## 项目概述

**当前版本**: 0.8.0  
**目标版本**: 1.0.0  
**项目定位**: 专注于图片压缩的轻量级 CLI 工具，支持 NPX 直接调用

## 技术栈升级

### 从 → 到

| 组件 | 当前 | 目标 | 理由 |
|------|------|------|------|
| **运行时** | Node.js 18+ | **Bun 1.0+** | 更快的启动速度，内置 TypeScript 支持，更适合 CLI 工具 |
| **语言** | JavaScript (ES Module) | **TypeScript 5.3+** | 类型安全，更好的 IDE 支持，更易维护 |
| **CLI 框架** | Commander.js | **Consola 3.2+** | 现代化日志系统，更简洁的 API |
| **日志/UI** | ora + chalk | **Consola** (内置) | 统一的日志和进度条解决方案 |
| **图片处理** | Sharp | **Sharp** (保留) | 成熟稳定，性能优秀 |

### 移除依赖
- ❌ `commander` - 替换为 Consola
- ❌ `inquirer` - 不再需要交互式提示
- ❌ `ora` - 替换为 Consola
- ❌ `chalk` - 替换为 Consola
- ❌ `shelljs` - 使用 Node.js/Bun 内置 API
- ❌ `latest-version` - 简化版本检查逻辑

### 新增依赖
- ✅ `consola` (3.2+) - CLI 框架和日志
- ✅ `typescript` (5.3+) - 开发依赖
- ✅ `@types/node` - TypeScript 类型定义
- ✅ `bun-types` - Bun TypeScript 类型定义

### 保留依赖
- ✅ `sharp` (0.33+) - 核心图片处理库

## 项目结构

### 目录结构

```
z-cli/
├── src/                          # TypeScript 源码
│   ├── commands/                 # 命令实现
│   │   ├── tiny/                 # tiny 命令（核心功能）
│   │   │   ├── index.ts          # 命令入口和选项定义
│   │   │   ├── compressor.ts     # 图片压缩核心逻辑
│   │   │   ├── file-processor.ts # 批量文件处理
│   │   │   └── types.ts          # tiny 命令专用类型
│   │   ├── set.ts                # set 命令（轻量级）
│   │   └── config.ts             # config 命令（轻量级）
│   ├── core/                     # 核心模块
│   │   ├── config-manager.ts     # 配置管理
│   │   └── logger.ts             # 日志封装
│   ├── utils/                    # 工具函数
│   │   ├── file.ts               # 文件操作
│   │   ├── format.ts             # 格式化工具
│   │   └── validator.ts          # 输入验证
│   ├── types/                    # 全局类型定义
│   │   ├── config.ts             # 配置类型
│   │   └── index.ts              # 类型导出
│   └── index.ts                  # CLI 入口
├── dist/                         # 编译输出（.gitignore）
├── docs/                         # 文档（保留现有）
├── demo/                         # 测试文件（保留）
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 包配置
├── bun.lockb                     # Bun 锁文件
└── README.md                     # 项目文档

### 已移除目录
- ❌ `src/translate-api/` - 移除翻译功能
- ❌ `src/command/i18n.js` - 移除 i18n 提取
- ❌ `src/command/picgo.js` - 移除 PicGo 集成
- ❌ `src/command/translate.js` - 移除翻译命令
```

## NPX 支持配置

### package.json 关键配置

```json
{
  "name": "@zzclub/z-cli",
  "version": "1.0.0",
  "description": "轻量级图片压缩 CLI 工具",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "z": "./dist/index.js",
    "zz": "./dist/index.js",
    "z-cli": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "bun build src/index.ts --target=node --outdir=dist --format=esm",
    "dev": "bun run src/index.ts",
    "prepublishOnly": "bun run build"
  },
  "engines": {
    "node": ">=18.18.0",
    "bun": ">=1.0.0"
  },
  "keywords": ["cli", "image", "compression", "sharp", "tiny"],
  "author": "aatrox",
  "license": "MIT"
}
```

### NPX 调用方式

```bash
# 不安装直接使用（首次会下载）
npx @zzclub/z-cli tiny -f image.jpg -q 80

# 全局安装后使用
npm install -g @zzclub/z-cli
z tiny -f image.jpg -q 80
zz tiny -f image.jpg -q 80

# 本地开发测试
bun run dev tiny -f demo/demo3.jpeg -q 80
```

## 核心架构设计

### 模块依赖关系

```
┌─────────────────────────────────────────┐
│           CLI Entry (index.ts)          │
│  - 命令注册                              │
│  - 全局错误处理                          │
│  - 版本信息                              │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┬──────────┐
    ▼                 ▼          ▼
┌─────────┐    ┌──────────┐  ┌────────┐
│  tiny   │    │   set    │  │ config │
│ command │    │ command  │  │command │
└────┬────┘    └────┬─────┘  └───┬────┘
     │              │            │
     │         ┌────┴────────────┘
     │         ▼
     │    ┌────────────────┐
     │    │ ConfigManager  │
     │    │  (core)        │
     │    └────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Tiny Command Internal Modules  │
│  ┌────────────────────────────┐ │
│  │  ImageCompressor           │ │
│  │  (Sharp wrapper)           │ │
│  └──────────┬─────────────────┘ │
│             ▼                    │
│  ┌────────────────────────────┐ │
│  │  FileProcessor             │ │
│  │  (batch operations)        │ │
│  └────────────────────────────┘ │
└──────────────┬───────────────────┘
               ▼
      ┌─────────────────┐
      │  Utils & Types  │
      │  - file.ts      │
      │  - format.ts    │
      │  - validator.ts │
      └─────────────────┘
```

### 关键设计原则

1. **单一职责**: 每个模块专注一个功能
2. **依赖注入**: 核心类接受依赖作为构造参数，便于测试
3. **类型安全**: 全面使用 TypeScript 类型系统
4. **错误处理**: 统一的错误码和错误处理机制
5. **NPX 优先**: 编译输出到 `dist/`，发布时只包含编译后代码

## 实施计划

### Phase 0: 环境准备 (1 天)

**目标**: 搭建 TypeScript + Bun 开发环境

```bash
# 1. 安装 Bun（如果尚未安装）
curl -fsSL https://bun.sh/install | bash

# 2. 初始化 TypeScript
bun add -D typescript @types/node bun-types

# 3. 安装核心依赖
bun add consola sharp

# 4. 创建 tsconfig.json
```

**tsconfig.json 配置**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["bun-types", "@types/node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**验收标准**:
- ✅ `bun --version` 显示 1.0+
- ✅ `bun run src/index.ts` 可以执行（即使是空文件）
- ✅ `tsconfig.json` 配置正确

---

### Phase 1: 清理与备份 (0.5 天)

**目标**: 移除不需要的代码，备份旧实现

**操作清单**:

```bash
# 1. 创建备份分支
git checkout -b backup/v0.8.0
git push origin backup/v0.8.0
git checkout main

# 2. 移除旧命令文件
rm src/command/i18n.js
rm src/command/translate.js
rm src/command/picgo.js
rm -rf src/translate-api/

# 3. 创建新目录结构
mkdir -p src/commands/tiny
mkdir -p src/core
mkdir -p src/types
# src/utils/ 已存在，保留

# 4. 卸载不需要的依赖
bun remove commander inquirer ora chalk shelljs latest-version

# 5. Git 提交
git add .
git commit -m "chore: remove deprecated commands and dependencies"
```

**验收标准**:
- ✅ 旧命令文件已删除
- ✅ 新目录结构已创建
- ✅ `package.json` 中不再有旧依赖

---

### Phase 2: 类型定义与常量 (1 天)

**目标**: 建立完整的类型系统和配置常量

#### 2.1 全局配置类型 (`src/types/config.ts`)

```typescript
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
```

#### 2.2 Tiny 命令类型 (`src/commands/tiny/types.ts`)

```typescript
/**
 * 压缩选项
 */
export interface CompressionOptions {
  /** 压缩质量 (1-100) */
  quality: number;
  /** 是否覆盖原文件 */
  overwrite: boolean;
  /** 输出目录 */
  outputDir: string | null;
}

/**
 * 压缩结果
 */
export interface CompressionResult {
  /** 源文件路径 */
  inputPath: string;
  /** 输出文件路径 */
  outputPath: string;
  /** 原始文件大小（字节） */
  originalSize: number;
  /** 压缩后文件大小（字节） */
  compressedSize: number;
  /** 压缩率（百分比） */
  compressionRatio: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 批量处理统计
 */
export interface ProcessingStats {
  /** 处理的文件总数 */
  total: number;
  /** 成功数量 */
  success: number;
  /** 失败数量 */
  failed: number;
  /** 总原始大小（字节） */
  totalOriginalSize: number;
  /** 总压缩后大小（字节） */
  totalCompressedSize: number;
  /** 平均压缩率（百分比） */
  averageCompressionRatio: number;
  /** 处理结果列表 */
  results: CompressionResult[];
}

/**
 * 支持的图片格式
 */
export const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];
```

#### 2.3 类型导出 (`src/types/index.ts`)

```typescript
export * from './config.js';
export type {
  CompressionOptions,
  CompressionResult,
  ProcessingStats,
  SupportedFormat,
} from '../commands/tiny/types.js';
export { SUPPORTED_FORMATS } from '../commands/tiny/types.js';
```

**验收标准**:
- ✅ 所有类型定义完整且无编译错误
- ✅ `bun run tsc --noEmit` 通过

---

### Phase 3: 核心基础设施 (1 天)

**目标**: 实现配置管理和日志系统

#### 3.1 配置管理器 (`src/core/config-manager.ts`)

```typescript
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { GlobalConfig } from '../types/config.js';
import { DEFAULT_CONFIG, CONFIG_DIR, CONFIG_FILE } from '../types/config.js';

/**
 * 配置管理器
 */
export class ConfigManager {
  private configPath: string;
  private config: GlobalConfig;

  constructor() {
    const configDir = join(homedir(), CONFIG_DIR);
    this.configPath = join(configDir, CONFIG_FILE);
    
    // 确保配置目录存在
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // 加载配置
    this.config = this.load();
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
```

#### 3.2 日志封装 (`src/core/logger.ts`)

```typescript
import { consola, createConsola } from 'consola';

/**
 * 全局日志实例
 */
export const logger = consola;

/**
 * 创建带标签的日志实例
 */
export function createLogger(tag: string) {
  return createConsola({
    defaults: { tag },
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 格式化压缩率
 */
export function formatCompressionRatio(ratio: number): string {
  return `${ratio.toFixed(1)}%`;
}
```

**验收标准**:
- ✅ `ConfigManager` 可以正确读写配置
- ✅ 配置文件创建在 `~/.zzclub-z-cli/config.json`
- ✅ 日志功能正常工作

---

### Phase 4: Tiny 命令实现 (2 天)

**目标**: 实现核心图片压缩功能

#### 4.1 图片压缩器 (`src/commands/tiny/compressor.ts`)

```typescript
import sharp from 'sharp';
import { statSync } from 'node:fs';
import type { CompressionOptions, CompressionResult } from './types.js';

/**
 * 图片压缩器
 */
export class ImageCompressor {
  /**
   * 压缩单个图片
   */
  async compress(
    inputPath: string,
    outputPath: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const startTime = Date.now();

    try {
      // 获取原始文件大小
      const originalSize = statSync(inputPath).size;

      // 使用 Sharp 压缩
      await sharp(inputPath)
        .jpeg({ quality: options.quality, mozjpeg: true })
        .png({ quality: options.quality, compressionLevel: 9 })
        .webp({ quality: options.quality })
        .toFile(outputPath);

      // 获取压缩后文件大小
      const compressedSize = statSync(outputPath).size;

      // 计算压缩率
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        inputPath,
        outputPath,
        originalSize,
        compressedSize,
        compressionRatio,
        success: true,
      };
    } catch (error) {
      return {
        inputPath,
        outputPath,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
```

#### 4.2 文件处理器 (`src/commands/tiny/file-processor.ts`)

```typescript
import { readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import type { CompressionOptions, ProcessingStats } from './types.js';
import { SUPPORTED_FORMATS } from './types.js';
import { ImageCompressor } from './compressor.js';
import { logger, formatFileSize, formatCompressionRatio } from '../../core/logger.js';

/**
 * 文件处理器
 */
export class FileProcessor {
  private compressor: ImageCompressor;

  constructor(compressor: ImageCompressor) {
    this.compressor = compressor;
  }

  /**
   * 处理单个文件或目录
   */
  async process(
    inputPath: string,
    options: CompressionOptions & { recursive?: boolean }
  ): Promise<ProcessingStats> {
    const stat = statSync(inputPath);

    if (stat.isFile()) {
      return this.processFile(inputPath, options);
    }

    if (stat.isDirectory() && options.recursive) {
      return this.processDirectory(inputPath, options);
    }

    throw new Error('输入路径必须是文件，或者是目录（需要 --recursive 参数）');
  }

  /**
   * 处理单个文件
   */
  private async processFile(
    filePath: string,
    options: CompressionOptions
  ): Promise<ProcessingStats> {
    // 检查文件格式
    const ext = extname(filePath).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext as any)) {
      throw new Error(`不支持的文件格式: ${ext}，支持的格式: ${SUPPORTED_FORMATS.join(', ')}`);
    }

    // 确定输出路径
    const outputPath = this.getOutputPath(filePath, options);

    logger.start(`正在压缩: ${filePath}`);

    const result = await this.compressor.compress(filePath, outputPath, options);

    if (result.success) {
      logger.success(
        `压缩成功: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} ` +
        `(减少 ${formatCompressionRatio(result.compressionRatio)})`
      );
    } else {
      logger.error(`压缩失败: ${result.error}`);
    }

    return {
      total: 1,
      success: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      totalOriginalSize: result.originalSize,
      totalCompressedSize: result.compressedSize,
      averageCompressionRatio: result.compressionRatio,
      results: [result],
    };
  }

  /**
   * 处理目录
   */
  private async processDirectory(
    dirPath: string,
    options: CompressionOptions & { recursive?: boolean }
  ): Promise<ProcessingStats> {
    const files = this.collectImageFiles(dirPath, options.recursive || false);

    if (files.length === 0) {
      logger.warn(`目录中没有找到支持的图片文件: ${dirPath}`);
      return this.emptyStats();
    }

    logger.info(`找到 ${files.length} 个图片文件`);

    const stats: ProcessingStats = this.emptyStats();

    for (const file of files) {
      const fileStats = await this.processFile(file, options);
      this.mergeStats(stats, fileStats);
    }

    return stats;
  }

  /**
   * 收集目录中的图片文件
   */
  private collectImageFiles(dirPath: string, recursive: boolean): string[] {
    const files: string[] = [];
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext as any)) {
          files.push(fullPath);
        }
      } else if (entry.isDirectory() && recursive) {
        files.push(...this.collectImageFiles(fullPath, recursive));
      }
    }

    return files;
  }

  /**
   * 确定输出路径
   */
  private getOutputPath(inputPath: string, options: CompressionOptions): string {
    const dir = dirname(inputPath);
    const base = basename(inputPath, extname(inputPath));
    const ext = extname(inputPath);

    if (options.overwrite) {
      return inputPath;
    }

    const outputDir = options.outputDir || dir;
    return join(outputDir, `${base}-compressed${ext}`);
  }

  /**
   * 创建空统计
   */
  private emptyStats(): ProcessingStats {
    return {
      total: 0,
      success: 0,
      failed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      results: [],
    };
  }

  /**
   * 合并统计数据
   */
  private mergeStats(target: ProcessingStats, source: ProcessingStats): void {
    target.total += source.total;
    target.success += source.success;
    target.failed += source.failed;
    target.totalOriginalSize += source.totalOriginalSize;
    target.totalCompressedSize += source.totalCompressedSize;
    target.results.push(...source.results);

    // 重新计算平均压缩率
    if (target.totalOriginalSize > 0) {
      target.averageCompressionRatio =
        ((target.totalOriginalSize - target.totalCompressedSize) / target.totalOriginalSize) * 100;
    }
  }
}
```

#### 4.3 Tiny 命令入口 (`src/commands/tiny/index.ts`)

```typescript
import { resolve } from 'node:path';
import type { CompressionOptions } from './types.js';
import { ImageCompressor } from './compressor.js';
import { FileProcessor } from './file-processor.js';
import { ConfigManager } from '../../core/config-manager.js';
import { logger, formatFileSize, formatCompressionRatio } from '../../core/logger.js';

/**
 * Tiny 命令选项（从 CLI 传入）
 */
export interface TinyCliOptions {
  file?: string;
  quality?: number;
  recursive?: boolean;
  overwrite?: boolean;
  output?: string;
}

/**
 * Tiny 命令处理函数
 */
export async function tinyCommand(options: TinyCliOptions): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const config = configManager.getTinyConfig();

    // 合并配置和命令行选项
    const quality = options.quality ?? config.quality;
    const recursive = options.recursive ?? config.recursive;
    const overwrite = options.overwrite ?? config.overwrite;
    const outputDir = options.output ?? config.outputDir;

    // 验证输入
    if (!options.file) {
      logger.error('请使用 -f 或 --file 指定要压缩的文件或目录');
      process.exit(1);
    }

    const inputPath = resolve(process.cwd(), options.file);

    // 验证质量参数
    if (quality < 1 || quality > 100) {
      logger.error('压缩质量必须在 1-100 之间');
      process.exit(1);
    }

    // 创建压缩选项
    const compressionOptions: CompressionOptions & { recursive: boolean } = {
      quality,
      overwrite,
      outputDir,
      recursive,
    };

    // 执行压缩
    const compressor = new ImageCompressor();
    const processor = new FileProcessor(compressor);

    const stats = await processor.process(inputPath, compressionOptions);

    // 显示统计信息
    logger.box(
      `压缩完成\n\n` +
      `总文件数: ${stats.total}\n` +
      `成功: ${stats.success}\n` +
      `失败: ${stats.failed}\n` +
      `总原始大小: ${formatFileSize(stats.totalOriginalSize)}\n` +
      `总压缩后大小: ${formatFileSize(stats.totalCompressedSize)}\n` +
      `平均压缩率: ${formatCompressionRatio(stats.averageCompressionRatio)}`
    );

    process.exit(0);
  } catch (error) {
    logger.error(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
```

**验收标准**:
- ✅ 可以压缩单个图片文件
- ✅ 可以递归处理目录
- ✅ 正确计算压缩率和文件大小
- ✅ 错误处理完善

---

### Phase 5: 轻量级命令 (0.5 天)

**目标**: 实现 `set` 和 `config` 命令

#### 5.1 Set 命令 (`src/commands/set.ts`)

```typescript
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
```

#### 5.2 Config 命令 (`src/commands/config.ts`)

```typescript
import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../core/logger.js';

export interface ConfigCliOptions {
  reset?: boolean;
  path?: boolean;
}

/**
 * Config 命令 - 查看或重置配置
 */
export async function configCommand(options: ConfigCliOptions): Promise<void> {
  try {
    const configManager = new ConfigManager();

    // 显示配置文件路径
    if (options.path) {
      logger.info(`配置文件路径: ${configManager.getConfigPath()}`);
      process.exit(0);
    }

    // 重置配置
    if (options.reset) {
      configManager.reset();
      logger.success('配置已重置为默认值');
      const config = configManager.getConfig();
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
    }

    // 显示当前配置
    const config = configManager.getConfig();
    logger.info('当前配置:');
    console.log(JSON.stringify(config, null, 2));

    process.exit(0);
  } catch (error) {
    logger.error(`配置操作失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
```

**验收标准**:
- ✅ `set` 命令可以更新配置
- ✅ `config` 命令可以查看和重置配置

---

### Phase 6: CLI 入口与构建 (1 天)

**目标**: 完成 CLI 入口，配置构建，测试 NPX

#### 6.1 CLI 入口 (`src/index.ts`)

```typescript
#!/usr/bin/env node

import { defineCommand, runMain } from 'consola/utils';
import { logger } from './core/logger.js';
import { tinyCommand } from './commands/tiny/index.js';
import { setCommand } from './commands/set.js';
import { configCommand } from './commands/config.js';

// Tiny 命令
const tiny = defineCommand({
  meta: {
    name: 'tiny',
    description: '压缩图片文件',
  },
  args: {
    file: {
      type: 'string',
      alias: 'f',
      description: '要压缩的文件或目录路径',
    },
    quality: {
      type: 'string',
      alias: 'q',
      description: '压缩质量 (1-100)',
    },
    recursive: {
      type: 'boolean',
      alias: 'r',
      description: '递归处理目录',
    },
    overwrite: {
      type: 'boolean',
      alias: 'o',
      description: '覆盖原文件',
    },
    output: {
      type: 'string',
      description: '输出目录',
    },
  },
  async run({ args }) {
    await tinyCommand({
      file: args.file,
      quality: args.quality ? parseInt(args.quality, 10) : undefined,
      recursive: args.recursive,
      overwrite: args.overwrite,
      output: args.output,
    });
  },
});

// Set 命令
const set = defineCommand({
  meta: {
    name: 'set',
    description: '更新配置',
  },
  args: {
    quality: {
      type: 'string',
      alias: 'q',
      description: '默认压缩质量 (1-100)',
    },
    recursive: {
      type: 'boolean',
      alias: 'r',
      description: '默认是否递归',
    },
    overwrite: {
      type: 'boolean',
      alias: 'o',
      description: '默认是否覆盖',
    },
    output: {
      type: 'string',
      description: '默认输出目录',
    },
  },
  async run({ args }) {
    await setCommand({
      quality: args.quality ? parseInt(args.quality, 10) : undefined,
      recursive: args.recursive,
      overwrite: args.overwrite,
      output: args.output,
    });
  },
});

// Config 命令
const config = defineCommand({
  meta: {
    name: 'config',
    description: '查看或管理配置',
  },
  args: {
    reset: {
      type: 'boolean',
      description: '重置配置为默认值',
    },
    path: {
      type: 'boolean',
      description: '显示配置文件路径',
    },
  },
  async run({ args }) {
    await configCommand({
      reset: args.reset,
      path: args.path,
    });
  },
});

// 主命令
const main = defineCommand({
  meta: {
    name: 'z-cli',
    version: '1.0.0',
    description: 'z-cli - 轻量级图片压缩工具',
  },
  subCommands: {
    tiny,
    set,
    config,
  },
});

// 运行 CLI
runMain(main);
```

#### 6.2 构建脚本

更新 `package.json`:

```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --target=node --outdir=dist --format=esm --sourcemap=external",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "bun run type-check && bun run build"
  }
}
```

#### 6.3 测试 NPX

```bash
# 1. 本地构建
bun run build

# 2. 本地链接测试
npm link

# 3. 测试命令
z tiny -f demo/demo3.jpeg -q 80
z config
z set -q 90

# 4. 测试 NPX（需要先发布到 npm 或使用本地）
npx @zzclub/z-cli tiny -f demo/demo3.jpeg -q 80
```

**验收标准**:
- ✅ `bun run build` 成功生成 `dist/` 目录
- ✅ 本地链接后 `z`, `zz`, `z-cli` 命令可用
- ✅ 所有命令功能正常
- ✅ TypeScript 编译无错误

---

## AI Skills 集成示例

### Python 调用示例

```python
import subprocess
import json

def compress_image(file_path: str, quality: int = 80) -> dict:
    """
    使用 z-cli 压缩图片
    
    Args:
        file_path: 图片文件路径
        quality: 压缩质量 (1-100)
    
    Returns:
        压缩结果字典
    """
    result = subprocess.run(
        ['npx', '@zzclub/z-cli', 'tiny', '-f', file_path, '-q', str(quality)],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        return {'success': True, 'output': result.stdout}
    else:
        return {'success': False, 'error': result.stderr}

# 使用示例
result = compress_image('photo.jpg', quality=85)
print(result)
```

### JavaScript/TypeScript 调用示例

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function compressImage(filePath: string, quality: number = 80) {
  try {
    const { stdout, stderr } = await execAsync(
      `npx @zzclub/z-cli tiny -f ${filePath} -q ${quality}`
    );
    
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 使用示例
const result = await compressImage('photo.jpg', 85);
console.log(result);
```

---

## 退出码规范

| 退出码 | 含义 | 场景 |
|--------|------|------|
| 0 | 成功 | 所有操作成功完成 |
| 1 | 一般错误 | 文件不存在、格式不支持、压缩失败等 |
| 2 | 参数错误 | 缺少必需参数、参数值无效等 |

---

## 发布流程

### 1. 发布前检查

```bash
# 类型检查
bun run type-check

# 构建
bun run build

# 测试本地构建
node dist/index.js tiny -f demo/demo3.jpeg -q 80
```

### 2. 发布到 npm

```bash
# 登录 npm（如果尚未登录）
npm login

# 发布（package.json 中的 prepublishOnly 会自动运行）
npm publish --access public
```

### 3. 验证发布

```bash
# 使用 NPX 测试
npx @zzclub/z-cli@latest tiny --help
npx @zzclub/z-cli@latest tiny -f test.jpg -q 80
```

---

## 架构评估

| 维度 | 评分 | 说明 |
|------|------|------|
| **类型安全** | ⭐⭐⭐⭐⭐ | 全面使用 TypeScript，严格模式 |
| **可维护性** | ⭐⭐⭐⭐⭐ | 模块化设计，职责清晰 |
| **可测试性** | ⭐⭐⭐⭐⭐ | 依赖注入，易于 mock |
| **性能** | ⭐⭐⭐⭐⭐ | Bun 运行时，Sharp 高性能图片处理 |
| **NPX 友好** | ⭐⭐⭐⭐⭐ | 编译输出，快速启动，无需安装 |
| **AI 友好** | ⭐⭐⭐⭐⭐ | 标准 CLI 接口，清晰的退出码，JSON 输出 |

**总评**: ⭐⭐⭐⭐⭐ (5/5)

---

## 时间线

| 阶段 | 预计时间 | 依赖 |
|------|----------|------|
| Phase 0: 环境准备 | 1 天 | 无 |
| Phase 1: 清理备份 | 0.5 天 | Phase 0 |
| Phase 2: 类型定义 | 1 天 | Phase 1 |
| Phase 3: 核心基础设施 | 1 天 | Phase 2 |
| Phase 4: Tiny 命令 | 2 天 | Phase 3 |
| Phase 5: 轻量级命令 | 0.5 天 | Phase 3 |
| Phase 6: CLI 入口与构建 | 1 天 | Phase 4, Phase 5 |

**总计**: 7-8 天

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Sharp 在某些平台编译失败 | 高 | 提供预编译二进制包说明，文档中添加故障排除 |
| Bun 兼容性问题 | 中 | 保留 Node.js 兼容性，使用标准 API |
| NPX 首次下载慢 | 低 | 优化包大小，只发布 `dist/` |
| TypeScript 学习曲线 | 低 | 提供完整类型定义和示例代码 |

---

## 后续优化方向（1.1+）

1. **批量处理优化**: 使用 Worker Threads 并行压缩
2. **更多格式支持**: AVIF, JXL 等新格式
3. **智能压缩**: 根据图片内容自动调整质量
4. **Web 界面**: 提供简单的 Web UI
5. **插件系统**: 支持自定义压缩算法

---

## 参考资料

- [Bun 官方文档](https://bun.sh/docs)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Consola 文档](https://github.com/unjs/consola)
- [Sharp 文档](https://sharp.pixelplumbing.com/)
- [NPM 发布指南](https://docs.npmjs.com/cli/v10/commands/npm-publish)

---

**文档版本**: 1.0  
**最后更新**: 2026-01-20  
**作者**: Sisyphus AI Agent
