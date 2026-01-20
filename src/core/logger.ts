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
