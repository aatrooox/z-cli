import { writeFileContent, getLocalConfig, readJsonFile, setLocalConfig } from "../utils/common.js";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import fs, { lchown } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function checkFilepath(filePath, configName, spinner) {
  if (!filePath) {
    let caseText;
    if (configName === "export") {
      caseText = `导出到指定目录 => zz config export /home/data`;
    }
    if (configName === "import") {
      caseText = `导入指定配置文件 => zz config import /home/data/我的配置.json`;
    }
    spinner.fail("请指定文件路径后重试, 如:" + caseText);
    return false;
  }

  return true;
}
export const configCmd = {
  name: "config <configName> [payload...]",
  description:
    "全局config.json的导入[import]/导出[export]/还原[reset] \n如: zz config import ./abc.json",
  options: [],
  action: async (configName, payload, cmd) => {
    let config_spinner = ora();
    let config = await getLocalConfig();
    let filePath = payload[0];
    switch (configName) {
      // 导出config
      case "export":
        //导出
        if (checkFilepath(filePath, configName, config_spinner)) {
          try {
            let stats = fs.statSync(filePath);
            let isDir = stats.isDirectory();
            if (isDir) {
              // 有效的文件夹路径, 无文件名, 生成默认的json名
              filePath = path.resolve(
                __dirname,
                filePath,
                "zzclub-z-cli.json"
              );
              fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                "utf-8"
              );
              config_spinner.succeed(`导出配置成功! [${filePath}]`);
            }
          } catch (error) {
            config_spinner.fail(`不存在的文件夹路径: [${filePath}]`);
          }
        }
        process.exit(1);
      case "import":
        //导入
        if (checkFilepath(filePath, configName, config_spinner)) {
          try {
            let stats = fs.statSync(filePath);
            let isFile = stats.isFile();
            if (isFile) {
              let extname = path.extname(filePath);
              if (extname !== ".json") {
                config_spinner.fail(`只支持导入json文件: [${filePath}]`);
                process.exit(1);
              }
              let localConfig = await readJsonFile(filePath);
              let result = Object.assign({}, config, localConfig);
              
              setLocalConfig(result, config_spinner)
              config_spinner.succeed(`导入配置成功!`);
            } else {
              config_spinner.fail(`不存在的文件路径: [${filePath}]`);
            }
          } catch (error) {
            config_spinner.fail(`不存在的文件路径: [${filePath}]`);
          }
        }
        process.exit(1);
      case "reset":
        //重置
        setLocalConfig({}, config_spinner)
        config_spinner.succeed(`已重置为默认配置!`);
        process.exit(1);
    }

    config_spinner.fail(`不存在操作: [${configName}]`);
    process.exit(1);
  },
};
