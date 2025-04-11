import { MD5 } from "./md5.js";
import path from "path";
import { readJsonFile } from "../utils/file.js";
import axios from "axios";
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { getLocalConfig } from "../utils/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let salt = new Date().getTime();
let appid, key;
async function genUser() {
  let config = await getLocalConfig();
  let translateConfig = config.translate;
  appid = translateConfig.account.appId; // appid
  key = translateConfig.account.key; // 密钥
}
function genSign(options) {
  let str1 = appid + options.query + salt + key;
  let sign = MD5(str1);
  return sign;
}

// export async function translate(options) {
//   await genUser();
//   return new Promise((resolve, reject) => {
//     axios({
//       url: "http://api.fanyi.baidu.com/api/trans/vip/translate",
//       method: "get",
//       params: {
//         q: options.query,
//         appid: appid,
//         salt: salt,
//         from: options.from,
//         to: options.to,
//         sign: genSign(options),
//       },
//     })
//       .then((res) => {
//         console.log(res);
//         resolve(res.data);
//       })
//       .catch((err) => {
//         reject("翻译失败" + JSON.stringify(err));
//       })
//       .finally(() => {});
//   });
// }

export async function translate(options) {
  await genUser();
  
  try {
    const params = new URLSearchParams({
      q: options.query,
      appid: appid,
      salt: salt,
      from: options.from,
      to: options.to,
      sign: genSign(options)
    });
    
    const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    throw new Error("翻译失败" + JSON.stringify(error));
  }
}