import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ConfigManager } from '../core/config-manager.js';
import { CliError, createLogger, logFatal, logJson } from '../core/logger.js';

interface ApiCliOptions {
  name: string;
  content?: string;
  contentFile?: string;
  photos?: string;
  photosFile?: string;
  env?: string[];
  dryRun?: boolean;
  verbose?: boolean;
}

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | (string & {});

interface ApiEndpointConfig {
  name?: string;
  description?: string;
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  steps?: Array<{
    name?: string;
    description?: string;
    method?: HttpMethod;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeEndpointName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CliError('缺少 endpoint 名称', { fix: ['z api <name> --help'] });
  }

  // allow: letters/numbers/_/./- ; disallow path separators and traversal
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed) || trimmed.includes('..')) {
    throw new CliError(`非法 endpoint 名称: ${name}`, {
      details: ['仅允许: 字母/数字/下划线/点/连字符', '禁止包含 .. 或路径分隔符'],
    });
  }
  return trimmed;
}

function readTextInput(direct?: string, filePath?: string): string | undefined {
  if (filePath) {
    if (!existsSync(filePath)) {
      throw new CliError(`文件不存在: ${filePath}`);
    }
    return readFileSync(filePath, 'utf-8');
  }
  return direct;
}

function parseEnvPairs(pairs: string[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const raw of pairs ?? []) {
    const idx = raw.indexOf('=');
    if (idx <= 0) {
      throw new CliError(`非法 --env: ${raw}`, { details: ['格式必须为 KEY=VALUE'] });
    }
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1);
    if (!key) {
      throw new CliError(`非法 --env: ${raw}`, { details: ['KEY 不能为空'] });
    }
    result[key] = value;
  }
  return result;
}

function resolveApiConfigPath(endpointName: string): { configDir: string; apiFilePath: string } {
  const configManager = new ConfigManager();
  const configPath = configManager.getConfigPath();
  const configDir = dirname(configPath);
  const apiDir = join(configDir, 'api');
  mkdirSync(apiDir, { recursive: true });
  return { configDir, apiFilePath: join(apiDir, `${endpointName}.json`) };
}

function loadEndpointConfig(filePath: string): ApiEndpointConfig {
  if (!existsSync(filePath)) {
    throw new CliError(`未找到 endpoint 配置文件: ${filePath}`, {
      fix: [
        '在该路径创建 JSON 文件，包含至少 { method, url }',
        '示例见 README 的 `z api` 章节',
      ],
    });
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      throw new Error('配置必须为 JSON object');
    }
    return parsed as ApiEndpointConfig;
  } catch (error) {
    throw new CliError(`解析 endpoint 配置失败: ${filePath}`, {
      details: [error instanceof Error ? error.message : String(error)],
    });
  }
}

function normalizeEndpointConfig(config: ApiEndpointConfig): Required<Pick<ApiEndpointConfig, 'method' | 'url'>> & {
  headers: Record<string, string>;
  body: unknown;
  name?: string;
  description?: string;
} {
  const step = Array.isArray(config.steps) && config.steps.length > 0 ? config.steps[0] : undefined;
  const method = (step?.method ?? config.method ?? 'POST').toString().toUpperCase() as HttpMethod;
  const url = (step?.url ?? config.url ?? '').toString();
  const headers = (step?.headers ?? config.headers ?? {}) as unknown;
  const body = step?.body ?? config.body;

  if (!url) {
    throw new CliError('endpoint 配置缺少 url', {
      details: ['请在 config/api/<name>.json 中提供 url 字段'],
    });
  }
  if (!isPlainObject(headers)) {
    throw new CliError('endpoint 配置 headers 必须为对象');
  }

  return {
    name: step?.name ?? config.name,
    description: step?.description ?? config.description,
    method,
    url,
    headers: headers as Record<string, string>,
    body,
  };
}

function renderTemplateString(
  input: string,
  vars: { content?: string; photosText?: string; envResolver: (key: string) => string | undefined },
): string {
  let out = input;
  if (vars.content !== undefined) {
    out = out.replace(/\{\{content\}\}/g, vars.content);
  }
  if (vars.photosText !== undefined) {
    out = out.replace(/\{\{photos\}\}/g, vars.photosText);
  }

  out = out.replace(/\{\{env\.([A-Z0-9_]+)\}\}/gi, (_m, key: string) => {
    const resolved = vars.envResolver(key);
    return resolved ?? '';
  });

  return out;
}

function renderUnknown(
  input: unknown,
  vars: {
    content?: string;
    photosText?: string;
    photosValue?: unknown;
    envResolver: (key: string) => string | undefined;
  },
): unknown {
  if (typeof input === 'string') {
    if (input === '{{content}}') {
      return vars.content ?? '';
    }
    if (input === '{{photos}}') {
      return vars.photosValue ?? '';
    }
    const envOnly = input.match(/^\{\{env\.([A-Z0-9_]+)\}\}$/i);
    if (envOnly && envOnly[1]) {
      return vars.envResolver(envOnly[1]) ?? '';
    }
    return renderTemplateString(input, vars);
  }
  if (Array.isArray(input)) {
    return input.map(item => renderUnknown(item, vars));
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = renderUnknown(v, vars);
    }
    return out;
  }
  return input;
}

function safeJsonParseMaybe(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed === 'null' || trimmed === 'true' || trimmed === 'false') {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

async function requestJson(
  url: string,
  options: { method: string; headers?: Record<string, string>; body?: unknown },
  timeout: number,
): Promise<{ status: number; headers: Headers; text: string }>{
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    return { status: response.status, headers: response.headers, text: await response.text() };
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseResponseText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return text;
  }
}

export async function apiCommand(options: ApiCliOptions): Promise<void> {
  const log = createLogger('api');
  try {
    const endpointName = sanitizeEndpointName(options.name);
    const { apiFilePath } = resolveApiConfigPath(endpointName);
    const rawConfig = loadEndpointConfig(apiFilePath);
    const cfg = normalizeEndpointConfig(rawConfig);

    const content = readTextInput(options.content, options.contentFile);
    const photosText = readTextInput(options.photos, options.photosFile);
    const photosValue = photosText !== undefined ? safeJsonParseMaybe(photosText) : undefined;
    const envFromCli = parseEnvPairs(options.env);
    const configManager = new ConfigManager();
    const persistedApiEnv = configManager.getConfig().apiEnv;

    const envResolver = (key: string): string | undefined => {
      return envFromCli[key] ?? persistedApiEnv[key] ?? process.env[key];
    };

    const renderedHeaders = renderUnknown(cfg.headers, { content, photosText, photosValue, envResolver });
    if (!isPlainObject(renderedHeaders)) {
      throw new CliError('渲染后的 headers 非法（必须为对象）');
    }
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(renderedHeaders)) {
      if (typeof v === 'string') {
        headers[k] = v;
      } else if (v === undefined || v === null) {
        continue;
      } else {
        headers[k] = String(v);
      }
    }
    headers['Content-Type'] = 'application/json';

    const renderedBodyUnknown = renderUnknown(cfg.body ?? {}, { content, photosText, photosValue, envResolver });
    const renderedBody = typeof renderedBodyUnknown === 'string' ? safeJsonParseMaybe(renderedBodyUnknown) : renderedBodyUnknown;
    if (cfg.method.toUpperCase() !== 'GET' && !isPlainObject(renderedBody) && renderedBody !== undefined && renderedBody !== null) {
      throw new CliError('请求 body 必须为 JSON object（GET 请求将忽略 body）');
    }

    const final = {
      name: cfg.name ?? endpointName,
      description: cfg.description,
      method: cfg.method.toUpperCase(),
      url: cfg.url,
      headers,
      body: cfg.method.toUpperCase() === 'GET' ? undefined : renderedBody,
    };

    if (options.verbose || options.dryRun) {
      logJson(log, { endpointConfigPath: apiFilePath, request: final }, '最终请求:');
    }

    if (options.dryRun) {
      process.exit(0);
    }

    const timeout = 30000;
    const response = await requestJson(
      final.url,
      {
        method: final.method,
        headers: final.headers,
        body: final.method === 'GET' ? undefined : final.body,
      },
      timeout,
    );

    log.info(`HTTP ${response.status}`);
    const parsed = parseResponseText(response.text);
    logJson(log, parsed);

    if (response.status < 200 || response.status >= 300) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    logFatal(log, error);
    process.exit(1);
  }
}
