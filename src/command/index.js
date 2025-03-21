import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ora from "ora";
import { readJsonFile } from "../utils/common.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const registerCommand = (program, config) => {
  let app = program.command(config.name).description(config.description);

  if (config.alias) {
    app.alias(config.alias);
  }
  
  config.options.forEach((option) => {
    app.option(option.flags, option.description, option.defaultValue);
  });

  app.action(config.action);
};

export const initProgram = async (program, cb) => {
  readJsonFile(path.resolve(__dirname, "../../package.json")).then((pkg) => {
    program.usage("<command> [options]");
    program.version(pkg.version);

    cb && cb();
  });
};
