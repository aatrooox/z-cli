import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import ora from "ora";

const i18nCmd = {
  name: "i18n",
  aliases: ["i"],
  description: "从 Vue 文件中生成国际化配置文件",
  options: [
    {
      flags: "-f, --file <file>",
      description: "转换文件的路径",
      defaultValue: null,
    },
    {
      flags: "-d, --dir <dirpath>",
      description: "转换文件夹的路径",
      defaultValue: null,
    },
    {
      flags: "-o, --output <output>",
      description: "输出目录",
      defaultValue: "",
    },
  ],
  action: async (option) => {
    let filePath = option.file;
    let dirPath = option.dir;
    let outputDir = option.output;
    let file_spinner = ora();
    
    if (!filePath && !dirPath) {
      file_spinner.fail('请指定文件或目录')
      process.exit(1);
    }

    // 有文件夹路径时忽略文件
    if (dirPath) {
      dirPath = path.resolve(process.cwd(), dirPath);
      let stat;
      try {
        stat = fs.statSync(dirPath);
      } catch (err) {
        file_spinner.fail(`${chalk.red(dirPath)}不存在!`);
        return;
      }

      if (!stat.isDirectory()) {
        file_spinner.fail(`${chalk.red(dirPath)}不是一个文件夹!`);
        return;
      } else {
        let filePaths = [];
        file_spinner.succeed(`开始检索${chalk.red(dirPath)}`);

        // 获取所有 .vue 文件
        getAllVueFiles(dirPath, filePaths);

        if (filePaths.length) {
          file_spinner.succeed(
            `共找到${chalk.red(filePaths.length)}个要处理的文件`
          );
          file_spinner.start();
          
          // 处理所有文件
          const i18nMap = {};
          
          for (const file of filePaths) {
            const content = fs.readFileSync(file, 'utf-8');
            const fileName = path.basename(file, '.vue');
            const i18nKeys = extractI18nKeys(content);
            
            if (i18nKeys.length > 0) {
              file_spinner.succeed(`从 ${chalk.yellow(fileName)} 中提取了 ${chalk.green(i18nKeys.length)} 个国际化键值`);
              
              // 处理每个提取的键值
              for (const key of i18nKeys) {
                await processI18nKey(key, i18nMap);
              }
            }
          }
          
          // 如果没有指定输出目录，使用处理的第一个文件所在目录
          if (!outputDir && filePaths.length > 0) {
            outputDir = path.dirname(filePaths[0]);
          }

          // 生成国际化文件
          await generateI18nFiles(i18nMap, outputDir, file_spinner);
          
          file_spinner.succeed('国际化文件生成完成');
          file_spinner.stop();
        } else {
          file_spinner.warn(
            `未找到任何 .vue 文件`
          );
        }
      }
    } else {
      filePath = path.resolve(process.cwd(), filePath);
      file_spinner.succeed(`正在处理${chalk.yellowBright(filePath)}`);
      file_spinner.start();
      
      // 处理单个 vue 文件
      if (!filePath.endsWith('.vue')) {
        file_spinner.fail('只能处理 .vue 文件');
        return;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.vue');
      const i18nKeys = extractI18nKeys(content);
      
      if (i18nKeys.length > 0) {
        const i18nMap = {};
        
        file_spinner.succeed(`从 ${chalk.yellow(fileName)} 中提取了 ${chalk.green(i18nKeys.length)} 个国际化键值`);
        
        // 处理每个提取的键值
        for (const key of i18nKeys) {
          await processI18nKey(key, i18nMap);
        }
        
        // 如果没有指定输出目录，使用当前处理的文件所在目录
        if (!outputDir) {
          outputDir = path.dirname(filePath);
        }

        // 生成国际化文件
        await generateI18nFiles(i18nMap, outputDir, file_spinner);
        
        file_spinner.succeed('国际化文件生成完成');
      } else {
        file_spinner.warn(`未从 ${chalk.yellow(fileName)} 中找到任何国际化键值`);
      }
      
      file_spinner.stop();
    }
  },
};

/**
 * 递归获取所有 .vue 文件
 * @param {string} dirPath 目录路径
 * @param {Array} filePaths 文件路径数组
 */
function getAllVueFiles(dirPath, filePaths) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllVueFiles(fullPath, filePaths);
    } else if (file.endsWith('.vue')) {
      filePaths.push(fullPath);
    }
  });
}

/**
 * 从 Vue 文件内容中提取国际化键值
 * @param {string} content 文件内容
 * @param {string} ignorePrefix 要忽略的前缀
 * @returns {Array} 提取的键值数组
 */
function extractI18nKeys(content, ignorePrefix = "common") {
  const regex = /\$t\(['"]i18n\.([^'"]+)['"]\)/g;
  const keys = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    // 如果设置了忽略前缀且键以该前缀开头，则跳过
    if (ignorePrefix && key.startsWith(`${ignorePrefix}.`)) {
      continue;
    }
    keys.push(key);
  }
  
  return [...new Set(keys)]; // 去重
}

function unquoteKeys(json) {
  return json.replace(/"(\\[^]|[^\\"])*"\s*:?/g, function (match) {
    if (/:$/.test(match)) {
      return match.replace(/^"|"(?=\s*:$)/g, "");
    } else {
      return match;
    }
  });
}

/**
 * 处理单个国际化键值
 * @param {string} key 键值
 * @param {Object} i18nMap 国际化映射对象
 */
async function processI18nKey(key, i18nMap) {
  // 解析键值 fee-forecast-maintain.placeholder.yearNum
  const parts = key.split('.');
  
  if (parts.length < 2) return;
  
  const fileKey = parts[0]; // fee-forecast-maintain
  const lastKey = parts[parts.length - 1]; // yearNum
  const objKeys = parts.slice(1, parts.length - 1); // ['placeholder']
  
  // 确保文件键存在，并且是一个对象
  if (!i18nMap[fileKey] || typeof i18nMap[fileKey] !== 'object') {
    i18nMap[fileKey] = {};
  }
  
  // 构建嵌套对象
  let current = i18nMap[fileKey];
  for (const objKey of objKeys) {
    if (!current[objKey] || typeof current[objKey] !== 'object') {
      current[objKey] = {};
    }
    current = current[objKey];
  }

  // 设置最终的键值
  if (!current[lastKey]) {
    // 使用键名作为默认值
    current[lastKey] = lastKey;
  }
}

/**
 * 生成国际化文件
 * @param {Object} i18nMap 国际化映射对象
 * @param {string} outputDir 输出目录
 * @param {Object} spinner 加载指示器
 */
async function generateI18nFiles(i18nMap, outputDir, spinner) {
  // 确保输出目录存在
  if (!outputDir) {
    spinner.fail('未指定输出目录');
    return;
  }

  // 确保输出目录存在
  outputDir = path.resolve(process.cwd(), outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 为每个文件键生成文件
  for (const fileKey in i18nMap) {
    const filePath = path.join(outputDir, `${fileKey}.js`);
    // 使用 unquoteKeys 去掉对象键的引号
    const content = `export default ${unquoteKeys(JSON.stringify(i18nMap[fileKey], null, 2))}`;
    
    fs.writeFileSync(filePath, content);
    spinner.succeed(`生成文件: ${chalk.green(filePath)}`);
  }
}

export { i18nCmd };