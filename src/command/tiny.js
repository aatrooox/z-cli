import {
  writeFileContent,
  getLocalConfig,
  setHighLightStr,
} from "../utils/common.js";

import { getFormatedFileSize, replaceFileContent } from "../utils/file.js";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import sharp from "sharp";
import { picgoCmd } from "./picgo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supportFileTypes = ["png", "jpg", "jpeg", "gif", "webp"];

export const tinyCmd = {
  name: "tiny",
  description: "压缩图片",
  options: [
    {
      flags: "-t, --type <fileType>",
      description: "转换后的图片类型",
      defaultValue: null,
    },
    {
      flags: "-f, --file <file>",
      description: "要压缩的图片文件",
      defaultValue: null,
    },
    {
      flags: "-d, --dir <dir>",
      description: "压缩文件夹内所有文件",
      defaultValue: null,
    },
    {
      flags: "-co, --condition <condition>",
      description: "压缩文件夹内所有名称包含[--condition]的图片文件",
      defaultValue: null,
    },
    {
      flags: "-q, --quality <quality>",
      description: "压缩质量(1-100)",
      defaultValue: 75,
    },
    {
      flags: "-c, --colours <colours>",
      description: "GIF色彩保留(2-256)",
      defaultValue: 128,
    },
    {
      flags: "-n, --name <name>",
      description: "指定文件名输出",
      defaultValue: "",
    },
    {
      flags: "-m, --max <max>",
      description: "限制要上传的文件大小(仅当开启 --picgo 时会用到)",
      defaultValue: 60,
    },
    {
      flags: "--picgo [type]",
      description: "是否调用picgo",
      defaultValue: null,
    },
    {
      flags: "--no-picgo [type]",
      description: "是否调用picgo",
      defaultValue: null,
    },
    {
      flags: "-ref, --replace-file <replaceFile>",
      description: "要替换内容的文件",
      defaultValue: "",
    },
    {
      flags: "--no-replace [type]",
      description:
        "是否替换指定文件的内容, 替换规则斤仅针对Obsidian, 请看readme.md",
      defaultValue: null,
    },
    {
      flags: "--replace [type]",
      description:
        "是否替换指定文件的内容, 替换规则斤仅针对Obsidian, 请看readme.md",
      defaultValue: null,
    },
  ],
  action: async (option) => {
    let spinner = ora();
    let config = await getLocalConfig();
    // console.log(`OPTION`, option);
    let { type, file, dir, condition, quality, colours } = option;

    if (!file && !dir && !condition) {
      spinner.fail("请指定要压缩的文件(--file=xxx)或文件夹(--dir=/a/b)");
      process.exit(1);
    }

    // 是否需要替换内容, true时 需要收集list<Map>
    let isNeedUploadAndReplace = !!(
      //   option.picgo &&
      (option.replace && option.replaceFile)
    );
    let replaceMaps = [];

    function collectReplaceMaps(replaceMaps, { text, newText }) {
      if (isNeedUploadAndReplace) {
        let map = {
          text, // obsidian md 文件中 粘贴后的 值
          newText, // 此时是压缩后的文件名, 在picgo里再替换成上传后的
        };
        replaceMaps.push(map);
      }
    }
    async function tinyFile(file, statisticsCount, options = {}) {
      try {
        let stats = fs.statSync(file);
        let isFile = stats.isFile();
        if (isFile) {
          // 文件类型
          let extname = path.extname(file);
          // 带后缀的文件名
          let fileName = path.basename(file)?.split(".")[0];
          // 文件路径
          let dirPath = path.dirname(file);
          // 文件类型
          let filetype = extname.slice(1);
          let fileSize = stats.size;
          let beforeSize = getFormatedFileSize(fileSize);
          // 是否在支持的格式里
          // 如果正在批量压缩, 并且要求指定名称输出, 则加一个index后缀, 避免重名
          let customFileName;
          if (options.count && options.count > 1 && option.name) {
            customFileName = `${option.name}${options.order + 1}`;
          } else {
            customFileName = option.name || `${fileName}-tiny`;
          }

          let outputPath =
            path.resolve(process.cwd(), dirPath) +
            "/" +
            customFileName +
            extname;
          let inputPath = path.resolve(process.cwd(), file);
          if (extname.slice(1) === "gif") {
            //   console.log(`option.colours`, option.colours);
            await sharp(inputPath, {
              animated: true,
              limitInputPixels: false,
            })
              .gif({
                colours: +option.colours,
              })
              .toFile(outputPath);
            let afterStats = fs.statSync(outputPath);
            let afterSize = getFormatedFileSize(afterStats.size);
            let offPercent = ((1 - afterStats.size / fileSize) * 100).toFixed(
              2
            );
            spinner.succeed(
              `${chalk.red(beforeSize)} ${chalk.yellowBright(
                "=>"
              )} ${chalk.green(afterSize)} (${
                offPercent >= 0 ? chalk.green("↓") : chalk.red("↑")
              }${Math.abs(offPercent)}%)【 ${customFileName}${extname} 】`
            );
            // 收集压缩前后的文件名映射关系
            collectReplaceMaps(replaceMaps, {
              text: `${path.basename(file)}`,
              newText: `${customFileName}${extname}`,
            });
            statisticsCount.ok++;
            statisticsCount.okFiles.push(outputPath);
          } else {
            if (sharp(inputPath)[filetype]) {
              await sharp(path.resolve(process.cwd(), file))
                [filetype]({ quality: +quality })
                .toFile(outputPath);
              let afterStats = fs.statSync(outputPath);
              let afterSize = getFormatedFileSize(afterStats.size);
              let offPercent = ((1 - afterStats.size / fileSize) * 100).toFixed(
                2
              );
              spinner.succeed(
                `${chalk.red(beforeSize)} ${chalk.yellowBright(
                  "=>"
                )} ${chalk.green(afterSize)} (${
                  offPercent >= 0 ? chalk.green("↓") : chalk.red("↑")
                }${Math.abs(offPercent)}%)【 ${customFileName}${extname} 】`
              );
              // 收集压缩前后的文件名映射关系
              collectReplaceMaps(replaceMaps, {
                text: `${path.basename(file)}`,
                newText: `${customFileName}${extname}`,
              });
              statisticsCount.ok++;
              statisticsCount.okFiles.push(outputPath);
            } else {
              spinner.fail(
                `不支持此文件类型[${filetype || fileName || file}]!`
              );
              statisticsCount.error++;
              statisticsCount.okFiles.push(outputPath);
            }
          }
        }
      } catch (err) {
        // console.log(`err`, err);
        spinner.fail("出错啦, 文件不存在或不支持此类型 \n" + err);
        statisticsCount.error++;
        statisticsCount.errFiles.push(outputPath);
      }
    }

    let statisticsCount = {
      ok: 0,
      okFiles: [],
      err: 0,
      errFiles: [],
    };
    // 指定了文件, 压缩
    if (file) {
      await tinyFile(file, statisticsCount);
    }

    // 指定文件夹, 翻译文件夹内所有文件
    if (dir || condition) {
      let inputDirPath = dir || "./";
      let files;
      try {
        // 读取所有文件
        files = fs.readdirSync(inputDirPath);
        // spinner.succeed(`共有${files.length}个文件`);
      } catch (err) {
        spinner.fail("出错啦, 文件夹似乎不存在");
        process.exit(1);
      }

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let filePath = path.join(inputDirPath, file);
        let stats = fs.statSync(filePath);
        if (stats.isFile()) {
          if (condition) {
            let fileName = path.basename(file);
            let index = fileName.indexOf(condition);
            if (index > -1) {
              let tip = setHighLightStr(fileName, condition);
              spinner.succeed(`${tip}正在压缩`);
              await tinyFile(filePath, statisticsCount, {
                count: files.length,
                order: i,
              });
            }
          } else {
            spinner.succeed(`正在压缩:${file}`);
            await tinyFile(filePath, statisticsCount, {
              count: files.length,
              order: i,
            });
          }
        } else {
          spinner.fail(`${filePath}不是文件`);
        }
      }
      spinner.succeed(`压缩成功 ${chalk.green(statisticsCount.ok)} 个`);
    }

    // 自动替换wiki链接
    // 因为obsidian里已经有了一个插件, 可以自动上传到picgo并替换链接, 功能重复度很高
    // 后续考虑给作者提个pr, 加入压缩功能
    // console.log(`fileMaps`, replaceMaps);
    if (option.replace) {
      // 上传成功改的图片文件
      let tinyFiles = statisticsCount.okFiles;
      if (tinyFiles && tinyFiles.length) {
        // await batchUploadByPicGo(tinyFiles, option);
        if (!option.replace) process.exit(1);
        spinner.start("开始替换文件内容, 替换后请仔细检查!");
        console.log(`replaceMaps`, replaceMaps);
        const fileContent = await replaceFileContent(
          option.replaceFile,
          replaceMaps
        );
        console.log(`fileContent`, fileContent);
        if (!fileContent) {
          spinner.fail("替换文件内容失败! 请检查要替换的文件是否存在!");
          process.exit(1);
        }
        try {
          fs.writeFileSync(option.replaceFile, fileContent, "utf-8");
          spinner.succeed(
            `[${chalk.red(
              path.basename(option.replaceFile)
            )}]图片链接替换完成!请前往检查!`
          );
        } catch (err) {
          spinner.fail("图片链接替换失败!");
        }
      }
      // 处理完后不再上传picgo
      process.exit(1);
    }
    // 自动上传至picgo
    if (option.picgo) {
      spinner.start(`正在连接picgo`);
      await picgoCmd.action({
        tinyFiles: statisticsCount.okFiles,
        max: option.max,
        replace: isNeedUploadAndReplace,
        replaceFile: option.replaceFile,
        replaceMaps,
      });
      spinner.stop();

      // 只有开启了picgo后时 才会使用替换功能 后续替换功能会独立出去 目前仅为满足自己所需
      //   if (option.replace && option.replaceFile) {
      //     spinner.start(`开始替换内容, 替换后请仔细检查!`);
      //   }
    }
  },
};
