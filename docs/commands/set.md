# set 命令详解

## 命令概述

快速设置全局配置文件中的关键配置项，主要用于配置百度翻译 API 凭证。

## 基本用法

```bash
zz set <configName> [payload...]
```

## 命令参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `configName` | 配置模块名称 | translate |
| `payload` | 配置路径和值 | account.appId YOUR_APP_ID |

## 使用示例

### 1. 设置翻译 API 的 appId

```bash
zz set translate account.appId YOUR_APP_ID
```

**效果**：
- 在配置文件中设置 `translate.account.appId`
- 显示配置文件路径

**输出示例**：
```
配置文件已更新：~/.zzclub-z-cli/config.json
```

### 2. 设置翻译 API 的 key

```bash
zz set translate account.key YOUR_KEY
```

**效果**：
- 在配置文件中设置 `translate.account.key`
- 显示成功提示

## 支持的配置项

### 当前支持的配置

**translate 模块**：
```bash
# appId
zz set translate account.appId <your-app-id>

# key
zz set translate account.key <your-key>
```

### 配置路径说明

**格式**：`模块名 配置路径 值`

**示例解析**：
```bash
zz set translate account.appId ABC123
      ↓          ↓            ↓
   模块名    配置路径        值
```

**映射到配置文件**：
```json
{
  "translate": {
    "account": {
      "appId": "ABC123"
    }
  }
}
```

## 配置文件结构

### 存储位置

```
~/.zzclub-z-cli/config.json
```

**Windows**：`C:\Users\{用户名}\.zzclub-z-cli\config.json`
**macOS/Linux**：`/home/{用户名}/.zzclub-z-cli/config.json`

### 完整结构

```json
{
  "translate": {
    "sourceDirName": "zh-CN",
    "targetDirName": "en-US",
    "ignoreFiles": [
      "node_modules"
    ],
    "account": {
      "appId": "your-app-id",
      "key": "your-key"
    }
  },
  "editableConfig": [
    "translate"
  ]
}
```

### 配置项说明

| 配置项 | 类型 | 说明 | 可修改 |
|--------|------|------|--------|
| `translate.sourceDirName` | string | 源语言目录名 | ❌ |
| `translate.targetDirName` | string | 目标语言目录名 | ❌ |
| `translate.ignoreFiles` | array | 忽略的目录/文件 | ❌ |
| `translate.account.appId` | string | 百度翻译 appId | ✅ |
| `translate.account.key` | string | 百度翻译 key | ✅ |

**注意**：
- 仅 `editableConfig` 中列出的配置模块可通过 set 命令修改
- 其他配置需要使用 config 命令或手动编辑配置文件

## 完整工作流

### 初次使用

**步骤 1**：获取百度翻译 API 凭证
1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并实名认证
3. 开通"通用文本翻译"服务
4. 生成 appId 和 key

**步骤 2**：配置凭证
```bash
zz set translate account.appId YOUR_APP_ID
zz set translate account.key YOUR_KEY
```

**步骤 3**：验证配置
```bash
cat ~/.zzclub-z-cli/config.json
```

**步骤 4**：测试翻译
```bash
zz translate -f ./test.js
```

### 更换凭证

**场景**：API 配额用完，需要更换账号

```bash
# 设置新的 appId
zz set translate account.appId NEW_APP_ID

# 设置新的 key
zz set translate account.key NEW_KEY
```

**效果**：
- 覆盖旧配置
- 立即生效

## 错误处理

### 1. 配置项不存在

**命令**：
```bash
zz set unknown account.appId ABC
```

**输出**：
```
配置项[unknown]不存在
```

**原因**：
- 配置模块名错误
- 当前版本不支持该配置

### 2. 配置项不可修改

**命令**：
```bash
zz set translate sourceDirName my-zh
```

**输出**：
```
配置项[sourceDirName]不允许修改
```

**原因**：
- 该配置项未列在 `editableConfig` 中
- 需要使用其他方式修改

### 3. 参数格式错误

**命令**：
```bash
zz set translate account.appId
```

**输出**：
```
设置appId: zz set translate account.appId <value>
设置key: zz set translate account.key <value>
```

**原因**：
- 缺少值参数
- 显示正确的使用方法

## 安全建议

### ✅ 推荐做法

1. **不要分享凭证**：
   - appId 和 key 是私密信息
   - 不要提交到 Git 仓库

2. **定期更换凭证**：
   - 防止凭证泄露
   - 提高安全性

3. **使用环境变量**（高级）：
   - 更安全的管理方式
   - 需要修改源码支持

### ❌ 避免的做法

1. **不要在公开场合展示**：
   - 截图时遮盖凭证
   - 演示时使用测试账号

2. **不要使用他人的凭证**：
   - 可能被封号
   - 影响配额使用

## 高级用法

### 查看当前配置

```bash
# macOS/Linux
cat ~/.zzclub-z-cli/config.json | grep -A 2 account

# Windows (PowerShell)
Get-Content ~\.zzclub-z-cli\config.json | Select-String -Context 0,2 account
```

### 批量配置（脚本）

```bash
#!/bin/bash
# setup.sh

APP_ID="your-app-id"
KEY="your-key"

zz set translate account.appId "$APP_ID"
zz set translate account.key "$KEY"

echo "配置完成！"
```

使用：
```bash
chmod +x setup.sh
./setup.sh
```

### 团队协作

**方案 1**：使用 config 命令
```bash
# 导出配置（移除敏感信息后）
zz config export ./team-config.json

# 团队成员导入
zz config import ./team-config.json

# 各自设置自己的凭证
zz set translate account.appId MY_APP_ID
zz set translate account.key MY_KEY
```

**方案 2**：环境变量（需要扩展）
```bash
export BAIDU_TRANSLATE_APP_ID="your-app-id"
export BAIDU_TRANSLATE_KEY="your-key"
```

## 与其他命令对比

### set vs config

| 命令 | 用途 | 优点 | 缺点 |
|------|------|------|------|
| set | 快速设置单个配置 | 简单快捷 | 仅支持部分配置 |
| config | 管理整个配置文件 | 功能完整 | 相对复杂 |

**使用建议**：
- **日常使用**：用 set 命令快速设置
- **团队协作**：用 config 命令导入/导出
- **完整管理**：直接编辑配置文件

## 常见问题

### Q1：如何查看已设置的配置？

```bash
cat ~/.zzclub-z-cli/config.json
```

或使用 jq 格式化输出：
```bash
cat ~/.zzclub-z-cli/config.json | jq
```

### Q2：配置设置后没有生效？

**可能原因**：
- 配置文件权限问题
- 路径错误

**解决方案**：
```bash
# 检查配置文件是否存在
ls -la ~/.zzclub-z-cli/config.json

# 查看配置内容
cat ~/.zzclub-z-cli/config.json
```

### Q3：可以设置其他配置项吗？

**当前限制**：仅支持 translate 模块的 appId 和 key

**扩展方法**：
1. 直接编辑配置文件
2. 使用 config 命令导入
3. 提交 PR 扩展 set 命令功能

### Q4：误设置了错误的值怎么办？

**重新设置**：
```bash
zz set translate account.appId CORRECT_APP_ID
```

**或重置配置**：
```bash
zz config reset
# 然后重新设置
```

### Q5：多个项目如何使用不同配置？

**当前限制**：全局配置，所有项目共享

**解决方案**：
1. 使用 config export/import 切换配置
2. 手动备份不同的配置文件
3. 等待未来版本支持项目级配置

## 未来扩展

### 计划支持的配置

- 图床配置（PicGo）
- i18n 提取规则
- 压缩默认参数

### 改进方向

- 支持项目级配置文件
- 支持环境变量
- 配置验证和提示

## 相关命令

- [config 命令](./config.md) - 完整配置管理
- [translate 命令](./translate.md) - 使用配置的翻译功能
