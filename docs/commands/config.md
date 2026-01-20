# config 命令详解

## 命令概述

管理全局配置文件，支持导入、导出和重置操作，便于团队协作和配置备份。

## 基本用法

```bash
zz config <operation> [payload...]
```

## 命令操作

| 操作 | 说明 | 参数 |
|------|------|------|
| `export` | 导出配置到文件 | 目录路径 |
| `import` | 从文件导入配置 | 文件路径 |
| `reset` | 重置为默认配置 | 无 |

## 使用示例

### 1. 导出配置

#### 导出到指定目录

```bash
zz config export /path/to/backup
```

**效果**：
- 生成文件：`/path/to/backup/zzclub-z-cli.json`
- 包含完整的配置信息

**输出示例**：
```
导出配置成功! [/path/to/backup/zzclub-z-cli.json]
```

#### 导出文件内容

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

### 2. 导入配置

#### 从文件导入

```bash
zz config import /path/to/zzclub-z-cli.json
```

**效果**：
- 读取文件内容
- 与现有配置合并
- 新配置覆盖旧配置

**输出示例**：
```
配置文件已更新：~/.zzclub-z-cli/config.json
导入配置成功!
```

#### 合并规则

**原配置**：
```json
{
  "translate": {
    "account": {
      "appId": "old-app-id",
      "key": "old-key"
    }
  }
}
```

**导入配置**：
```json
{
  "translate": {
    "account": {
      "appId": "new-app-id"
    }
  }
}
```

**结果**：
```json
{
  "translate": {
    "account": {
      "appId": "new-app-id",  // 被覆盖
      "key": "old-key"         // 保留
    }
  }
}
```

### 3. 重置配置

```bash
zz config reset
```

**效果**：
- 恢复为默认配置
- appId 和 key 会被清空
- 需要重新设置

**输出示例**：
```
配置文件已更新：~/.zzclub-z-cli/config.json
已重置为默认配置!
```

**重置后的配置**：
```json
{
  "translate": {
    "sourceDirName": "zh-CN",
    "targetDirName": "en-US",
    "ignoreFiles": [
      "node_modules"
    ],
    "account": {
      "appId": "",
      "key": ""
    }
  },
  "editableConfig": [
    "translate"
  ]
}
```

## 完整工作流

### 场景 1：备份配置

**目的**：保存当前配置，防止丢失

```bash
# 导出配置
zz config export ~/backups

# 输出文件：~/backups/zzclub-z-cli.json
```

**建议**：
- 定期备份
- 使用版本控制管理配置文件（移除敏感信息）

### 场景 2：团队协作

**团队Leader**：

```bash
# 1. 配置好开发环境
zz set translate account.appId TEAM_APP_ID
zz set translate account.key TEAM_KEY

# 2. 导出配置模板（移除敏感信息）
zz config export ./team-configs

# 3. 编辑配置文件，移除 appId 和 key
vi ./team-configs/zzclub-z-cli.json

# 4. 将配置文件加入 Git
git add team-configs/
git commit -m "Add team config template"
```

**团队成员**：

```bash
# 1. 拉取配置模板
git pull

# 2. 导入配置
zz config import ./team-configs/zzclub-z-cli.json

# 3. 设置个人凭证
zz set translate account.appId MY_APP_ID
zz set translate account.key MY_KEY
```

### 场景 3：多环境切换

**准备多个配置文件**：

```bash
configs/
├── dev.json       # 开发环境
├── test.json      # 测试环境
└── prod.json      # 生产环境
```

**切换配置**：

```bash
# 切换到开发环境
zz config import ./configs/dev.json

# 切换到生产环境
zz config import ./configs/prod.json
```

### 场景 4：迁移到新设备

**旧设备**：

```bash
# 导出配置
zz config export ~/Desktop
# 将 zzclub-z-cli.json 复制到新设备
```

**新设备**：

```bash
# 安装 z-cli
npm i -g @zzclub/z-cli

# 导入配置
zz config import ~/Desktop/zzclub-z-cli.json
```

## 配置文件说明

### 存储位置

```
~/.zzclub-z-cli/config.json
```

**不同系统的路径**：
- **Windows**：`C:\Users\{用户名}\.zzclub-z-cli\config.json`
- **macOS**：`/Users/{用户名}/.zzclub-z-cli/config.json`
- **Linux**：`/home/{用户名}/.zzclub-z-cli/config.json`

### 默认配置

```json
{
  "translate": {
    "sourceDirName": "zh-CN",
    "targetDirName": "en-US",
    "ignoreFiles": [
      "node_modules"
    ],
    "account": {
      "appId": "",
      "key": ""
    }
  },
  "editableConfig": [
    "translate"
  ]
}
```

### 配置项详解

#### translate.sourceDirName

- **类型**：string
- **默认值**："zh-CN"
- **说明**：源语言目录名称，批量翻译时查找此目录

#### translate.targetDirName

- **类型**：string
- **默认值**："en-US"
- **说明**：目标语言目录名称，翻译结果输出到此目录

#### translate.ignoreFiles

- **类型**：array
- **默认值**：["node_modules"]
- **说明**：批量翻译时忽略的目录或文件

#### translate.account.appId

- **类型**：string
- **默认值**：""
- **说明**：百度翻译 API 的 appId

#### translate.account.key

- **类型**：string
- **默认值**：""
- **说明**：百度翻译 API 的 key

#### editableConfig

- **类型**：array
- **默认值**：["translate"]
- **说明**：允许通过 set 命令修改的配置模块

## 错误处理

### 1. 导出时目录不存在

**命令**：
```bash
zz config export /nonexistent/path
```

**输出**：
```
不存在的文件夹路径: [/nonexistent/path]
```

**解决方案**：
```bash
# 先创建目录
mkdir -p /path/to/backup
# 再导出
zz config export /path/to/backup
```

### 2. 导入时文件不存在

**命令**：
```bash
zz config import ./nonexistent.json
```

**输出**：
```
不存在的文件路径: [./nonexistent.json]
```

**解决方案**：
- 检查文件路径是否正确
- 确认文件确实存在

### 3. 导入时文件格式错误

**命令**：
```bash
zz config import ./invalid.txt
```

**输出**：
```
只支持导入json文件: [./invalid.txt]
```

**解决方案**：
- 确保文件扩展名为 `.json`
- 确保文件内容是有效的 JSON 格式

## 安全建议

### ✅ 推荐做法

1. **移除敏感信息后再分享**：
   ```bash
   # 导出配置
   zz config export ./backup
   
   # 编辑文件，移除 appId 和 key
   vi ./backup/zzclub-z-cli.json
   ```

2. **使用 .gitignore 排除个人配置**：
   ```gitignore
   # 排除个人配置
   my-config.json
   *-personal.json
   ```

3. **定期备份配置**：
   ```bash
   # 创建备份脚本
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   zz config export ~/backups/z-cli-$DATE
   ```

### ❌ 避免的做法

1. **不要将包含凭证的配置提交到公开仓库**
2. **不要使用明文存储敏感信息**（当前限制）
3. **不要分享个人配置文件给他人**

## 高级技巧

### 1. 配置文件格式化

```bash
# 使用 jq 格式化
cat ~/.zzclub-z-cli/config.json | jq '.'
```

### 2. 批量操作脚本

```bash
#!/bin/bash
# backup-and-reset.sh

# 备份当前配置
zz config export ./backup-$(date +%Y%m%d)

# 重置配置
zz config reset

# 设置新凭证
zz set translate account.appId $NEW_APP_ID
zz set translate account.key $NEW_KEY
```

### 3. 配置对比

```bash
# 导出当前配置
zz config export ./current

# 对比两个配置
diff ./current/zzclub-z-cli.json ./backup/zzclub-z-cli.json
```

### 4. 自动化部署

```yaml
# GitHub Actions 示例
name: Setup z-cli

on: [push]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Install z-cli
        run: npm i -g @zzclub/z-cli
      
      - name: Import config
        run: zz config import ./configs/ci.json
      
      - name: Set credentials
        run: |
          zz set translate account.appId ${{ secrets.BAIDU_APP_ID }}
          zz set translate account.key ${{ secrets.BAIDU_KEY }}
```

## 常见问题

### Q1：如何查看当前配置？

```bash
cat ~/.zzclub-z-cli/config.json
```

或使用 jq：
```bash
cat ~/.zzclub-z-cli/config.json | jq
```

### Q2：导入配置会覆盖所有配置吗？

**不会**。导入使用合并策略：
- 新配置覆盖同名配置项
- 其他配置项保留

### Q3：重置配置后如何恢复？

**方法 1**：从备份导入
```bash
zz config import ./backup/zzclub-z-cli.json
```

**方法 2**：重新设置
```bash
zz set translate account.appId YOUR_APP_ID
zz set translate account.key YOUR_KEY
```

### Q4：可以手动编辑配置文件吗？

**可以**。配置文件是标准 JSON 格式。

```bash
vi ~/.zzclub-z-cli/config.json
```

**注意**：
- 确保 JSON 格式正确
- 修改后立即生效

### Q5：配置文件丢失了怎么办？

**自动重建**：
- 运行任何 z-cli 命令
- 会自动创建默认配置文件

**然后重新配置**：
```bash
zz set translate account.appId YOUR_APP_ID
zz set translate account.key YOUR_KEY
```

## 与其他命令配合

### config + set

```bash
# 1. 导入团队配置模板
zz config import ./team-config.json

# 2. 设置个人凭证
zz set translate account.appId MY_APP_ID
zz set translate account.key MY_KEY
```

### config + translate

```bash
# 1. 切换到测试环境配置
zz config import ./configs/test.json

# 2. 运行翻译
zz translate -d ./src/i18n
```

## 相关命令

- [set 命令](./set.md) - 快速设置配置项
- [translate 命令](./translate.md) - 使用配置的翻译功能
