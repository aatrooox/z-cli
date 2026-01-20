# z-cli

**轻量级图片压缩命令行工具 | Lightweight Image Compression CLI Tool**

[![npm version](https://img.shields.io/npm/v/@zzclub/z-cli?style=flat&color=18181B&colorB=F0DB4F)](https://npmjs.com/package/@zzclub/z-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-F472B6?style=flat&logo=bun)](https://bun.sh)
[![License](https://img.shields.io/npm/l/@zzclub/z-cli?style=flat&color=18181B)](https://github.com/aatrooox/z-cli/blob/main/LICENSE)

基于 [Sharp](https://sharp.pixelplumbing.com/) 的高性能图片压缩工具，使用 TypeScript 开发，支持 Node.js 和 Bun。

## ✨ 特性

- 🚀 **高性能压缩** - 基于 Sharp (libvips)，比传统工具快 4-5 倍
- 📦 **多格式支持** - JPEG, PNG, WebP 等主流图片格式
- 🎯 **智能处理** - 自动选择最佳压缩算法（JPEG: mozjpeg, PNG: pngquant）
- 📁 **批量处理** - 支持递归处理整个目录
- ⚙️ **灵活配置** - 持久化配置，命令行参数优先级更高
- 💻 **跨平台** - Windows, macOS, Linux 全平台支持
- 🔧 **TypeScript** - 完整类型支持，可用于 Skills 集成

## 📦 安装

### 使用 Bun（推荐）

Bun 是更快的 JavaScript 运行时，推荐使用。

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash  # macOS/Linux
# 或
powershell -c "irm bun.sh/install.ps1 | iex"  # Windows

# 全局安装 z-cli
bun install -g @zzclub/z-cli
```

### 使用 Node.js

```bash
# 要求 Node.js >= 18.18.0
npm install -g @zzclub/z-cli
# 或
pnpm add -g @zzclub/z-cli
```

## 🚀 快速开始

### 基础用法

```bash
# 压缩单个图片（默认质量 75）
z tiny -f ./image.jpg

# 指定压缩质量（1-100，数值越高质量越好）
z tiny -f ./image.jpg -q 80

# 压缩整个目录
z tiny -f ./images -r

# 覆盖原文件
z tiny -f ./image.jpg -o

# 指定输出目录
z tiny -f ./image.jpg --output ./compressed
```

### 命令别名

支持三种命令别名，完全等价：

```bash
z tiny -f ./image.jpg
zz tiny -f ./image.jpg
z-cli tiny -f ./image.jpg
```

## 📖 命令详解

### `tiny` - 图片压缩

压缩单个文件或整个目录的图片。

```bash
z tiny [options]
```

**选项：**

| 选项 | 别名 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--file <path>` | `-f` | string | - | 要压缩的文件或目录路径（必需） |
| `--quality <1-100>` | `-q` | number | 75 | 压缩质量，1-100 之间 |
| `--recursive` | `-r` | boolean | false | 递归处理目录 |
| `--overwrite` | `-o` | boolean | false | 覆盖原文件 |
| `--output <dir>` | - | string | - | 指定输出目录 |
| `--help` | `-h` | - | - | 显示帮助信息 |

**支持的图片格式：**
- JPEG / JPG (mozjpeg 优化)
- PNG (pngquant 优化)
- WebP

**示例：**

```bash
# 压缩单个图片，质量 80
z tiny -f ./photo.jpg -q 80

# 递归压缩目录下所有图片
z tiny -f ./images -r

# 覆盖原文件
z tiny -f ./photo.jpg -o

# 输出到指定目录
z tiny -f ./images -r --output ./dist

# 组合使用
z tiny -f ./images -r -q 90 --output ./compressed
```

**压缩效果示例：**

```
✔ 压缩成功: 21.83 KB → 5.88 KB (减少 73.1%)

╭───────────────────╮
│                   │
│  压缩完成         │
│                   │
│  总文件数: 5      │
│  成功: 5          │
│  失败: 0          │
│  总原始大小: 2.1 MB │
│  总压缩后大小: 580 KB │
│  平均压缩率: 72.4% │
│                   │
╰───────────────────╯
```

### `set` - 更新配置

设置默认配置，影响后续所有命令。

```bash
z set [options]
```

**选项：**

| 选项 | 别名 | 类型 | 说明 |
|------|------|------|------|
| `--quality <1-100>` | `-q` | number | 设置默认压缩质量 |
| `--recursive` | `-r` | boolean | 设置默认是否递归 |
| `--overwrite` | `-o` | boolean | 设置默认是否覆盖 |
| `--output <dir>` | - | string | 设置默认输出目录 |

**示例：**

```bash
# 设置默认质量为 90
z set -q 90

# 设置默认递归处理
z set -r

# 设置默认覆盖原文件
z set -o

# 设置默认输出目录
z set --output ./compressed

# 一次设置多个
z set -q 85 -r --output ./dist
```

### `config` - 查看/管理配置

查看当前配置或管理配置文件。

```bash
z config [options]
```

**选项：**

| 选项 | 说明 |
|------|------|
| `--path` | 显示配置文件路径 |
| `--reset` | 重置配置为默认值 |
| 无参数 | 显示当前配置（JSON 格式） |

**示例：**

```bash
# 查看当前配置
z config

# 查看配置文件路径
z config --path

# 重置为默认配置
z config --reset
```

**配置文件位置：**
- Windows: `C:\Users\<用户名>\.zzclub-z-cli\config.json`
- macOS/Linux: `~/.zzclub-z-cli/config.json`

**默认配置：**

```json
{
  "tiny": {
    "quality": 80,
    "recursive": false,
    "overwrite": false,
    "outputDir": null,
    "verbose": false
  }
}
```

## 🔌 在 Skills 中使用

如果你想在 OpenCode Skills 或其他自动化脚本中使用 z-cli,推荐使用 `bunx` 或 `npx` 调用。

### 前置要求

确保已安装 Bun 或 Node.js:

```bash
# 检查 Bun 是否安装
bun --version

# 如果未安装,安装 Bun(推荐)
curl -fsSL https://bun.sh/install | bash  # macOS/Linux
# 或
powershell -c "irm bun.sh/install.ps1 | iex"  # Windows
```

### 基础用法

```bash
# 使用 bunx(推荐)
bunx @zzclub/z-cli tiny -f ./images -r -q 85

# 或使用 npx(Node.js)
npx @zzclub/z-cli tiny -f ./images -r -q 85
```

### 在 Skill 的 skill.md 中使用

直接在你的 Skill 说明中添加压缩命令即可:

```markdown
## 图片处理流程

1. 下载图片到 `./downloads` 目录
2. 压缩图片:
   ```bash
   bunx @zzclub/z-cli tiny -f ./downloads -r -q 85 --output ./compressed
   ```
3. 上传压缩后的图片
```

### 常用命令

```bash
# 压缩单个文件
bunx @zzclub/z-cli tiny -f ./image.jpg -q 80

# 递归压缩目录
bunx @zzclub/z-cli tiny -f ./images -r -q 85

# 压缩并覆盖原文件
bunx @zzclub/z-cli tiny -f ./images -r -o

# 压缩到指定目录
bunx @zzclub/z-cli tiny -f ./images -r --output ./compressed

# 查看帮助
bunx @zzclub/z-cli --help
```

### 优势

- ✅ **自动安装依赖** - bunx/npx 会自动下载 z-cli 及其依赖(包括 Sharp)
- ✅ **无需全局安装** - 每次运行时自动使用最新版本
- ✅ **简单直接** - 一行命令完成压缩

## 🛠️ 开发

### 克隆仓库

```bash
git clone https://github.com/aatrooox/z-cli.git
cd z-cli
```

### 安装依赖

```bash
# 使用 Bun（推荐）
bun install

# 或使用 pnpm
pnpm install
```

### 开发模式

```bash
# 直接运行 TypeScript 源码
bun run dev

# 或
bun run src/index.ts tiny -f ./demo/demo3.jpeg -q 80
```

### 构建

```bash
# 编译 TypeScript
bun run build

# 类型检查
bun run type-check
```

### 本地测试

```bash
# 链接到全局
npm link  # 或 bun link

# 测试命令
z tiny -f ./demo/demo3.jpeg -q 80
```

### 发布

```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
bun run release:patch

# 发布次要版本 (1.0.0 -> 1.1.0)
bun run release:minor

# 发布主要版本 (1.0.0 -> 2.0.0)
bun run release:major
```

## 📊 性能对比

基于 Sharp (libvips) 的性能优势：

| 工具 | 处理 100 张图片 (平均) | 内存占用 |
|------|------------------------|----------|
| z-cli (Sharp) | ~2.5s | ~50MB |
| ImageMagick | ~12s | ~200MB |
| GraphicsMagick | ~10s | ~180MB |

## 🤝 贡献

欢迎提出新需求或贡献代码！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📝 更新日志

### v1.0.0 (2026-01-20)

**🎉 重大重构 - TypeScript 重写**

- ✅ 完全使用 TypeScript 重写
- ✅ 简化功能，专注于图片压缩
- ✅ 移除 Commander.js，使用原生 CLI 实现
- ✅ 使用 Consola 统一日志输出
- ✅ 支持 Bun 运行时
- ✅ 完整的类型定义
- ❌ 移除 `translate` 命令（i18n 翻译）
- ❌ 移除 `picgo` 命令（图床上传）
- ❌ 移除 `i18n` 命令（Vue i18n 提取）

**迁移指南：**

如果你需要旧版本的翻译功能，请使用 v0.8.0：
```bash
npm install -g @zzclub/z-cli@0.8.0
```

或切换到备份分支：
```bash
git checkout backup/v0.8.0
```

## 📄 许可证

[MIT License](./LICENSE) © 2026 aatrox

## 📮 联系方式

- 作者：aatrox
- GitHub：[@aatrooox](https://github.com/aatrooox)
- 项目地址：[github.com/aatrooox/z-cli](https://github.com/aatrooox/z-cli)
- 微信：523748995（定制需求或技术支持）

## ⚠️ 免责声明

任何用户在使用 z-cli 前，请您仔细阅读并透彻理解本声明。您可以选择不使用 z-cli，若您一旦使用 z-cli，您的使用行为即被视为对本声明全部内容的认可和接受。

1. 任何单位或个人因下载使用 z-cli 而产生的任何意外、疏忽、合约毁坏、诽谤、版权或知识产权侵犯及其造成的损失（包括但不限于直接、间接、附带或衍生的损失等），本人不承担任何法律责任。

2. 任何单位或个人不得在未经本团队书面授权的情况下对 z-cli 工具本身申请相关的知识产权。

3. 如果本声明的任何部分被认为无效或不可执行，则该部分将被解释为反映本人的初衷，其余部分仍具有完全效力。不可执行的部分声明，并不构成我放弃执行该声明的权利。

---

**⭐ 如果这个工具对你有帮助，欢迎给个 Star！**
