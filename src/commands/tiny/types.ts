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
