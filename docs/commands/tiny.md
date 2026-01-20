# tiny 命令详解

## 命令概述

使用 Sharp 库压缩图片文件，支持多种格式，可指定质量、批量处理、文件名过滤等功能。

## 基本用法

```bash
zz tiny [options]
```

## 命令选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--type <fileType>` | `-t` | 转换后的图片类型 | null（保持原格式） |
| `--file <file>` | `-f` | 要压缩的图片文件 | null |
| `--dir <dir>` | `-d` | 压缩文件夹内所有文件 | null |
| `--condition <condition>` | `-co` | 文件名包含指定字符串的图片 | null |
| `--quality <quality>` | `-q` | 压缩质量（1-100） | 75 |
| `--colours <colours>` | `-c` | GIF色彩保留（2-256） | 128 |
| `--name <name>` | `-n` | 指定输出文件名 | 原文件名-tiny |
| `--replace` | | 替换 markdown 中的图片引用 | false |
| `--replace-file <file>` | `-ref` | 要替换内容的 markdown 文件 | "" |

## 支持的图片格式

- **PNG** - 无损/有损压缩
- **JPG/JPEG** - 有损压缩
- **GIF** - 颜色优化压缩
- **WebP** - 现代格式压缩

## 使用示例

### 1. 压缩单个文件

```bash
zz tiny -f ./image.jpg
```

**效果**：
- 压缩 `image.jpg`
- 生成 `image-tiny.jpg`（同目录）
- 显示压缩前后大小和压缩率

**输出示例**：
```
150KB => 52KB (↓65.3%) 【 image-tiny.jpg 】
```

### 2. 指定压缩质量

```bash
zz tiny -f ./image.jpg -q 85
```

**质量参数**：
- **1-50**：低质量，高压缩率，文件小，可能有明显失真
- **50-75**：中等质量，适合网页使用
- **75-90**：高质量，文件稍大，细节保留较好
- **90-100**：极高质量，文件大，几乎无损

**推荐值**：
- 网页图片：70-80
- 打印素材：85-95
- 快速加载：60-70

### 3. 批量压缩目录

```bash
zz tiny -d ./images
```

**效果**：
- 压缩 `images` 目录下所有图片
- 每个文件生成对应的 `-tiny` 版本
- 显示每个文件的压缩结果
- 最后显示总计成功数量

**输出示例**：
```
正在压缩: photo1.jpg
100KB => 35KB (↓65%) 【 photo1-tiny.jpg 】
正在压缩: photo2.png
200KB => 80KB (↓60%) 【 photo2-tiny.png 】
压缩成功 2 个
```

### 4. 条件过滤压缩

```bash
zz tiny -d ./images -co avatar
```

**效果**：
- 仅压缩文件名包含 `avatar` 的图片
- 如：`user-avatar.jpg`、`avatar-big.png`

**使用场景**：
- 批量处理特定类型的图片
- 避免误压缩其他文件

### 5. 自定义输出文件名

**单文件**：
```bash
zz tiny -f image.jpg -n compressed
```
输出：`compressed.jpg`

**批量（自动编号）**：
```bash
zz tiny -d ./images -n thumb
```
输出：`thumb1.jpg`, `thumb2.jpg`, `thumb3.jpg`, ...

### 6. GIF 压缩

```bash
zz tiny -f animation.gif -c 128
```

**colours 参数**：
- **2-64**：颜色数少，文件小，色彩损失明显
- **64-128**：适中，适合简单动画
- **128-256**：保留更多颜色，文件较大

**推荐值**：
- 简单图标：64
- 一般动画：128
- 复杂动画：256

### 7. 格式转换

```bash
zz tiny -f image.png -t webp -q 80
```

**效果**：
- 将 PNG 转换为 WebP
- 使用指定质量压缩
- 输出：`image-tiny.webp`

**常用转换**：
- PNG → WebP：更小的文件，现代浏览器支持
- JPG → WebP：更好的压缩效果
- PNG → JPG：去除透明度，文件更小

## Obsidian 集成功能

### 场景说明

Obsidian 用户在 markdown 中插入图片使用 `![[filename.png]]` 语法。压缩图片后，需要手动替换所有引用，繁琐且易出错。

### 自动替换功能

```bash
zz tiny -d ./notes/配图 --replace --replace-file=./notes/article.md
```

**工作流程**：

1. **压缩图片**：
   - 压缩 `./notes/配图/` 目录下所有图片
   - 生成 `-tiny` 后缀的文件

2. **建立映射**：
   ```
   demo.png → demo-tiny.png
   photo.jpg → photo-tiny.jpg
   ```

3. **替换引用**：
   ```markdown
   <!-- 替换前 -->
   ![[demo.png]]
   ![[photo.jpg]]
   
   <!-- 替换后 -->
   ![[demo-tiny.png]]
   ![[photo-tiny.jpg]]
   ```

4. **写入文件**：
   - 直接修改 `article.md`
   - 不可撤销操作

### 完整示例

**目录结构**：
```
notes/
├── article.md
└── 配图/
    ├── cover.png
    ├── diagram.jpg
    └── screenshot.png
```

**article.md 内容**：
```markdown
# 我的文章

封面图：
![[cover.png]]

流程图：
![[diagram.jpg]]

截图：
![[screenshot.png]]
```

**运行命令**：
```bash
zz tiny -d ./notes/配图 --replace --replace-file=./notes/article.md
```

**执行后**：

1. 配图目录新增文件：
   ```
   配图/
   ├── cover.png
   ├── cover-tiny.png          # 新增
   ├── diagram.jpg
   ├── diagram-tiny.jpg        # 新增
   ├── screenshot.png
   └── screenshot-tiny.png     # 新增
   ```

2. article.md 自动更新：
   ```markdown
   # 我的文章

   封面图：
   ![[cover-tiny.png]]

   流程图：
   ![[diagram-tiny.jpg]]

   截图：
   ![[screenshot-tiny.png]]
   ```

### 配合 Obsidian 插件

**推荐插件**：Image Auto Upload Plugin

**完整工作流**：

```bash
# 1. 压缩并替换引用
zz tiny -d ./notes/配图 --replace --replace-file=./notes/article.md

# 2. 在 Obsidian 中使用插件一键上传图片到图床

# 3. 插件自动替换为外链
# ![[cover-tiny.png]] → ![](https://cdn.example.com/cover-tiny.png)
```

### ⚠️ 重要提示

1. **不可逆操作**：替换后无法用 Ctrl+Z 撤销
2. **先测试**：使用测试文件验证功能
3. **备份重要文件**：操作前备份 markdown 文件
4. **检查结果**：替换后检查引用是否正确

## 压缩算法说明

### PNG 压缩

```javascript
sharp(inputPath)
  .png({ quality: 75 })
  .toFile(outputPath)
```

**特点**：
- 支持透明度
- 可选有损/无损
- quality 越低，文件越小

### JPG 压缩

```javascript
sharp(inputPath)
  .jpeg({ quality: 75 })
  .toFile(outputPath)
```

**特点**：
- 不支持透明度
- 有损压缩
- 适合照片

### GIF 压缩

```javascript
sharp(inputPath, { animated: true })
  .gif({ colours: 128 })
  .toFile(outputPath)
```

**特点**：
- 保留动画
- 通过减少颜色数压缩
- colours 越少，文件越小

### WebP 压缩

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

## 性能与效率

### 压缩速度

**测试环境**：
- CPU: Intel i5
- 图片: 1920x1080 JPG

**结果**：
- 单张图片：~200ms
- 10 张图片：~2s
- 100 张图片：~20s

### 压缩率对比

| 原格式 | 原大小 | 质量 | 压缩后 | 压缩率 |
|--------|--------|------|--------|--------|
| PNG | 500KB | 75 | 180KB | 64% |
| JPG | 300KB | 75 | 105KB | 65% |
| GIF | 800KB | 128 | 320KB | 60% |
| WebP | 400KB | 75 | 120KB | 70% |

## 常见问题

### Q1：压缩后图片模糊？

**原因**：quality 设置过低

**解决方案**：
```bash
# 提高质量参数
zz tiny -f image.jpg -q 85
```

### Q2：GIF 压缩后颜色失真？

**原因**：colours 设置过低

**解决方案**：
```bash
# 增加保留的颜色数
zz tiny -f animation.gif -c 256
```

### Q3：压缩后文件反而变大？

**可能原因**：
- 原图已经是高度压缩的格式
- quality 设置过高

**解决方案**：
- 使用原图
- 或降低 quality 参数

### Q4：不支持某种图片格式？

**支持格式**：Sharp 库支持的所有格式

**查看支持列表**：
- PNG, JPG, JPEG
- WebP, GIF, TIFF
- SVG, AVIF, HEIF

**不支持**：PSD, AI 等设计源文件

### Q5：批量压缩很慢？

**优化方案**：
- 减少图片数量
- 使用 condition 过滤
- Sharp 已经使用了多线程优化

## 最佳实践

### ✅ 推荐做法

1. **根据用途选择质量**：
   - 网页：70-80
   - 打印：85-95
   - 预览图：60-70

2. **使用 WebP 格式**：
   - 更小的文件
   - 更好的质量
   - 注意浏览器兼容性

3. **批量处理时使用条件过滤**：
   ```bash
   zz tiny -d ./images -co thumbnail
   ```

4. **保留原图**：
   - 压缩生成新文件
   - 原图可作为备份

### ❌ 避免的做法

1. **不要反复压缩**：每次压缩都会损失质量
2. **不要对所有图片使用同一参数**：根据实际需求调整
3. **不要压缩设计源文件**：如 PSD、AI

### 💡 小技巧

1. **找到最佳质量**：
   ```bash
   # 尝试不同质量
   zz tiny -f image.jpg -q 60 -n test60
   zz tiny -f image.jpg -q 70 -n test70
   zz tiny -f image.jpg -q 80 -n test80
   # 对比效果选择最佳参数
   ```

2. **处理大量图片**：
   ```bash
   # 先压缩部分图片测试效果
   zz tiny -d ./images -co sample
   # 确认参数后批量处理
   zz tiny -d ./images -q 75
   ```

3. **Obsidian 工作流**：
   ```bash
   # 一次性处理所有笔记
   for md in notes/*.md; do
     dir="${md%.md}"
     if [ -d "$dir/配图" ]; then
       zz tiny -d "$dir/配图" --replace --replace-file="$md"
     fi
   done
   ```

## 相关命令

- [picgo 命令](./picgo.md) - 上传压缩后的图片到图床
