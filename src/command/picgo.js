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
import { getFormatedFileSize, replaceFileContent } from "../utils/file.js";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supportFileTypes = ["png", "jpg", "jpeg", "gif", "webp"];

export const picgoCmd = {
  name: "picgo",
  description: "上传图片(此命令暂时废弃, 原因见readme)",
  options: [
    {
      flags: "-f, --file <file>",
      description: "要上传的图片文件",
      defaultValue: null,
    },
    {
      flags: "-d, --dir <dir>",
      description: "上传文件夹内所有文件",
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
  action: async (option, test) => {
    const spinner = ora();
    const config = await getLocalConfig();
    const { file, dir, condition, tinyFiles } = option;

    if (!file && !dir && !condition && (!tinyFiles || !tinyFiles.length)) {
      spinner.fail("请指定要上传的文件(--file=xxx)或文件夹(--dir=/a/b)");
      process.exit(1);
    }

    // const _replaceMaps = replaceMaps.concat();
    // 从压缩命令调用过来的
    if (tinyFiles && tinyFiles.length) {
      await batchUploadByPicGo(tinyFiles, option);
      if (!option.replace) process.exit(1);
      spinner.start("开始替换文件内容, 替换后请仔细检查!");
      const fileContent = await replaceFileContent(
        option.replaceFile,
        option.replaceMaps
      );
      if (!fileContent) {
        spinner.fail("替换文件内容失败! 请检查要替换的文件是否存在!");
        process.exit(1);
      }
      fs.writeFile(option.replaceFile, fileContent, "utf-8", (error) => {
        if (!error) {
          spinner.succeed(
            `[${chalk.red(
              path.basename(option.replaceFile)
            )}]图片链接替换完成!请前往检查!`
          );
        } else {
          console.log(error);
          //   spinner.fail(`写入${chalk.red(filePath)}文件失败, 请重试`);
          spinner.fail("图片链接替换失败!");
        }
        process.exit(1);
      });
    }
    // 指定文件上传
    if (file) {
      await uploadFileByPicGo(file, option);
      process.exit(1);
    }

    // 指定文件夹, 翻译文件夹内所有文件
    if (dir || condition) {
      let inputDirPath = dir || "./";
      let files;
      try {
        // 读取所有文件
        files = fs.readdirSync(inputDirPath);
        files = files.map((filePath) =>
          path.resolve(process.cwd(), inputDirPath, filePath)
        );

        files = files.filter((f) => {
          let fileName = path.basename(f);
          let index = fileName.indexOf(condition);
          return index !== -1;
        });
        await batchUploadByPicGo(files, option);
        // spinner.succeed(`共有${files.length}个文件${files}`);
      } catch (err) {
        spinner.fail("出错啦, 文件夹似乎不存在");
        process.exit(1);
      }

      process.exit(1);
    }
  },
};
