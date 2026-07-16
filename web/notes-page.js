function escapeHtml(value) {
  return String(value || "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const noteFeed = document.querySelector("#noteFeed");
const publishedArticles = window.ARTICLES.filter((article) => !article.status || article.status === "published");

noteFeed.innerHTML = publishedArticles.map((article) => `
  <article id="${escapeHtml(article.id)}" class="note-entry">
    <div class="note-entry-meta">
      <span>${escapeHtml(article.category)}</span>
      <span>${escapeHtml(article.date)} · ${escapeHtml(article.readTime)}</span>
    </div>
    <h2>${escapeHtml(article.title)}</h2>
    <p class="note-entry-excerpt">${escapeHtml(article.excerpt)}</p>
    <div class="note-entry-body">
      ${article.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
  </article>
`).join("");
