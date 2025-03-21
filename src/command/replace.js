import {
  writeFileContent,
  getLocalConfig,
  setHighLightStr,
} from "../utils/common.js";
import {
  requestPicGo,
  checkFileSize,
  checkFileSizeAndFilter,
  uploadFileByPicGo,
  batchUploadByPicGo,
} from "../utils/picgo.js";
import { getFormatedFileSize } from "../utils/file.js";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supportFileTypes = ["png", "jpg", "jpeg", "gif", "webp"];

export const replaceCmd = {
  name: "replace",
  description:
    "替换文字功能, 用于上传后文件后, 自动更换markdown里的图片链接(还在开发中)",
  options: [
    {
      flags: "-f, --file <file>",
      description: "目标文件",
      defaultValue: "",
    },
    {
      flags: "-t, --text <text>",
      description: "要替换的文字",
      defaultValue: "",
    },
    {
      flags: "-nt, --new-text <nextText>",
      description: "替换后的文字内容",
      defaultValue: null,
    },
    {
      flags: "-co, --condition <condition>",
      description: "上传文件夹内所有名称包含[--condition]的图片文件",
      defaultValue: null,
    },
    {
      flags: "-m, --max <max>",
      description: "大于指定大小的图片不会被上传",
      defaultValue: 60,
    },
  ],
  action: async (option) => {
    const spinner = ora();
    const config = await getLocalConfig();
    const { text, newText, file } = option;

    if (!text && !newText && !file) {
      spinner.fail("请指定要替换的文件及替换方式");
      process.exit(1);
    }

    // 绝对路径
    let filePath = path.resolve(process.cwd(), file);

    try {
      // 使用fs.readFileSync读取文件内容
      // let fileContent = fs.readFileSync(filePath);
      // 将文件内容转换为JSON对象
      // fileContent = fileContent.replaceAll(text, newText)
      // replaceFileContent(filePath, [{text, newText}])
    } catch (err) {
      // 如果读取文件失败，则将jsonData初始化为空对象
      jsonData = {};
    }
  },
};
