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
