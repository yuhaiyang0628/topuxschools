import { copyFile, mkdir, readFile, rmdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "web");
const contentDir = resolve(root, "content");
const outputDir = resolve(root, "dist");
const webFiles = ["index.html", "notes.html", "styles.css", "app.js", "notes-page.js"];
const contentFiles = ["programs.js", "case-studies.js", "articles.js"];

async function copyWebFile(fileName) {
  const sourcePath = resolve(sourceDir, fileName);
  const outputPath = resolve(outputDir, fileName);
  await mkdir(dirname(outputPath), { recursive: true });

  if (!fileName.endsWith(".html")) {
    await copyFile(sourcePath, outputPath);
    return;
  }

  const source = await readFile(sourcePath, "utf8");
  const built = source.split("../content/").join("content/");
  await writeFile(outputPath, built, "utf8");
}

async function main() {
  await rmdir(outputDir, { recursive: true }).catch(() => {});
  await mkdir(resolve(outputDir, "content"), { recursive: true });

  await Promise.all(webFiles.map(copyWebFile));
  await Promise.all(contentFiles.map((fileName) => copyFile(
    resolve(contentDir, fileName),
    resolve(outputDir, "content", fileName)
  )));

  console.log(`Built Web output in ${outputDir}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
