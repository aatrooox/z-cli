#!/usr/bin/env node
import { Command } from "commander";
// const pkg = require("./package.json");
import { registerCommand, initProgram } from "./command/index.js";
import { translateCmd } from "./command/translate.js";
import { configCmd } from "./command/config.js";
import { setCmd } from "./command/set.js";
import { tinyCmd } from "./command/tiny.js";
import { picgoCmd } from "./command/picgo.js";
import { checkUpdate } from './utils/common.js'
 import { i18nCmd } from "./command/i18n.js";
const program = new Command();

initProgram(program, async () => {
  await checkUpdate()
  registerCommand(program, translateCmd);

  registerCommand(program, setCmd);

  registerCommand(program, configCmd);

  registerCommand(program, tinyCmd);
  registerCommand(program, picgoCmd);
  registerCommand(program, i18nCmd)
  program.parse(process.argv);
});
