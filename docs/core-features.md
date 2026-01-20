# z-cli 核心功能详解

本文档详细说明 z-cli 的核心功能模块及其实现原理。

## 图片压缩（tiny）

### 功能目标

使用 Sharp 库高质量压缩图片，减小文件体积。

### 支持格式

- **PNG** - 无损/有损压缩
- **JPG/JPEG** - 有损压缩
- **GIF** - 颜色优化
- **WebP** - 现代格式压缩

### 压缩参数

#### 质量控制（quality）

```bash
zz tiny -f image.jpg -q 80
```

- **范围**：1-100
- **默认值**：75
- **效果**：值越高质量越好，文件越大

#### GIF 颜色保留（colours）

```bash
zz tiny -f animation.gif -c 128
```

- **范围**：2-256
- **默认值**：128
- **效果**：保留的颜色数量

#### 格式转换（type）

```bash
zz tiny -f image.png -t webp
```

- 支持转换到 Sharp 支持的任何格式

### 压缩模式

#### 模式 1：单文件压缩

```bash
zz tiny -f ./image.jpg
```

**输出**：`./image-tiny.jpg`

#### 模式 2：目录批量压缩

```bash
zz tiny -d ./images
```

**行为**：
- 压缩目录内所有图片
- 输出文件名添加 `-tiny` 后缀

#### 模式 3：条件压缩

```bash
zz tiny -d ./images -co avatar
```

**行为**：
- 仅压缩文件名包含 `avatar` 的图片

#### 模式 4：自定义输出名

```bash
zz tiny -f image.jpg -n custom-name
```

**输出**：`./custom-name.jpg`

**批量时**：`custom-name1.jpg`, `custom-name2.jpg`, ...

### 压缩反馈

实时显示：
- 压缩前后文件大小
- 压缩率（百分比）
- 成功/失败统计

```
100KB => 35KB (↓65%) 【 image-tiny.jpg 】
```

### 压缩算法说明

#### PNG 压缩

```javascript
sharp(inputPath)
  .png({ quality: 75 })
  .toFile(outputPath)
```

**特点**：
- 支持透明度
- 可选有损/无损
- quality 越低，文件越小

#### JPG 压缩

```javascript
sharp(inputPath)
  .jpeg({ quality: 75 })
  .toFile(outputPath)
```

**特点**：
- 不支持透明度
- 有损压缩
- 适合照片

#### GIF 压缩

```javascript
sharp(inputPath, { animated: true })
  .gif({ colours: 128 })
  .toFile(outputPath)
```

**特点**：
- 保留动画
- 通过减少颜色数压缩
- colours 越少，文件越小

#### WebP 压缩

```javascript
sharp(inputPath)
  .webp({ quality: 75 })
  .toFile(outputPath)
```

**特点**：
- 现代格式
- 压缩效果优于 JPG/PNG
- 支持透明度和动画
- 旧浏览器不支持

## 配置管理

### 配置存储位置

**路径**：`~/.zzclub-z-cli/config.json`

**结构**：
```json
{
  "editableConfig": []
}
```

### set 命令 - 快速设置

快速设置全局配置文件中的关键配置项。

**命令格式**：
```bash
zz set <configName> <key> <value>
```

**限制**：
- 仅支持设置 `editableConfig` 中列出的配置项

### config 命令 - 配置管理

#### 导出配置

```bash
# 导出到指定目录
zz config export /path/to/dir

# 输出文件：/path/to/dir/zzclub-z-cli.json
```

#### 导入配置

```bash
# 从文件导入
zz config import /path/to/zzclub-z-cli.json
```

**行为**：
- 与现有配置合并
- 新配置覆盖旧配置

#### 重置配置

```bash
zz config reset
```

**行为**：
- 恢复为默认配置

### 版本更新检查

**自动检查**：
- 每次运行命令时检查
- 24 小时内不重复检查
- 缓存文件：`~/.zzclub-z-cli/version-cache.json`

**提示信息**：
```
提示: 发现新版本 0.9.0，当前版本 0.8.0
```

## 总结

z-cli 的核心功能围绕图片处理场景，提供高效的批量压缩和格式转换能力，配合灵活的配置管理，最大化提升工作效率。
