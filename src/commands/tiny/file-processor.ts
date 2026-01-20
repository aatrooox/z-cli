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
