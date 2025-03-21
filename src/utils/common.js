import fs from "node:fs";
import ora from "ora";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";
import chalk from "chalk";
import os from "node:os";
import latestVersion from 'latest-version';

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


// 获取 package.json
export function getPackageJson() {
  try {
    const rootDir = path.resolve(__dirname, '../../');
    const packagePath = path.join(rootDir, 'package.json');
    const content = fs.readFileSync(packagePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('读取 package.json 失败:', err);
    return null;
  }
}


// 检查版本更新
// ... 其他代码保持不变 ...

// 检查版本更新
export async function checkUpdate() {
  // 获取缓存目录
  const homeDir = os.homedir();
  const cacheDir = path.join(homeDir, '.zzclub-z-cli');
  const cacheFile = path.join(cacheDir, 'version-cache.json');

  // 检查是否需要更新
  const needCheck = () => {
    try {
      if (!fs.existsSync(cacheFile)) return true;
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      // 24小时内不重复检查
      return Date.now() - cache.lastCheck > 24 * 60 * 60 * 1000;
    } catch (err) {
      return true;
    }
  };

 
    if (!needCheck()) return;

    try {
      const pkg = getPackageJson();
      if (!pkg) return;
      let spinner = ora();
      spinner.start('正在检测版本更新...')
      const latest = await latestVersion('@zzclub/z-cli');
      if (latest !== pkg.version) {
        spinner.warn(chalk.yellow(`\n提示: 发现新版本 ${chalk.green(latest)}，当前版本 ${chalk.red(pkg.version)}\n`))
      } else {
        spinner.succeed('当前为最新版本！')
      }

      // 更新缓存
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, JSON.stringify({
        lastCheck: Date.now(),
        version: latest
      }));

      spinner.stop();
      
    } catch (err) {
      // 静默处理错误
    }
}


export async function checkNodeVersion() {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split('.');
  const major = parseInt(semver[0], 10);
  const minor = parseInt(semver[1], 10);

  if (major < 18 || (major === 18 && minor < 18)) {
    console.error(
      chalk.red('\n❌ Node版本过低：') +
      chalk.yellow('建议升级到 ') + 
      chalk.green('18.18.0') + 
      chalk.yellow(' 或更高版本。\n') +
      chalk.gray('当前版本：') + chalk.red(currentNodeVersion) 
    );
  }
}