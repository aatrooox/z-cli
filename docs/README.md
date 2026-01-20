# z-cli 功能文档

本目录包含 z-cli 项目的完整功能文档。

## 文档结构

- [功能概览](./overview.md) - 项目整体功能介绍
- [核心功能](./core-features.md) - 核心功能详细说明
- [命令参考](./commands/) - 各命令的详细文档

## 主要功能模块

### 图片处理工具

- **tiny 压缩** - 基于 Sharp 的图片压缩

### 配置管理

- **set 设置** - 快速设置配置项
- **config 管理** - 配置的导入、导出、重置

## 快速导航

- [tiny 命令详解](./commands/tiny.md)
- [set 命令详解](./commands/set.md)
- [config 命令详解](./commands/config.md)

## 使用流程

### 图片处理工作流

```
1. 准备需要压缩的图片
2. 运行 zz tiny 压缩图片
3. 获得优化后的图片文件
```

## 配置要求

- Node.js >= 18.18.0 (推荐 20.18.1)
