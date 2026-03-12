# z-cli

**Agent-First CLI Toolkit for Extensible Automation**

[![npm version](https://img.shields.io/npm/v/@zzclub/z-cli?style=flat&color=18181B&colorB=F0DB4F)](https://npmjs.com/package/@zzclub/z-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-F472B6?style=flat&logo=bun)](https://bun.sh)
[![License](https://img.shields.io/npm/l/@zzclub/z-cli?style=flat&color=18181B)](https://github.com/aatrooox/z-cli/blob/main/LICENSE)

面向 AI Agent 的命令行工具集。目标不是堆一堆脚本，而是把可复用的自动化能力收敛到统一 CLI 入口里，让 Skills 只负责描述如何调用。

## 定位

- Agent 通过 `z` / `zz` / `z-cli` 统一调用能力
- Skills 只保留意图描述和少量参数映射，不再复制脚本实现
- 配置持久化到用户目录，命令行参数优先
- 当前能力同时覆盖通用工具和 zzclub 内部工作流

## 当前命令

| 命令 | 用途 |
| --- | --- |
| `tiny` | 压缩单张图片或批量压缩目录图片 |
| `set` | 持久化默认配置，包括 `tiny`、`wx`、`api` |
| `config` | 查看配置路径、当前配置，或重置默认配置 |
| `api` | 读取 `config/api/<name>.json` 并发起模板化 HTTP 请求 |
| `wx` | 微信公众号草稿工作流，支持 token、素材上传、`news`/`newspic` 草稿 |
| `cos` | 通过 zzclub 后端申请 STS 后上传图片到腾讯云 COS |
| `gui` | 调用本机 GUI 自动化脚本，目前支持微信发送消息 |

## 安装

### Bun

```bash
bun install -g @zzclub/z-cli
```

### Node.js

```bash
npm install -g @zzclub/z-cli
```

### 命令别名

以下三种写法等价：

```bash
z tiny -f ./image.jpg
zz tiny -f ./image.jpg
z-cli tiny -f ./image.jpg
```

## 快速开始

```bash
# 1. 查看全部命令
z --help

# 2. 压缩图片
z tiny -f ./images -r -q 85

# 3. 查看当前配置
z config

# 4. 设置默认 wx 账号
z set --wx-app-id wx123 --wx-app-secret xxx --wx-pat pat-xxx

# 5. 新增第二个 wx 账号并切换为默认
z set --wx-account brand-b --wx-app-id wx456 --wx-app-secret yyy --wx-pat pat-yyy
z set --wx-default-account brand-b
```

## 配置

### 配置文件位置

- Linux: `~/.config/zzclub-z-cli/config.json` 或 `$XDG_CONFIG_HOME/zzclub-z-cli/config.json`
- macOS: `~/Library/Application Support/zzclub-z-cli/config.json`
- Windows: `%APPDATA%\zzclub-z-cli\config.json`

查看实际路径：

```bash
z config --path
```

### 默认配置结构

```json
{
  "tiny": {
    "quality": 80,
    "recursive": false,
    "overwrite": false,
    "outputDir": null,
    "verbose": false
  },
  "wx": {
    "baseUrl": "https://zzao.club",
    "timeout": 30000,
    "defaultAccount": "default",
    "accounts": {
      "default": {
        "pat": "",
        "appId": "",
        "appSecret": ""
      }
    }
  },
  "apiEnv": {}
}
```

### wx 多账号

`wx` 现在按账号名管理凭证：

- `wx.baseUrl` 和 `wx.timeout` 是全局配置
- `wx.accounts.<name>.pat/appId/appSecret` 是账号级配置
- `wx.defaultAccount` 决定未传 `--account` 时使用哪个账号
- 旧版单账号配置会在首次加载时自动迁移到 `wx.accounts.default`

常用命令：

```bash
# 更新默认账号 default
z set --wx-app-id wx123 --wx-app-secret secret123 --wx-pat pat123

# 新增第二个账号
z set --wx-account brand-b --wx-app-id wx456 --wx-app-secret secret456 --wx-pat pat456

# 切换默认账号
z set --wx-default-account brand-b

# 调用时显式指定账号
z wx draft --account brand-b -t "标题" --html-file ./fragment.html
```

`wx` 运行时的凭证优先级：

1. CLI 参数，例如 `z wx draft --account brand-b --app-id ...`
2. 选中账号在配置文件中的值
3. 进程环境变量 `ZZCLUB_PAT` / `WX_APPID` / `WX_APPSECRET`

## 命令参考

### `tiny`

压缩单个图片文件，或递归处理整个目录。

```bash
z tiny --file <path> [--quality <1-100>] [--recursive] [--overwrite] [--output <dir>]
```

能力：

- 支持 `jpg/jpeg/png/webp`
- 支持单文件和目录递归
- 支持覆盖原图或输出到指定目录
- 输出汇总统计，包括成功数和压缩率

示例：

```bash
z tiny -f ./photo.jpg -q 80
z tiny -f ./images -r
z tiny -f ./images -r --output ./compressed
z tiny -f ./photo.jpg -o
```

### `set`

持久化默认配置。命令只负责“写配置”，不会执行业务动作。

```bash
z set [options]
```

支持的配置：

- `tiny`: `--quality` `--recursive` `--overwrite` `--output`
- `wx`: `--wx-account` `--wx-default-account` `--wx-base-url` `--wx-timeout` `--wx-pat` `--wx-app-id` `--wx-app-secret`
- `api`: `--api KEY=VALUE`，供 `api` 命令模板里的 `{{env.KEY}}` 使用

示例：

```bash
z set -q 90 -r --output ./dist
z set --wx-app-id wx123 --wx-app-secret secret123 --wx-pat pat123
z set --wx-account brand-b --wx-app-id wx456 --wx-app-secret secret456 --wx-pat pat456
z set --wx-default-account brand-b
z set --api TOKEN=xxx --api BLOG_ID=123
```

### `config`

查看配置、配置路径，或重置默认配置。

```bash
z config
z config --path
z config --reset
```

说明：

- `z config` 会直接打印当前配置 JSON
- `z config --reset` 会把 `tiny`、`wx`、`apiEnv` 全部重置为默认值

### `api`

按 endpoint 名称读取 `config/api/<name>.json`，渲染模板后发送 HTTP 请求。适合把“固定接口 + 少量动态内容”的工作流沉到配置里。

```bash
z api <name> [--content <text> | --content-file <path>] [--photos <value> | --photos-file <path>] [--env KEY=VALUE] [--dry-run] [--verbose]
```

endpoint 文件位置：

- macOS: `~/Library/Application Support/zzclub-z-cli/api/<name>.json`
- Linux: `~/.config/zzclub-z-cli/api/<name>.json`
- Windows: `%APPDATA%\zzclub-z-cli\api\<name>.json`

最小配置：

```json
{
  "name": "blog-memo",
  "method": "POST",
  "url": "https://example.com/api/memo",
  "headers": {
    "Authorization": "Bearer {{env.TOKEN}}"
  },
  "body": {
    "content": "{{content}}",
    "photos": "{{photos}}"
  }
}
```

模板变量：

- `{{content}}`: `--content` / `--content-file`
- `{{photos}}`: `--photos` / `--photos-file`
- `{{env.KEY}}`: 来自 `--env KEY=VALUE`、`z set --api KEY=VALUE`、或 `process.env`

说明：

- 如果配置包含 `steps`，当前只使用第一步
- `--dry-run` 只打印最终请求，不发请求
- `--photos` 若传 JSON 文本，在 body 中会自动解析成 JSON 值

示例：

```bash
z api blog-memo --content "hello" --photos '{"urls":["https://a.com/1.jpg"]}' --env TOKEN=xxx --verbose
z api blog-memo --content-file ./memo.txt --photos-file ./photos.json
z api blog-memo --content "hello" --dry-run --verbose
```

### `wx`

微信公众号草稿工作流。当前支持四个 action：

- `token`: 获取 `access_token`
- `upload`: 上传图片素材
- `draft`: 创建 `news` 草稿，自动上传图片并替换 HTML 中的图片 URL
- `newspic`: 创建 `newspic` 草稿

统一参数：

```bash
z wx <action> [--account <name>] [--base-url <url>] [--pat <token>] [--app-id <id>] [--app-secret <secret>] [--timeout <ms>]
```

#### `wx token`

```bash
z wx token
z wx token --account brand-b
```

#### `wx upload`

`--photos` 支持逗号分隔列表，元素可以是：

- 本地文件路径
- `file://` 路径
- `http/https` 图片 URL
- `data:` URL

```bash
z wx upload --photos ./a.jpg,./b.png
z wx upload --account brand-b --photos https://a.com/cover.jpg
```

#### `wx draft`

创建 `news` 草稿，要求标题和 HTML 内容。

```bash
z wx draft -t "文章标题" --html-file ./fragment.html
z wx draft --account brand-b -t "文章标题" --html '<p>Hello</p><img src="./cover.jpg">'
```

说明：

- `--html` / `--html-file` 二选一
- `--photos` 可显式指定图片列表
- 如果不传 `--photos`，会从 HTML 里的 Markdown 图片或 `<img src=...>` 自动提取
- 创建草稿前会先上传图片素材，再把 HTML 中的原始图片 URL 替换成微信素材 URL

#### `wx newspic`

创建 `newspic` 草稿，要求标题和纯内容文本。

```bash
z wx newspic -t "标题" --content "正文"
z wx newspic -t "标题" --content-file ./content.txt --photos ./01.jpg,./02.jpg
```

说明：

- `--content` / `--content-file` 二选一
- `--photos` 不传时也会尝试从内容里的图片引用自动提取

### `cos`

上传图片到腾讯云 COS。流程是：

1. 调用 zzclub 后端接口申请临时 STS
2. 使用 `cos-nodejs-sdk-v5` 上传到 COS
3. 输出对象 key 和公网 URL

```bash
z cos upload <files...> [--folder <name>] [--base-url <url>] [--public-base-url <url>] [--pat <token>] [--timeout <ms>] [--json]
```

说明：

- 只支持图片文件：`jpg/jpeg/png/gif/webp`
- `--folder` 用于传给后端生成子目录
- `ZZCLUB_PAT` 可来自 CLI、`process.env` 或 `z set --api ZZCLUB_PAT=...`
- `--json` 输出机器可读结果

示例：

```bash
z cos upload ./cover.png
z cos upload ./01.jpg ./02.jpg --folder wechat
z cos upload ./cover.png --json
```

### `gui`

封装本机 GUI 自动化脚本。当前只支持微信发送消息。

```bash
z gui wechat --chat <name> [--message <text> | --message-file <path>] [--script <path>] [--json]
```

说明：

- `z-cli` 不内置 GUI 自动化脚本，只负责统一入口
- 默认脚本路径是维护者机器的固定路径，不适用于通用环境
- 运行前仍要满足脚本自身依赖，例如桌面微信已登录、桌面可交互、系统已授予辅助功能权限

示例：

```bash
z gui wechat --chat "文件传输助手" --message "hello from z-cli"
z gui wechat --chat "项目群" --message-file ./message.txt --json
z gui wechat --chat "项目群" --message "hello" --script /path/to/send_wechat.sh
```

## 在 Skills / Agent 中使用

推荐直接调用包，而不是在 Skill 里复制脚本：

```bash
bunx @zzclub/z-cli tiny -f ./images -r -q 85
bunx @zzclub/z-cli api blog-memo --content-file ./memo.txt
bunx @zzclub/z-cli wx draft --account brand-b -t "标题" --html-file ./fragment.html
```

建议：

- Skill 里只保留意图、前置条件、示例命令
- 不要在 Skill 中重复实现 `wx` / `api` / `cos` 逻辑
- 需要凭证时，优先写入 `z set` 配置，再由命令统一读取

## 开发

### 本地运行

```bash
bun run dev
bun run src/index.ts --help
```

### 类型检查

```bash
bun run type-check
```

### 构建

```bash
bun run build
```

### 发布

```bash
bun run release:patch
bun run release:minor
bun run release:major
```
