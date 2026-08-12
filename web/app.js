const rowsEl = document.querySelector("#programRows");
const panel = document.querySelector("#detailPanel");
const panelContent = document.querySelector("#detailContent");
const closePanel = document.querySelector("#closePanel");
const overlay = document.querySelector("#overlay");
const searchInput = document.querySelector("#searchInput");
const programPagination = document.querySelector("#programPagination");
const caseSearchInput = document.querySelector("#caseSearchInput");
const caseRegionFilters = document.querySelector("#caseRegionFilters");
const caseGrid = document.querySelector("#caseGrid");
const caseResults = document.querySelector("#caseResults");
const casePagination = document.querySelector("#casePagination");
const articleGrid = document.querySelector("#articleGrid");
const tabs = Array.from(document.querySelectorAll(".tab"));
const filters = Array.from(document.querySelectorAll(".filter"));

let activeRegion = "";
let activeFilter = "all";
let activeProgramPage = 1;
let activeCaseRegion = null;
let activeCasePage = 1;
let programPageSize = 20;
let casePageSize = 6;
const PROGRAM_PAGE_SIZES = [20, 40, 60];
const CASE_PAGE_SIZES = [6, 9, 12];

function valueOrDash(value) {
  return value || "-";
}

function escapeHtml(value) {
  return String(valueOrDash(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  const url = String(valueOrDash(value));
  return /^https?:\/\//i.test(url) ? url : "#";
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

function isPublished(item) {
  return !item.status || item.status === "published";
}

function matchesFilter(program) {
  if (activeFilter === "all") return true;
  if (activeFilter === "portfolio") return program.tags.includes("portfolio");
  if (activeFilter === "stem") return program.stem;
  if (activeFilter === "rolling") return program.tags.includes("rolling");
  if (activeFilter === "no-gre") return program.tags.includes("no-gre");
  return program.tags.includes(activeFilter);
}

function matchesRegion(program) {
  return !activeRegion || program.region === activeRegion;
}

function matchesSearch(program) {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return true;
  return [
    program.school,
    program.schoolCn,
    program.program,
    program.programShort,
    program.location,
    program.country,
    program.note,
    program.region
  ].join(" ").toLowerCase().includes(query);
}

function renderRows() {
  const programs = window.PROGRAMS
    .filter(isPublished)
    .filter(matchesRegion)
    .filter(matchesFilter)
    .filter(matchesSearch);
  const totalPages = Math.max(1, Math.ceil(programs.length / programPageSize));
  activeProgramPage = Math.min(activeProgramPage, totalPages);
  const start = (activeProgramPage - 1) * programPageSize;
  const pagePrograms = programs.slice(start, start + programPageSize);

  rowsEl.innerHTML = pagePrograms.map((program, index) => `
    <tr data-id="${program.id}" tabindex="0">
      <td>${start + index + 1}</td>
      <td>
        <div class="school-cell">
          <span class="school-logo">${escapeHtml(program.short)}</span>
          <div>
            <strong>${escapeHtml(program.school)}</strong>
            <small>${escapeHtml(program.schoolCn)}</small>
          </div>
        </div>
      </td>
      <td class="program-name">${escapeHtml(program.program)}</td>
      <td>${escapeHtml(program.length)}</td>
      <td>${escapeHtml(program.tuition)}</td>
      <td>${escapeHtml(program.location)}</td>
      <td>${escapeHtml(program.ielts)}</td>
      <td>${escapeHtml(program.toefl)}</td>
      <td>${escapeHtml(program.gre)}</td>
      <td><span class="pill ${program.tags.includes("portfolio") ? "" : "warn"}">${escapeHtml(program.portfolio)}</span></td>
      <td>${escapeHtml(program.deadline)}</td>
    </tr>
  `).join("");

  if (!programs.length) {
    rowsEl.innerHTML = `<tr><td colspan="11">没有匹配的项目。换一个关键词或筛选条件试试。</td></tr>`;
  }

  renderProgramPagination(programs.length, totalPages);
}

function getVisiblePageItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages]);
  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  } else if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  } else {
    [currentPage - 1, currentPage, currentPage + 1].forEach((page) => pages.add(page));
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  return sortedPages.reduce((items, page, index) => {
    if (index && page - sortedPages[index - 1] > 1) items.push("ellipsis");
    items.push(page);
    return items;
  }, []);
}

function renderPagination({ currentPage, totalPages, pageAttribute, pageSize, pageSizeAttribute, pageSizes, pageSizeLabel }) {
  const pageButtons = getVisiblePageItems(currentPage, totalPages).map((item) => {
    if (item === "ellipsis") return '<span class="page-ellipsis" aria-hidden="true">…</span>';
    return `<button class="page-number ${item === currentPage ? "active" : ""}" type="button" ${pageAttribute}="${item}" ${item === currentPage ? "aria-current=\"page\"" : ""}>${item}</button>`;
  }).join("");
  const pageSizeOptions = pageSizes.map((size) => `<option value="${size}" ${size === pageSize ? "selected" : ""}>${size} 条/页</option>`).join("");

  return `
    <div class="page-controls">
      <button class="page-arrow" type="button" ${pageAttribute}="${currentPage - 1}" aria-label="上一页" ${currentPage === 1 ? "disabled" : ""}>‹</button>
      ${pageButtons}
      <button class="page-arrow" type="button" ${pageAttribute}="${currentPage + 1}" aria-label="下一页" ${currentPage === totalPages ? "disabled" : ""}>›</button>
      <select class="page-size-select" ${pageSizeAttribute} aria-label="${pageSizeLabel}">${pageSizeOptions}</select>
    </div>
  `;
}

function renderProgramPagination(totalPrograms, totalPages) {
  if (!totalPrograms) {
    programPagination.innerHTML = "";
    return;
  }
  programPagination.innerHTML = renderPagination({
    currentPage: activeProgramPage,
    totalPages,
    pageAttribute: "data-page",
    pageSize: programPageSize,
    pageSizeAttribute: "data-program-page-size",
    pageSizes: PROGRAM_PAGE_SIZES,
    pageSizeLabel: "每页显示项目数量"
  });
}

function renderProgramPanel(program) {
  panelContent.innerHTML = `
    <div class="panel-head">
      <p class="panel-kicker">学校项目</p>
      <div class="panel-school">
        <span class="school-logo">${escapeHtml(program.short)}</span>
        <span>${escapeHtml(program.school)} / ${escapeHtml(program.schoolCn)}</span>
      </div>
      <h2 class="panel-title">${escapeHtml(program.program)}</h2>
      <div class="panel-meta">${escapeHtml(program.region)} | ${escapeHtml(program.country)} | Deadline: ${escapeHtml(program.deadline)}</div>
      <div class="panel-actions">
        <a class="round-link main" href="${safeUrl(program.website)}" target="_blank" rel="noreferrer">官方网站</a>
        <a class="round-link" href="mailto:hello@topuxschools.com?subject=${encodeURIComponent(program.school + " " + program.program + " 申请咨询")}">咨询</a>
      </div>
    </div>
    <section class="panel-section">
      <div class="rule-title">Program info</div>
      <div class="fact-grid">
        <div class="fact"><span>地区</span><strong>${escapeHtml(program.region)}</strong></div>
        <div class="fact"><span>国家 / 地区</span><strong>${escapeHtml(program.country)}</strong></div>
        <div class="fact"><span>学制</span><strong>${escapeHtml(program.length)}</strong></div>
        <div class="fact"><span>学费</span><strong>${escapeHtml(program.tuition)}</strong></div>
        <div class="fact"><span>城市</span><strong>${escapeHtml(program.location)}</strong></div>
        <div class="fact"><span>项目简称</span><strong>${escapeHtml(program.programShort)}</strong></div>
        <div class="fact"><span>STEM / OPT</span><strong>${program.stem ? "Yes" : escapeHtml(program.stemNote)}</strong></div>
        <div class="fact"><span>最后核验</span><strong>${escapeHtml(program.lastVerified)}</strong></div>
      </div>
    </section>
    <section class="panel-section">
      <div class="rule-title">Admission requirements</div>
      <div class="req-grid">
        <div class="req"><span>学术背景</span><strong>${escapeHtml(program.academic)}</strong></div>
        <div class="req"><span>IELTS</span><strong>${escapeHtml(program.ielts)}</strong></div>
        <div class="req"><span>TOEFL</span><strong>${escapeHtml(program.toefl)}</strong></div>
        <div class="req"><span>GRE</span><strong>${escapeHtml(program.gre)}</strong></div>
        <div class="req"><span>作品集</span><strong>${escapeHtml(program.portfolio)}</strong></div>
      </div>
    </section>
    <section class="panel-section">
      <div class="rule-title">Verification notes</div>
      <div class="insight">${escapeHtml(program.note)}</div>
    </section>
  `;
}

function caseMatchesSearch(caseStudy) {
  const query = caseSearchInput.value.trim().toLowerCase();
  if (!query) return true;
  return (caseStudy.searchTerms || []).join(" ").toLowerCase().includes(query);
}

function caseMatchesRegion(caseStudy) {
  return !activeCaseRegion || (caseStudy.regions || []).includes(activeCaseRegion);
}

function outcomeStatusLabel(status) {
  if (status === "selected") return "最终选择";
  if (status === "offer") return "Offer";
  if (status === "rejected") return "拒信";
  return "等待结果";
}

function renderOutcomeTags(outcomes) {
  return outcomes.map((item) => `
    <span class="outcome-tag ${escapeHtml(item.status)}" aria-label="${escapeHtml(outcomeStatusLabel(item.status))}：${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
  `).join("");
}

function renderMethodTags(methods) {
  return methods.map((method) => `<span class="method-tag">${escapeHtml(method)}</span>`).join("");
}

function renderCases() {
  const caseStudies = window.CASE_STUDIES
    .filter(isPublished)
    .filter(caseMatchesRegion)
    .filter(caseMatchesSearch)
    .sort((left, right) => (left.displayOrder || Number.MAX_SAFE_INTEGER) - (right.displayOrder || Number.MAX_SAFE_INTEGER));
  const totalPages = Math.max(1, Math.ceil(caseStudies.length / casePageSize));
  activeCasePage = Math.min(activeCasePage, totalPages);
  const start = (activeCasePage - 1) * casePageSize;
  const pageCases = caseStudies.slice(start, start + casePageSize);
  const regionLabel = activeCaseRegion || "全部区域";
  caseResults.textContent = `${regionLabel} · 找到 ${caseStudies.length} 个案例`;
  caseGrid.innerHTML = pageCases.map((caseStudy) => `
    <article class="case-card">
      <button class="content-card-button" type="button" data-case-id="${escapeHtml(caseStudy.id)}" aria-label="查看 ${escapeHtml(caseStudy.title)} 案例详情">
        <div class="case-card-topline"><span>${escapeHtml(caseStudy.year)}</span><span>${escapeHtml(caseStudy.regions.join(" · "))}</span></div>
        <h3>${escapeHtml(caseStudy.title)}</h3>
        <div class="outcome-tags">${renderOutcomeTags(caseStudy.outcomes)}</div>
        <dl class="case-facts">
          <div><dt>背景</dt><dd>${escapeHtml(caseStudy.background)}</dd></div>
          ${caseStudy.applicationMethods.length ? `<div><dt>申请方式</dt><dd class="method-tags">${renderMethodTags(caseStudy.applicationMethods)}</dd></div>` : ""}
          <div><dt>成绩</dt><dd>${escapeHtml(caseStudy.gpa)} · ${escapeHtml(caseStudy.language)}</dd></div>
        </dl>
        <span class="card-link">查看案例详情 <span aria-hidden="true">→</span></span>
      </button>
    </article>
  `).join("");

  if (!caseStudies.length) {
    caseGrid.innerHTML = `<p class="empty-state">没有匹配的案例。试试学校英文名、DIY 或转专业等关键词。</p>`;
  }

  renderCasePagination(caseStudies.length, totalPages);
}

function renderCasePagination(totalCases, totalPages) {
  if (!totalCases) {
    casePagination.innerHTML = "";
    return;
  }
  casePagination.innerHTML = renderPagination({
    currentPage: activeCasePage,
    totalPages,
    pageAttribute: "data-case-page",
    pageSize: casePageSize,
    pageSizeAttribute: "data-case-page-size",
    pageSizes: CASE_PAGE_SIZES,
    pageSizeLabel: "每页显示案例数量"
  });
}

function renderCasePanel(caseStudy) {
  panelContent.innerHTML = `
    <article class="content-detail case-detail">
      <div class="panel-head">
        <p class="panel-kicker">录取案例 · ${escapeHtml(caseStudy.year)}</p>
        <h2 class="panel-title">${escapeHtml(caseStudy.title)}</h2>
        <p class="detail-lead">${escapeHtml(caseStudy.selected.school.school)} · ${escapeHtml(caseStudy.selected.program.program)}</p>
        <div class="outcome-tags">${renderOutcomeTags(caseStudy.outcomes)}</div>
      </div>
      <section class="panel-section">
        <div class="rule-title">申请背景</div>
        <div class="fact-grid">
          <div class="fact"><span>学校背景</span><strong>${escapeHtml(caseStudy.background)}</strong></div>
          <div class="fact"><span>GPA</span><strong>${escapeHtml(caseStudy.gpa)}</strong></div>
          <div class="fact"><span>语言成绩</span><strong>${escapeHtml(caseStudy.language)}</strong></div>
        </div>
      </section>
      ${caseStudy.applicationMethods.length ? `<section class="panel-section"><div class="rule-title">申请方式</div><div class="method-tags">${renderMethodTags(caseStudy.applicationMethods)}</div></section>` : ""}
      <section class="panel-section">
        <div class="rule-title">申请结果</div>
        <div class="outcome-tags">${renderOutcomeTags(caseStudy.outcomes)}</div>
      </section>
    </article>
  `;
}

function renderArticles() {
  articleGrid.innerHTML = window.ARTICLES.filter(isPublished).map((article, index) => `
    <article class="article-card ${index === 0 ? "article-featured" : ""}">
      <button class="content-card-button" type="button" data-article-id="${escapeHtml(article.id)}" aria-label="阅读文章：${escapeHtml(article.title)}">
        <div class="article-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(article.readTime)}</span></div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="article-footer"><span>阅读笔记 <span aria-hidden="true">→</span></span></div>
      </button>
    </article>
  `).join("");
}

function renderArticlePanel(article) {
  panelContent.innerHTML = `
    <article class="content-detail article-detail">
      <div class="panel-head">
        <p class="panel-kicker">${escapeHtml(article.category)}</p>
        <h2 class="panel-title">${escapeHtml(article.title)}</h2>
        <p class="detail-lead">${escapeHtml(article.excerpt)}</p>
      </div>
      <section class="panel-section">
        <div class="reading-copy">${renderArticleBlocks(article)}</div>
      </section>
    </article>
  `;
}

function showPanel() {
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("panel-open");
}

function openProgram(id) {
  const program = window.PROGRAMS.find((item) => item.id === id && isPublished(item));
  if (!program) return;
  renderProgramPanel(program);
  showPanel();
}

function openCase(id) {
  const caseStudy = window.CASE_STUDIES.find((item) => item.id === id && isPublished(item));
  if (!caseStudy) return;
  renderCasePanel(caseStudy);
  showPanel();
}

function openArticle(id) {
  const article = window.ARTICLES.find((item) => item.id === id && isPublished(item));
  if (!article) return;
  renderArticlePanel(article);
  showPanel();
}

function hidePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("panel-open");
}

rowsEl.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (row) openProgram(row.dataset.id);
});

rowsEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const row = event.target.closest("tr[data-id]");
  if (row) openProgram(row.dataset.id);
});

caseGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-case-id]");
  if (card) openCase(card.dataset.caseId);
});

caseRegionFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-case-region]");
  if (!button) return;
  const region = button.dataset.caseRegion;
  activeCaseRegion = activeCaseRegion === region ? null : region;
  activeCasePage = 1;
  caseRegionFilters.querySelectorAll("button[data-case-region]").forEach((item) => {
    const isActive = item.dataset.caseRegion === activeCaseRegion;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
  renderCases();
});

casePagination.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-case-page]");
  if (!button || button.disabled) return;
  activeCasePage = Number(button.dataset.casePage);
  renderCases();
  document.querySelector("#cases").scrollIntoView({ behavior: "smooth", block: "start" });
});

casePagination.addEventListener("change", (event) => {
  const select = event.target.closest("select[data-case-page-size]");
  if (!select) return;
  casePageSize = Number(select.value);
  activeCasePage = 1;
  renderCases();
});

articleGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-article-id]");
  if (card) openArticle(card.dataset.articleId);
});

closePanel.addEventListener("click", hidePanel);
overlay.addEventListener("click", hidePanel);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hidePanel();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeRegion = tab.dataset.region;
    activeProgramPage = 1;
    renderRows();
  });
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    activeFilter = filter.dataset.filter;
    activeProgramPage = 1;
    renderRows();
  });
});

programPagination.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button || button.disabled) return;
  activeProgramPage = Number(button.dataset.page);
  renderRows();
  document.querySelector("#programs").scrollIntoView({ behavior: "smooth", block: "start" });
});

programPagination.addEventListener("change", (event) => {
  const select = event.target.closest("select[data-program-page-size]");
  if (!select) return;
  programPageSize = Number(select.value);
  activeProgramPage = 1;
  renderRows();
});

searchInput.addEventListener("input", () => {
  activeProgramPage = 1;
  renderRows();
});
caseSearchInput.addEventListener("input", () => {
  activeCasePage = 1;
  renderCases();
});

renderRows();
renderCases();
renderArticles();
