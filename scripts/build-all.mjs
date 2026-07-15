import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const scripts = ["build-web.mjs", "build-miniprogram-content.mjs"];

function runScript(fileName) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(scriptsDir, fileName)], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${fileName} exited with code ${code}`));
    });
  });
}

async function main() {
  for (const script of scripts) {
    await runScript(script);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
