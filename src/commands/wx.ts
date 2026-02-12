import { readFileSync, existsSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { ConfigManager } from '../core/config-manager.js';
import { CliError, createLogger, logFatal, logJson, logStep } from '../core/logger.js';

const TOKEN_PATH = '/api/v1/wx/cgi-bin/token';
const MATERIAL_PATH = '/api/v1/wx/cgi-bin/material/add_material';
const DRAFT_PATH = '/api/v1/wx/cgi-bin/draft/add';
const TOKEN_TIMEOUT = 10000;
const UPLOAD_TIMEOUT = 60000;
const DRAFT_TIMEOUT = 30000;

const IMAGE_EXTENSIONS = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/gif', 'gif'],
  ['image/webp', 'webp'],
  ['image/bmp', 'bmp'],
]);

const EXTENSION_CONTENT_TYPES = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.bmp', 'image/bmp'],
]);

interface WxCliOptions {
  action?: string;
  baseUrl?: string;
  title?: string;
  html?: string;
  htmlFile?: string;
  content?: string;
  contentFile?: string;
  photos?: string;
  pat?: string;
  appId?: string;
  appSecret?: string;
  timeout?: number;
}

interface TokenResponse {
  code?: number;
  data?: {
    accessToken?: string;
    expiresIn?: number;
  };
  accessToken?: string;
}

interface UploadApiResponse {
  code?: number;
  message?: string;
  data?: { media_id?: string; url?: string };
  media_id?: string;
  url?: string;
  errcode?: number;
  errmsg?: string;
}

interface UploadedMedia {
  originalUrl: string;
  mediaId: string;
  wxUrl: string;
  index: number;
}

interface UploadResult {
  uploadedMedia: UploadedMedia[];
  imageUrlMap: Record<string, string>;
  coverMediaId: string;
  totalUploaded: number;
  photos: string[];
}

export async function wxCommand(options: WxCliOptions): Promise<void> {
  const log = createLogger('wx');
  try {
    if (!options.action) {
      throw new CliError('请提供 action，例如: z wx draft', {
        fix: ['z wx --help'],
      });
    }

    switch (options.action) {
      case 'token':
        await handleToken(log, options);
        break;
      case 'upload':
        await handleUpload(log, options);
        break;
      case 'draft':
        await handleDraft(log, options);
        break;
      case 'newspic':
        await handleNewspic(log, options);
        break;
      default:
        throw new CliError(`未知 action: ${options.action}`, {
          details: ['可用 action: token | upload | draft | newspic'],
          fix: ['z wx --help'],
        });
    }

    process.exit(0);
  } catch (error) {
    logFatal(log, error);
    process.exit(1);
  }
}

function resolveBaseUrl(value?: string): string {
  const base = requireValue('wx.baseUrl', value);
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function resolveEnv(name: string, cliValue?: string, configValue?: string): string | undefined {
  return cliValue ?? process.env[name] ?? configValue;
}

function requireValue(name: string, value?: string): string {
  if (!value) {
    const fixFlag = getConfigFixFlag(name);
    const envFix = `设置环境变量 ${name}`;
    if (!fixFlag) {
      throw new CliError(`缺少必要配置: ${name}`, {
        fix: [envFix],
      });
    }

    throw new CliError(`缺少必要配置: ${name}`, {
      fix: [
        `z set ${fixFlag} <value>`,
        `z wx ${fixFlag.replace('--wx-', '--')} <value>`,
        envFix,
      ],
    });
  }
  return value;
}

function getConfigFixFlag(name: string): string {
  const fixFlags: Record<string, string> = {
    ZZCLUB_PAT: '--wx-pat',
    WX_APPID: '--wx-app-id',
    WX_APPSECRET: '--wx-app-secret',
    'wx.baseUrl': '--wx-base-url',
  };
  return fixFlags[name] || '';
}

function resolveTimeout(defaultTimeout: number, configTimeout: number, override?: number): number {
  if (override && Number.isFinite(override) && override > 0) {
    return override;
  }
  if (configTimeout && Number.isFinite(configTimeout) && configTimeout > 0) {
    return configTimeout;
  }
  return defaultTimeout;
}

function getWxRuntimeConfig(options: WxCliOptions) {
  const configManager = new ConfigManager();
  const wxConfig = configManager.getWxConfig();
  const baseUrl = resolveBaseUrl(options.baseUrl ?? wxConfig.baseUrl);
  const pat = requireValue('ZZCLUB_PAT', resolveEnv('ZZCLUB_PAT', options.pat, wxConfig.pat));
  const appId = requireValue('WX_APPID', resolveEnv('WX_APPID', options.appId, wxConfig.appId));
  const appSecret = requireValue('WX_APPSECRET', resolveEnv('WX_APPSECRET', options.appSecret, wxConfig.appSecret));
  return { baseUrl, pat, appId, appSecret, timeout: wxConfig.timeout };
}

function parsePhotos(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function readTextInput(direct?: string, filePath?: string): string | undefined {
  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    return readFileSync(filePath, 'utf-8');
  }
  return direct;
}

function extractImageUrls(input: string): string[] {
  const urls = new Set<string>();
  const markdownImageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  let match = markdownImageRegex.exec(input);
  while (match) {
    if (match[1]) {
      urls.add(match[1]);
    }
    match = markdownImageRegex.exec(input);
  }
  match = htmlImageRegex.exec(input);
  while (match) {
    if (match[1]) {
      urls.add(match[1]);
    }
    match = htmlImageRegex.exec(input);
  }
  return [...urls];
}

function replaceImageUrls(html: string, imageUrlMap: Record<string, string>): string {
  let replaced = html;
  for (const [orig, wx] of Object.entries(imageUrlMap)) {
    if (!orig || !wx) {
      continue;
    }
    const escaped = orig.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const reg = new RegExp(escaped, 'g');
    replaced = replaced.replace(reg, wx);
  }
  return replaced;
}

async function handleToken(log: ReturnType<typeof createLogger>, options: WxCliOptions): Promise<void> {
  const runtime = getWxRuntimeConfig(options);
  const timeout = resolveTimeout(TOKEN_TIMEOUT, runtime.timeout, options.timeout);
  const response = await requestToken(
    runtime.baseUrl,
    runtime.pat,
    runtime.appId,
    runtime.appSecret,
    timeout,
  );
  logJson(log, response);
}

async function handleUpload(log: ReturnType<typeof createLogger>, options: WxCliOptions): Promise<void> {
  const runtime = getWxRuntimeConfig(options);
  const photos = parsePhotos(options.photos);
  if (photos.length === 0) {
    throw new Error('No photos available for upload. Please add at least one image.');
  }

  const tokenTimeout = resolveTimeout(TOKEN_TIMEOUT, runtime.timeout, options.timeout);
  const uploadTimeout = resolveTimeout(UPLOAD_TIMEOUT, runtime.timeout, options.timeout);
  logStep(log, 1, 2, '获取 access_token');
  const accessToken = await fetchAccessToken(
    runtime.baseUrl,
    runtime.pat,
    runtime.appId,
    runtime.appSecret,
    tokenTimeout,
  );
  logStep(log, 2, 2, '上传图片素材');
  const uploadResult = await uploadPhotos(runtime.baseUrl, runtime.pat, accessToken, photos, uploadTimeout);
  logJson(log, uploadResult);
}

async function handleDraft(log: ReturnType<typeof createLogger>, options: WxCliOptions): Promise<void> {
  const runtime = getWxRuntimeConfig(options);
  const title = requireValue('title', options.title);
  const html = readTextInput(options.html, options.htmlFile);
  if (!html) {
    throw new Error('缺少富文本 HTML 片段内容，请使用 --html 或 --html-file（将作为 content 原样写入公众号编辑器）');
  }

  const fallbackPhotos = extractImageUrls(html);
  const photos = parsePhotos(options.photos);
  const finalPhotos = photos.length > 0 ? photos : fallbackPhotos;
  if (finalPhotos.length === 0) {
    throw new Error('No photos available for upload. Please add at least one image.');
  }

  const tokenTimeout = resolveTimeout(TOKEN_TIMEOUT, runtime.timeout, options.timeout);
  const uploadTimeout = resolveTimeout(UPLOAD_TIMEOUT, runtime.timeout, options.timeout);
  const draftTimeout = resolveTimeout(DRAFT_TIMEOUT, runtime.timeout, options.timeout);
  logStep(log, 1, 3, '获取 access_token');
  const accessToken = await fetchAccessToken(
    runtime.baseUrl,
    runtime.pat,
    runtime.appId,
    runtime.appSecret,
    tokenTimeout,
  );
  logStep(log, 2, 3, '上传图片素材');
  const uploadResult = await uploadPhotos(runtime.baseUrl, runtime.pat, accessToken, finalPhotos, uploadTimeout);
  logStep(log, 3, 3, '创建草稿');
  const replacedHtml = replaceImageUrls(html, uploadResult.imageUrlMap);

  const response = await requestJson(
    `${runtime.baseUrl}${DRAFT_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runtime.pat}`,
      },
      body: {
        access_token: accessToken,
        articles: [
          {
            article_type: 'news',
            title,
            content: replacedHtml,
            thumb_media_id: uploadResult.coverMediaId,
          },
        ],
      },
    },
    draftTimeout,
  );

  logJson(log, response);
}

async function handleNewspic(log: ReturnType<typeof createLogger>, options: WxCliOptions): Promise<void> {
  const runtime = getWxRuntimeConfig(options);
  const title = requireValue('title', options.title);
  const content = readTextInput(options.content, options.contentFile);
  if (!content) {
    throw new Error('缺少 content，请使用 --content 或 --content-file');
  }

  const fallbackPhotos = extractImageUrls(content);
  const photos = parsePhotos(options.photos);
  const finalPhotos = photos.length > 0 ? photos : fallbackPhotos;
  if (finalPhotos.length === 0) {
    throw new Error('No photos available for upload. Please add at least one image.');
  }

  const tokenTimeout = resolveTimeout(TOKEN_TIMEOUT, runtime.timeout, options.timeout);
  const uploadTimeout = resolveTimeout(UPLOAD_TIMEOUT, runtime.timeout, options.timeout);
  const draftTimeout = resolveTimeout(DRAFT_TIMEOUT, runtime.timeout, options.timeout);
  logStep(log, 1, 4, '获取 access_token');
  const accessToken = await fetchAccessToken(
    runtime.baseUrl,
    runtime.pat,
    runtime.appId,
    runtime.appSecret,
    tokenTimeout,
  );
  logStep(log, 2, 4, '上传图片素材');
  const uploadResult = await uploadPhotos(runtime.baseUrl, runtime.pat, accessToken, finalPhotos, uploadTimeout);
  logStep(log, 3, 4, '准备 image_info');
  const imageInfo = {
    image_list: uploadResult.uploadedMedia.map(item => ({ image_media_id: item.mediaId })),
  };
  logStep(log, 4, 4, '创建草稿');

  const response = await requestJson(
    `${runtime.baseUrl}${DRAFT_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runtime.pat}`,
      },
      body: {
        access_token: accessToken,
        articles: [
          {
            article_type: 'newspic',
            title,
            content,
            thumb_media_id: uploadResult.coverMediaId,
            image_info: imageInfo,
          },
        ],
      },
    },
    draftTimeout,
  );

  logJson(log, response);
}

async function fetchAccessToken(
  baseUrl: string,
  pat: string,
  appId: string,
  appSecret: string,
  timeout: number,
): Promise<string> {
  const response = await requestToken(baseUrl, pat, appId, appSecret, timeout);
  const accessToken = response.data?.accessToken || response.accessToken;
  if (!accessToken) {
    throw new Error('Access token not found. Please ensure token API returns data.accessToken.');
  }
  return accessToken;
}

async function requestToken(
  baseUrl: string,
  pat: string,
  appId: string,
  appSecret: string,
  timeout: number,
): Promise<TokenResponse> {
  const response = await requestJson(
    `${baseUrl}${TOKEN_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat}`,
      },
      body: { appId, appSecret },
    },
    timeout,
  );
  return response as TokenResponse;
}

async function uploadPhotos(
  baseUrl: string,
  pat: string,
  accessToken: string,
  photos: string[],
  timeout: number,
): Promise<UploadResult> {
  const uploadedMedia: UploadedMedia[] = [];
  const imageUrlMap: Record<string, string> = {};

  for (let i = 0; i < photos.length; i++) {
    const photoUrl = photos[i];
    if (!photoUrl) {
      continue;
    }

    const payload = await resolvePhotoPayload(photoUrl, i);
    const formData = new FormData();
    formData.append('access_token', accessToken);
    formData.append('type', 'image');
    formData.append('media', payload.blob, payload.filename);

    const response = await requestFormData(
      `${baseUrl}${MATERIAL_PATH}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${pat}` },
        body: formData,
      },
      timeout,
    );

    const result = response as UploadApiResponse;
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`WeChat API error: ${result.errcode} - ${result.errmsg || 'Unknown'}`);
    }

    const mediaId = result.data?.media_id || result.media_id;
    const wxUrl = result.data?.url || result.url || '';
    if (!mediaId) {
      throw new Error(`Upload API error: No media_id in response. Raw: ${JSON.stringify(result)}`);
    }

    uploadedMedia.push({
      originalUrl: photoUrl,
      mediaId,
      wxUrl,
      index: i,
    });
    imageUrlMap[photoUrl] = wxUrl || photoUrl;
  }

  return {
    uploadedMedia,
    imageUrlMap,
    coverMediaId: uploadedMedia[0]?.mediaId || '',
    totalUploaded: uploadedMedia.length,
    photos: photos.map(url => imageUrlMap[url] || url),
  };
}

async function resolvePhotoPayload(photoUrl: string, index: number): Promise<{ blob: Blob; filename: string }> {
  if (photoUrl.startsWith('data:')) {
    const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    const contentType = matches[1] || 'image/png';
    const base64Data = matches[2] || '';
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = IMAGE_EXTENSIONS.get(contentType.toLowerCase()) || 'png';
    const filename = `image_${index + 1}.${extension}`;
    const blob = new Blob([buffer], { type: contentType });
    return { blob, filename };
  }

  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    const response = await fetch(photoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = resolveFilenameFromUrl(photoUrl, contentType, index);
    const blob = new Blob([buffer], { type: contentType });
    return { blob, filename };
  }

  if (photoUrl.startsWith('file://')) {
    const url = new URL(photoUrl);
    return resolveFilePayload(url.pathname, index);
  }

  return resolveFilePayload(photoUrl, index);
}

function resolveFilePayload(filePath: string, index: number): { blob: Blob; filename: string } {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const buffer = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = EXTENSION_CONTENT_TYPES.get(ext) || 'image/jpeg';
  const extension = IMAGE_EXTENSIONS.get(contentType.toLowerCase()) || ext.replace('.', '') || 'jpg';
  const baseName = basename(filePath, ext) || `image_${index + 1}`;
  const filename = ext ? `${baseName}${ext}` : `${baseName}.${extension}`;
  const blob = new Blob([buffer], { type: contentType });
  return { blob, filename };
}

function resolveFilenameFromUrl(url: string, contentType: string, index: number): string {
  const urlParts = url.split('/');
  let urlFilename = urlParts[urlParts.length - 1] || `image_${index + 1}`;
  urlFilename = urlFilename.split('?')[0] || urlFilename;

  const expectedExt = IMAGE_EXTENSIONS.get(contentType.toLowerCase()) || 'jpg';
  const hasExtension = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(urlFilename);

  if (!hasExtension) {
    return `${urlFilename}.${expectedExt}`;
  }

  const urlExt = urlFilename.split('.').pop()?.toLowerCase();
  if (urlExt && urlExt !== expectedExt) {
    return urlFilename.replace(/\.[^.]+$/, `.${expectedExt}`);
  }

  return urlFilename;
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
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : {};
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestFormData(
  url: string,
  options: { method: string; headers?: Record<string, string>; body: FormData },
  timeout: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : {};
  } finally {
    clearTimeout(timeoutId);
  }
}
