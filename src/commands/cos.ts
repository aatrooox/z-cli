import { basename } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import COS from 'cos-nodejs-sdk-v5';
import { ConfigManager } from '../core/config-manager.js';
import { CliError, createLogger, logFatal, logJson, logStep, logSummary } from '../core/logger.js';

const STS_PATH = '/api/v1/upload/cos';
const STS_TIMEOUT = 30000;
const UPLOAD_TIMEOUT = 120000;
const DEFAULT_BASE_URL = 'https://zzao.club';
const DEFAULT_PUBLIC_BASE_URL = 'https://img.zzao.club';

const EXTENSION_CONTENT_TYPES = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
]);

interface CosCliOptions {
  action?: string;
  files?: string[];
  folder?: string;
  baseUrl?: string;
  publicBaseUrl?: string;
  pat?: string;
  json?: boolean;
  timeout?: number;
}

interface CosStsApiResponse {
  code?: number;
  message?: string;
  data?: {
    TmpSecretId?: string;
    TmpSecretKey?: string;
    SessionToken?: string;
    StartTime?: number;
    ExpiredTime?: number;
    Bucket?: string;
    Region?: string;
    Key?: string;
  };
}

interface NormalizedStsPayload {
  TmpSecretId: string;
  TmpSecretKey: string;
  SessionToken: string;
  StartTime: number;
  ExpiredTime: number;
  Bucket: string;
  Region: string;
  Key: string;
}

interface UploadedFileResult {
  file: string;
  filename: string;
  key: string;
  url: string;
  bucket: string;
  region: string;
  etag?: string;
  requestId?: string;
}

export async function cosCommand(options: CosCliOptions): Promise<void> {
  const log = createLogger('cos');
  try {
    const action = options.action ?? 'upload';
    switch (action) {
      case 'upload':
        await handleUpload(log, options);
        break;
      default:
        throw new CliError(`未知 action: ${action}`, {
          details: ['可用 action: upload'],
          fix: ['z cos --help'],
        });
    }
    process.exit(0);
  } catch (error) {
    logFatal(log, error);
    process.exit(1);
  }
}

async function handleUpload(log: ReturnType<typeof createLogger>, options: CosCliOptions): Promise<void> {
  const files = (options.files ?? []).filter(Boolean);
  if (files.length === 0) {
    throw new CliError('请至少提供一个图片文件路径', {
      fix: ['z cos upload ./image.png', 'z cos upload 01.png 02.png --folder wechat'],
    });
  }

  const configManager = new ConfigManager();
  const apiEnv = configManager.getConfig().apiEnv;
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.ZZCOS_BASE_URL ?? apiEnv.ZZCOS_BASE_URL ?? DEFAULT_BASE_URL);
  const publicBaseUrl = normalizeBaseUrl(options.publicBaseUrl ?? process.env.ZZCOS_PUBLIC_BASE_URL ?? apiEnv.ZZCOS_PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL);
  const pat = options.pat ?? process.env.ZZCLUB_PAT ?? apiEnv.ZZCLUB_PAT ?? '';
  const timeout = resolveTimeout(options.timeout);

  if (!pat) {
    throw new CliError('缺少必要配置: ZZCLUB_PAT', {
      fix: [
        'z set --api ZZCLUB_PAT=<token>',
        'export ZZCLUB_PAT=<token>',
      ],
    });
  }

  const results: UploadedFileResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]!;
    logStep(log, i + 1, files.length, `上传 ${filePath}`);
    const result = await uploadSingleFile({
      filePath,
      folder: options.folder,
      baseUrl,
      publicBaseUrl,
      pat,
      timeout,
    });
    results.push(result);
  }

  if (options.json) {
    logJson(log, results);
    return;
  }

  logSummary(
    log,
    `COS 上传完成（${results.length} 张）`,
    results.flatMap((item, index) => [
      `${index + 1}. ${item.filename}`,
      `   key: ${item.key}`,
      `   url: ${item.url}`,
    ]),
  );
}

async function uploadSingleFile(input: {
  filePath: string;
  folder?: string;
  baseUrl: string;
  publicBaseUrl: string;
  pat: string;
  timeout: number;
}): Promise<UploadedFileResult> {
  const resolved = resolveFilePayload(input.filePath);
  const sts = await requestSts(input.baseUrl, input.pat, resolved.filename, input.folder, input.timeout);
  const uploadResponse = await performUpload(sts, resolved.buffer, resolved.contentType, input.timeout);

  return {
    file: input.filePath,
    filename: resolved.filename,
    key: sts.Key,
    url: `${input.publicBaseUrl}/${sts.Key}`,
    bucket: sts.Bucket,
    region: sts.Region,
    etag: typeof uploadResponse?.ETag === 'string' ? uploadResponse.ETag : undefined,
    requestId: typeof uploadResponse?.RequestId === 'string' ? uploadResponse.RequestId : undefined,
  };
}

function resolveFilePayload(filePath: string): { filename: string; buffer: Buffer; contentType: string } {
  if (!existsSync(filePath)) {
    throw new CliError(`文件不存在: ${filePath}`);
  }

  const filename = basename(filePath);
  const lower = filename.toLowerCase();
  const matched = [...EXTENSION_CONTENT_TYPES.entries()].find(([ext]) => lower.endsWith(ext));
  if (!matched) {
    throw new CliError(`文件类型不支持: ${filename}`, {
      details: ['仅支持 .jpg .jpeg .png .gif .webp'],
    });
  }

  return {
    filename,
    buffer: readFileSync(filePath),
    contentType: matched[1],
  };
}

async function requestSts(
  baseUrl: string,
  pat: string,
  filename: string,
  folder: string | undefined,
  timeout: number,
): Promise<NormalizedStsPayload> {
  const response = await requestJson(
    `${baseUrl}${STS_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat}`,
      },
      body: {
        filename,
        folder: folder ? { name: folder } : undefined,
      },
    },
    timeout,
  ) as CosStsApiResponse;

  const payload = response?.data;
  if (!payload?.TmpSecretId || !payload?.TmpSecretKey || !payload?.SessionToken || !payload?.Bucket || !payload?.Region || !payload?.Key || !payload?.StartTime || !payload?.ExpiredTime) {
    throw new CliError('COS STS 返回不完整', {
      details: [JSON.stringify(response)],
    });
  }

  return {
    TmpSecretId: payload.TmpSecretId,
    TmpSecretKey: payload.TmpSecretKey,
    SessionToken: payload.SessionToken,
    StartTime: payload.StartTime,
    ExpiredTime: payload.ExpiredTime,
    Bucket: payload.Bucket,
    Region: payload.Region,
    Key: payload.Key,
  };
}

async function performUpload(
  sts: NormalizedStsPayload,
  buffer: Buffer,
  contentType: string,
  timeout: number,
): Promise<Record<string, unknown>> {
  const cos = new COS({
    SecretId: sts.TmpSecretId,
    SecretKey: sts.TmpSecretKey,
    SecurityToken: sts.SessionToken,
  });

  return await new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new CliError('上传 COS 超时'));
    }, Math.max(timeout, UPLOAD_TIMEOUT));

    cos.putObject(
      {
        Bucket: sts.Bucket,
        Region: sts.Region,
        Key: sts.Key,
        Body: buffer,
        ContentType: contentType,
      },
      (err, data) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        if (err) {
          reject(new CliError('上传 COS 失败', {
            details: [err.message || JSON.stringify(err)],
          }));
          return;
        }
        resolve((data ?? {}) as unknown as Record<string, unknown>);
      },
    );
  });
}

async function requestJson(
  url: string,
  options: { method: string; headers?: Record<string, string>; body?: unknown },
  timeout: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new CliError(`API 请求失败: HTTP ${response.status}`, {
        details: [responseText],
      });
    }

    return responseText ? JSON.parse(responseText) : {};
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveTimeout(timeout?: number): number {
  if (timeout && Number.isFinite(timeout) && timeout > 0) {
    return timeout;
  }
  return STS_TIMEOUT;
}
