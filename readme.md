# z-cli

**这是一个效率类命令行工具, 为了解决工作中或个人开发过程中的重复或繁琐问题**

推荐: node >= 18.18.2

## 功能一览

- `translate`: 国际化文件翻译 (英译中)
- `tiny`: 压缩文件。基于sharpjs, sharp支持的文件都可以压缩
- `picgo`: 通过 Picgo 上传到图床
   1. 支持指定文件 -f 上传
   2. 支持指定文件夹 -d 批量上传全部
   3. 支持限制大小 -m 默认只上传60kb以内的图片
   4. 支持模糊匹配 -co 文件名中含有co的图片, 且满足大小限制, 都会被上传

**特别注意:**
**tiny命令不再支持和picgo联动, 仅支持压缩后,自动替换一下md文件里的图片链接, 之后的操作可以用obsidian里的插件[image auto upload Plugin]完成~~**

## Obsidian相关（Alpha）
1. 如果你使用Obsidian编写markdown,本工具还提供了一个压缩=>上传=>自动替换文件路径为外链的联动功能, 请仔细阅读以下!!!
2. 我的设置是: **设置=>文件与连接=>附件默认存放路径=> 当前文件所在文件夹下指定的子文件夹中 =>子文件夹名称: 配图**
   1. 这样做的原因是, 方便你用tiny命令压缩**所有和这篇文章相关的图片**, 当然你自己指定压缩的目录下文件不多的话, 也可以
   2. Obsidian里, 插入本地图片的语法为 `![[demo.png]]` , 此联动功能目前**只支持替换图片名称**, 替换后的字符串为 `![[demo-tiny.png]]`
3. 注意参数要打全, 缺一不可
      1.  使用--replace 参数, 开启替换功能
      2.  使用--replace-file=./xxx.md 参数, 指定需要替换的markdown文件
      3.  正确演示: **zz tiny -d ./demo/md/配图 --replace --replace-file=./demo/md/demo5.md**
4. Obsidian文件替换后, 应该是不能用撤回键回退了, **所以先拿一个没用的文件, 玩明白了再开始搞自己的重要文件, 如有问题, 自己承担!**
5. 第四条不会造成图片文件丢失,只是贴图太多的话,一般图片名称没有规则, 再还原就比较恶心了
6. 压缩完成,替换完成后, 请使用image auto upload 插件来进行上传操作. 后续看能否给作者提PR加入压缩功能
7. **演示文件在demo/md里**


## 安装

```shell
npm i -g @zzclub/z-cli
```

## 翻译功能配置说明
### 初始化翻译平台appId和key

```shell
zz set translate account.appId xxx
zz set translate account.key xxx
```

### 在哪里可以创建appId和key

> 请使用前仔细阅读百度翻译开发平台相关规则

[百度翻译开放平台](https://fanyi-api.baidu.com/api/trans/product/desktop)

1. 注册
2. 实名认证
   1. 标准版 qbs 1  每月5万字符
   2. 高级版 qbs 10 每月100万字符
3. 开通通用文本翻译功能
4. 生成appId和key
5. 生成后的文件请仔细检查，有可能会有遗漏的翻译，如有，重新执行即可
6. 注意: 百度翻译的api有一定的调用限制, 请自行评估是否需要使用高级版

### 翻译单个文件

```shell
zz translate -f ./yourfile.js
# 会在同级目录下生成 yourfile-en.js
```
如test.js
```js
export default {
    isok: '早早下班',
    common: {
        listTitle: '标题',
        addTitle: '测试'
    },
    test: {
        a: {
            b: {
                c: '哈哈哈'
            }
        },
        aaa: {
            value: '输入'
        }
    }
}
```
输出文件为test-en.js, 内容如下
```js
export default {
    isok: "Leave work early",
    common: {
        listTitle: "title",
        addTitle: "test"
    },
    test: {
        a: {
            b: {
                c: "Hahaha"
            }
        },
        aaa: {
            value: "input"
        }
    }
}
```
### 批量翻译

> 检索目标文件夹内所有langs文件夹下的zh-CN 文件夹下的所有文件, 输出至其同级的en-US下, 文件名同名

```shell
zz translate -d ./demo
```
如: demo文件夹是以下结构, zh-CN中所有JS会翻译后输出至en-US

每个文件输出内容同翻译单个文件

```bash
.
├── en-US
│   ├── test.js
│   ├── test2.js
│   └── test3.js
├── test-en.js
├── test.js
└── zh-CN
    ├── test.js
    ├── test2.js
    └── test3.js


```
## 压缩图片

使用help命令查看所有支持的功能
```
zz tiny --help

  -t, --type <fileType>         转换后的图片类型 (default: null)
  -f, --file <file>             要压缩的图片文件 (default: null)
  -d, --dir <dir>               压缩文件夹内所有文件 (default: null)
  -co, --condition <condition>  压缩文件夹内所有名称包含[--condition]的图片文件 (default: null)
  -q, --quality <quality>       压缩质量(1-100) (default: 75)
  -c, --colours <colours>       GIF色彩保留(2-256) (default: 128)
  -n, --name <name>             指定文件名输出 (default: "")
  -m, --max <max>               限制要上传的文件大小(kb)(仅当开启 --picgo 时会用到) (default: 60)
  --picgo [type]                调用picgo (无参数) (default: null)
  --no-picgo [type]             不调用picgo (无参数) (default: null)
  -h, --help                    display help for command
```

## 通过PicGo上传到图床

**此功能通过Http请求的方式调用Picgo Server, 所以需要本地已经安装并启动Picgo, 并已经配置好了图床**

使用help命令查看所有支持的功能

```
Options:
  -f, --file <file>             要上传的图片文件 (default: null)
  -d, --dir <dir>               上传文件夹内所有图片文件 (default: null)
  -co, --condition <condition>  上传文件夹内所有名称包含[--condition]的图片文件 (default: null)
  -m, --max <max>               大于指定大小(kb)的图片不会被上传 (default: 60)
  -h, --help                    display help for command
```

## 提出新需求、定制

欢迎提出新需求，只要合理、常见，我会尽快集成。

或有定制需求

请联系V详谈: 523748995

## 免责声明

任何用户在使用 z-cli 前，请您仔细阅读并透彻理解本声明。您可以选择不使用 z-cli ，若您一旦使用 z-cli ，您的使用行为即被视为对本声明全部内容的认可和接受。

1. 任何单位或个人因下载使用 z-cli 而产生的任何意外、疏忽、合约毁坏、诽谤、版权或知识产权侵犯及其造成的损失 (包括但不限于直接、间接、附带或衍生的损失等)，本人不承担任何法律责任。

2. 任何单位或个人不得在未经本团队书面授权的情况下对 z-cli 工具本身申请相关的知识产权。

3. 如果本声明的任何部分被认为无效或不可执行，则该部分将被解释为反映本人的初衷，其余部分仍具有完全效力。不可执行的部分声明，并不构成我放弃执行该声明的权利。

## LICENSE

[MIT](/LICENSE)