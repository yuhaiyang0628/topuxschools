import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(root, "content/article-sources/tud");
const outputPath = resolve(root, "content/rich-articles.js");

function parseSegments(value) {
  const segments = [];
  const matcher = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  let match;
  while ((match = matcher.exec(value))) {
    if (match.index > cursor) segments.push({ text: value.slice(cursor, match.index) });
    segments.push({ text: match[1], strong: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
  return segments.length ? segments : [{ text: value }];
}

function parseTableRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdown(source) {
  const blocks = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let paragraph = [];
  let listItems = [];
  let quoteLines = [];
  let tableRows = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", segments: parseSegments(text) });
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", items: listItems.map(parseSegments) });
    listItems = [];
  };
  const flushQuote = () => {
    const text = quoteLines.join(" ").trim();
    if (text) blocks.push({ type: "quote", segments: parseSegments(text) });
    quoteLines = [];
  };
  const flushTable = () => {
    if (tableRows.length) blocks.push({ type: "table", rows: tableRows });
    tableRows = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    const list = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(trimmed);
    const quote = /^>\s?(.+)$/.exec(trimmed);

    if (/^---+$/.test(trimmed)) {
      flushAll();
    } else if (heading) {
      flushAll();
      if (heading[1].length > 1 || index !== 0) {
        blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      }
    } else if (image) {
      flushAll();
      const fileName = image[2].replace(/^images\//, "");
      const miniFileName = `${fileName.replace(/\.[^.]+$/, "")}.jpg`;
      blocks.push({
        type: "image",
        miniSrc: `/article-package/assets/article-mini/tud-series/${miniFileName}`,
        webSrc: `assets/articles/tud-series/${fileName}`,
        alt: image[1]
      });
    } else if (trimmed.startsWith("|")) {
      flushParagraph();
      flushList();
      flushQuote();
      if (!isTableDivider(trimmed)) tableRows.push(parseTableRow(trimmed));
    } else if (quote) {
      flushParagraph();
      flushList();
      flushTable();
      quoteLines.push(quote[1]);
    } else if (list) {
      flushParagraph();
      flushQuote();
      flushTable();
      listItems.push(list[1]);
    } else if (!trimmed) {
      flushAll();
    } else {
      paragraph.push(trimmed);
    }
  });
  flushAll();
  return blocks;
}

export async function buildRichArticles() {
  const manifest = JSON.parse(await readFile(resolve(sourceDir, "manifest.json"), "utf8"));
  const articles = await Promise.all(manifest.map(async (entry) => {
    const markdown = await readFile(resolve(sourceDir, entry.sourceFile), "utf8");
    const { sourceFile, ...article } = entry;
    return { ...article, status: "published", content: parseMarkdown(markdown) };
  }));
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `// Generated from content/article-sources/tud. Do not edit manually.\nwindow.RICH_ARTICLES = ${JSON.stringify(articles, null, 2)};\n`, "utf8");
  return articles;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildRichArticles().then((articles) => {
    console.log(`Built ${articles.length} rich articles.`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
