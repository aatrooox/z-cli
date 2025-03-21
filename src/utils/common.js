import fs from "node:fs";
import ora from "ora";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";
import chalk from "chalk";
import os from "node:os";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const defaultConfig = {
  "translate": {
    "sourceDirName": "zh-CN",
    "targetDirName": "en-US",
    "ignoreFiles": ["node_modules"],
    "account": {
      "appId": "",
      "key": ""
    }
  },
  "editableConfig": ["translate"]
}

export async function getLocalConfig() {
  let spinner = ora();
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.zzclub-z-cli');
  const configPath = path.join(configDir, 'config.json');
  let config = {}
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(content);
    } catch (err) {
      spinner.fail('读取配置文件失败:' + JSON.stringify(err));
      process.exit(1);
    }
  } else {
    spinner.warn('未找到配置文件，正在初始化默认配置');

   

    config = setLocalConfig(defaultConfig, spinner);
  }

  return config;
}

/**
 * 写入文件
 * @param filePath 文件路径
 * @param fileContent 文件内容
 * @param onFinally 完成时回调
 */
export function writeFileContent(filePath, fileContent, onFinally = () => {}) {
  let spinner = ora();
  fs.writeFile(filePath, fileContent, "utf-8", (error) => {
    if (!error) {
      //   spinner.succeed(`已写入${chalk.yellow(filePath)}`);
      onFinally && onFinally(spinner, true);
    } else {
      console.log(error);
      //   spinner.fail(`写入${chalk.red(filePath)}文件失败, 请重试`);
      onFinally && onFinally(spinner, false);
    }
  });
}

export const readJsonFile = async (filePath) => {
  let jsonData;
  try {
    let jsonStr = fs.readFileSync(filePath);
    jsonData = JSON.parse(jsonStr.toString());
  } catch (err) {
    jsonData = {};
  }
  return jsonData;
};

export const setHighLightStr = (
  sourceText,
  hightlightText,
  chalkFn = chalk.red
) => {
  let index = sourceText.indexOf(hightlightText);
  if (index === -1) return sourceText;
  return sourceText.replaceAll(hightlightText, chalkFn(hightlightText));
};

// 
export async function setLocalConfig(newConfig = {}, spinner) {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.zzclub-z-cli');
  const configPath = path.join(configDir, 'config.json');
  
  // 确保配置目录存在
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 读取已存在的配置
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(content);
    } catch (err) {
      spinner && spinner.fail('读取配置文件失败')
      process.exit(1);
    }
  }

  config = {
    ...config,
    ...newConfig,
    translate: {
      ...config.translate,
      ...newConfig.translate,
      account: {
        ...(config.translate?.account || {}),
        ...newConfig.translate.account,
      }
    }
  };

  // 保存配置
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  spinner && spinner.succeed(`配置文件已更新：${chalk.yellow(configPath)}`)
  return config;
}