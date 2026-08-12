import { copyFile, mkdir, readFile, readdir, rmdir, stat, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { buildRichArticles } from "./build-rich-articles.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "web");
const contentDir = resolve(root, "content");
const outputDir = resolve(root, "dist");
const webFiles = ["index.html", "notes.html", "styles.css", "app.js", "notes-page.js"];
const contentFiles = ["programs.js", "case-studies.js", "rich-articles.js", "articles.js"];

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

async function copyDirectory(sourcePath, outputPath) {
  await mkdir(outputPath, { recursive: true });
  const entries = await readdir(sourcePath);
  await Promise.all(entries.map(async (entry) => {
    const sourceEntry = resolve(sourcePath, entry);
    const outputEntry = resolve(outputPath, entry);
    if ((await stat(sourceEntry)).isDirectory()) {
      await copyDirectory(sourceEntry, outputEntry);
    } else {
      await copyFile(sourceEntry, outputEntry);
    }
  }));
}

async function main() {
  await buildRichArticles();
  await rmdir(outputDir, { recursive: true }).catch(() => {});
  await mkdir(resolve(outputDir, "content"), { recursive: true });

  await Promise.all(webFiles.map(copyWebFile));
  await Promise.all(contentFiles.map((fileName) => copyFile(
    resolve(contentDir, fileName),
    resolve(outputDir, "content", fileName)
  )));
  await copyDirectory(resolve(sourceDir, "assets"), resolve(outputDir, "assets"));
  await copyDirectory(resolve(sourceDir, "images"), resolve(outputDir, "images"));

  console.log(`Built Web output in ${outputDir}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
