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

let activeRegion = "US";
let activeFilter = "all";
let activeProgramPage = 1;
let activeCaseRegion = null;
let activeCasePage = 1;
const PROGRAMS_PER_PAGE = 20;
const CASES_PER_PAGE = 6;

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

function matchesFilter(program) {
  if (activeFilter === "all") return true;
  if (activeFilter === "portfolio") return program.tags.includes("portfolio");
  if (activeFilter === "stem") return program.stem;
  if (activeFilter === "rolling") return program.tags.includes("rolling");
  if (activeFilter === "no-gre") return program.tags.includes("no-gre");
  return program.tags.includes(activeFilter);
}

function matchesRegion(program) {
  return program.region === activeRegion;
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
    .filter(matchesRegion)
    .filter(matchesFilter)
    .filter(matchesSearch);
  const totalPages = Math.max(1, Math.ceil(programs.length / PROGRAMS_PER_PAGE));
  activeProgramPage = Math.min(activeProgramPage, totalPages);
  const start = (activeProgramPage - 1) * PROGRAMS_PER_PAGE;
  const pagePrograms = programs.slice(start, start + PROGRAMS_PER_PAGE);

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

function renderProgramPagination(totalPrograms, totalPages) {
  if (!totalPrograms) {
    programPagination.innerHTML = "";
    return;
  }

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="page-number ${page === activeProgramPage ? "active" : ""}" type="button" data-page="${page}" ${page === activeProgramPage ? "aria-current=\"page\"" : ""}>${page}</button>`;
  }).join("");

  const from = (activeProgramPage - 1) * PROGRAMS_PER_PAGE + 1;
  const to = Math.min(activeProgramPage * PROGRAMS_PER_PAGE, totalPrograms);
  programPagination.innerHTML = `
    <p class="page-status">显示 ${from}-${to} / ${totalPrograms} 个项目</p>
    <div class="page-controls">
      <button class="page-arrow" type="button" data-page="${activeProgramPage - 1}" aria-label="上一页" ${activeProgramPage === 1 ? "disabled" : ""}>←</button>
      ${pageButtons}
      <button class="page-arrow" type="button" data-page="${activeProgramPage + 1}" aria-label="下一页" ${activeProgramPage === totalPages ? "disabled" : ""}>→</button>
    </div>
  `;
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
  return [
    caseStudy.school,
    caseStudy.schoolCn,
    caseStudy.program,
    caseStudy.background,
    caseStudy.region,
    caseStudy.result,
    caseStudy.tags.join(" ")
  ].join(" ").toLowerCase().includes(query);
}

function caseMatchesRegion(caseStudy) {
  return !activeCaseRegion || caseStudy.region === activeCaseRegion;
}

function renderCases() {
  const caseStudies = window.CASE_STUDIES
    .filter(caseMatchesRegion)
    .filter(caseMatchesSearch);
  const totalPages = Math.max(1, Math.ceil(caseStudies.length / CASES_PER_PAGE));
  activeCasePage = Math.min(activeCasePage, totalPages);
  const start = (activeCasePage - 1) * CASES_PER_PAGE;
  const pageCases = caseStudies.slice(start, start + CASES_PER_PAGE);
  const regionLabel = activeCaseRegion || "全部区域";
  caseResults.textContent = `${regionLabel} · 找到 ${caseStudies.length} 个案例`;
  caseGrid.innerHTML = pageCases.map((caseStudy) => `
    <article class="case-card">
      <button class="content-card-button" type="button" data-case-id="${escapeHtml(caseStudy.id)}" aria-label="查看 ${escapeHtml(caseStudy.school)} 案例详情">
        <div class="case-card-topline"><span>${escapeHtml(caseStudy.year)}</span><span>${escapeHtml(caseStudy.region)}</span></div>
        <h3>${escapeHtml(caseStudy.result)}</h3>
        <p class="case-program">${escapeHtml(caseStudy.schoolCn)} · ${escapeHtml(caseStudy.program)}</p>
        <dl class="case-facts">
          <div><dt>背景</dt><dd>${escapeHtml(caseStudy.background)}</dd></div>
          <div><dt>申请方式</dt><dd>${caseStudy.diy ? "DIY" : "协助申请"}</dd></div>
          <div><dt>成绩</dt><dd>${escapeHtml(caseStudy.gpa)} · ${escapeHtml(caseStudy.language)}</dd></div>
        </dl>
        <p class="card-summary">${escapeHtml(caseStudy.summary)}</p>
        <div class="tag-list">${caseStudy.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <span class="card-link">查看完整复盘 <span aria-hidden="true">→</span></span>
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

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="page-number ${page === activeCasePage ? "active" : ""}" type="button" data-case-page="${page}" ${page === activeCasePage ? "aria-current=\"page\"" : ""}>${page}</button>`;
  }).join("");
  const from = (activeCasePage - 1) * CASES_PER_PAGE + 1;
  const to = Math.min(activeCasePage * CASES_PER_PAGE, totalCases);
  casePagination.innerHTML = `
    <p class="page-status">显示 ${from}-${to} / ${totalCases} 个案例</p>
    <div class="page-controls">
      <button class="page-arrow" type="button" data-case-page="${activeCasePage - 1}" aria-label="上一页" ${activeCasePage === 1 ? "disabled" : ""}>←</button>
      ${pageButtons}
      <button class="page-arrow" type="button" data-case-page="${activeCasePage + 1}" aria-label="下一页" ${activeCasePage === totalPages ? "disabled" : ""}>→</button>
    </div>
  `;
}

function renderCasePanel(caseStudy) {
  panelContent.innerHTML = `
    <article class="content-detail case-detail">
      <div class="panel-head">
        <p class="panel-kicker">录取案例 · ${escapeHtml(caseStudy.year)}</p>
        <h2 class="panel-title">${escapeHtml(caseStudy.result)}</h2>
        <p class="detail-lead">${escapeHtml(caseStudy.school)} · ${escapeHtml(caseStudy.program)}</p>
        <div class="tag-list">${caseStudy.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <section class="panel-section">
        <div class="rule-title">申请背景</div>
        <div class="fact-grid">
          <div class="fact"><span>学校背景</span><strong>${escapeHtml(caseStudy.background)}</strong></div>
          <div class="fact"><span>申请方式</span><strong>${caseStudy.diy ? "DIY" : "协助申请"}</strong></div>
          <div class="fact"><span>GPA</span><strong>${escapeHtml(caseStudy.gpa)}</strong></div>
          <div class="fact"><span>语言成绩</span><strong>${escapeHtml(caseStudy.language)}</strong></div>
          <div class="fact"><span>工作经历</span><strong>${escapeHtml(caseStudy.work)}</strong></div>
          <div class="fact"><span>实习经历</span><strong>${escapeHtml(caseStudy.internships)}</strong></div>
        </div>
      </section>
      <section class="panel-section">
        <div class="rule-title">录取结果</div>
        <div class="admit-list">${caseStudy.admits.map((admit) => `<span>${escapeHtml(admit)}</span>`).join("")}</div>
      </section>
      <section class="panel-section">
        <div class="rule-title">经验分享</div>
        <div class="reading-copy">${caseStudy.story.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
      </section>
    </article>
  `;
}

function renderArticles() {
  articleGrid.innerHTML = window.ARTICLES.map((article, index) => `
    <article class="article-card ${index === 0 ? "article-featured" : ""}">
      <button class="content-card-button" type="button" data-article-id="${escapeHtml(article.id)}" aria-label="阅读文章：${escapeHtml(article.title)}">
        <div class="article-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(article.readTime)}</span></div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="article-footer"><span>${escapeHtml(article.date)}</span><span>阅读笔记 <span aria-hidden="true">→</span></span></div>
      </button>
    </article>
  `).join("");
}

function renderArticlePanel(article) {
  panelContent.innerHTML = `
    <article class="content-detail article-detail">
      <div class="panel-head">
        <p class="panel-kicker">${escapeHtml(article.category)} · ${escapeHtml(article.date)}</p>
        <h2 class="panel-title">${escapeHtml(article.title)}</h2>
        <p class="detail-lead">${escapeHtml(article.excerpt)}</p>
      </div>
      <section class="panel-section">
        <div class="reading-copy">${article.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
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
  const program = window.PROGRAMS.find((item) => item.id === id);
  if (!program) return;
  renderProgramPanel(program);
  showPanel();
}

function openCase(id) {
  const caseStudy = window.CASE_STUDIES.find((item) => item.id === id);
  if (!caseStudy) return;
  renderCasePanel(caseStudy);
  showPanel();
}

function openArticle(id) {
  const article = window.ARTICLES.find((item) => item.id === id);
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
