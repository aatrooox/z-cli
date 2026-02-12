import { resolve } from 'node:path';
import type { CompressionOptions } from './types.js';
import { ImageCompressor } from './compressor.js';
import { FileProcessor } from './file-processor.js';
import { ConfigManager } from '../../core/config-manager.js';
import { createLogger, logSummary, formatFileSize, formatCompressionRatio } from '../../core/logger.js';

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
    const log = createLogger('tiny');
    const configManager = new ConfigManager();
    const config = configManager.getTinyConfig();

    // 合并配置和命令行选项
    const quality = options.quality ?? config.quality;
    const recursive = options.recursive ?? config.recursive;
    const overwrite = options.overwrite ?? config.overwrite;
    const outputDir = options.output ?? config.outputDir;

    // 验证输入
    if (!options.file) {
      log.error('请使用 -f 或 --file 指定要压缩的文件或目录');
      process.exit(1);
    }

    const inputPath = resolve(process.cwd(), options.file);

    // 验证质量参数
    if (quality < 1 || quality > 100) {
      log.error('压缩质量必须在 1-100 之间');
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
    logSummary(log, '压缩完成', [
      `总文件数: ${stats.total}`,
      `成功: ${stats.success}`,
      `失败: ${stats.failed}`,
      `总原始大小: ${formatFileSize(stats.totalOriginalSize)}`,
      `总压缩后大小: ${formatFileSize(stats.totalCompressedSize)}`,
      `平均压缩率: ${formatCompressionRatio(stats.averageCompressionRatio)}`,
    ]);

    process.exit(0);
  } catch (error) {
    const log = createLogger('tiny');
    log.error(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
