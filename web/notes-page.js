function escapeHtml(value) {
  return String(value || "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSegments(segments) {
  return (segments || []).map((segment) => {
    const text = escapeText(segment.text);
    return segment.strong ? `<strong>${text}</strong>` : text;
  }).join("");
}

function getArticleBlocks(article) {
  if (Array.isArray(article.content) && article.content.length) return article.content;
  const imagesByPosition = (article.images || []).reduce((groups, image) => {
    const position = Number(image.after) || 0;
    const block = { type: "image", src: image.web || image.src, alt: image.alt || "文章配图" };
    groups[position] = [...(groups[position] || []), block];
    return groups;
  }, {});
  const blocks = [];
  (imagesByPosition[0] || []).forEach((image) => blocks.push(image));
  (article.body || []).forEach((text, index) => {
    blocks.push({ type: "paragraph", segments: [{ text }] });
    (imagesByPosition[index + 1] || []).forEach((image) => blocks.push(image));
  });
  return blocks;
}

function renderArticleBlocks(article) {
  return getArticleBlocks(article).map((block) => {
    if (block.type === "heading") {
      const level = block.level === 3 ? 3 : 2;
      return `<h${level} class="article-subheading">${escapeText(block.text)}</h${level}>`;
    }
    if (block.type === "image") {
      const src = escapeText(block.webSrc || block.src);
      return `<figure class="article-image-wrap"><img class="article-image" src="${src}" alt="${escapeText(block.alt)}" loading="lazy"><figcaption>${escapeText(block.alt)}</figcaption></figure>`;
    }
    if (block.type === "list") {
      return `<ul class="article-list">${(block.items || []).map((item) => `<li>${renderSegments(item)}</li>`).join("")}</ul>`;
    }
    if (block.type === "quote") return `<blockquote class="article-quote">${renderSegments(block.segments)}</blockquote>`;
    if (block.type === "table") {
      const [head, ...rows] = block.rows || [];
      return `<div class="article-table-wrap"><table class="article-table"><thead><tr>${(head || []).map((cell) => `<th>${escapeText(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeText(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return `<p>${renderSegments(block.segments)}</p>`;
  }).join("");
}

const noteFeed = document.querySelector("#noteFeed");
const publishedArticles = window.ARTICLES.filter((article) => !article.status || article.status === "published");

noteFeed.innerHTML = publishedArticles.map((article) => `
  <article id="${escapeHtml(article.id)}" class="note-entry">
    <div class="note-entry-meta">
      <span>${escapeHtml(article.category)}</span>
      <span>${escapeHtml(article.readTime)}</span>
    </div>
    <h2>${escapeHtml(article.title)}</h2>
    <p class="note-entry-excerpt">${escapeHtml(article.excerpt)}</p>
    <div class="note-entry-body">
      ${renderArticleBlocks(article)}
    </div>
  </article>
`).join("");
