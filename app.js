const rowsEl = document.querySelector("#programRows");
const panel = document.querySelector("#detailPanel");
const panelContent = document.querySelector("#detailContent");
const closePanel = document.querySelector("#closePanel");
const overlay = document.querySelector("#overlay");
const searchInput = document.querySelector("#searchInput");
const tabs = Array.from(document.querySelectorAll(".tab"));
const filters = Array.from(document.querySelectorAll(".filter"));

let activeRegion = "US";
let activeFilter = "all";

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

  rowsEl.innerHTML = programs.map((program, index) => `
    <tr data-id="${program.id}" tabindex="0">
      <td>${index + 1}</td>
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
}

function renderPanel(program) {
  panelContent.innerHTML = `
    <div class="panel-head">
      <div class="panel-school">
        <span class="school-logo">${escapeHtml(program.short)}</span>
        <span>${escapeHtml(program.school)} / ${escapeHtml(program.schoolCn)}</span>
      </div>
      <h2 class="panel-title">${escapeHtml(program.program)}</h2>
      <div class="panel-meta">${escapeHtml(program.region)} | ${escapeHtml(program.country)} | Deadline: ${escapeHtml(program.deadline)}</div>
      <div class="panel-actions">
        <a class="round-link main" href="${safeUrl(program.website)}" target="_blank" rel="noreferrer">Website</a>
        <a class="round-link" href="mailto:hello@example.com?subject=${encodeURIComponent(program.school + " " + program.program + " 申请咨询")}">Ask</a>
        <a class="round-link" href="#diagnosis">Fit</a>
      </div>
    </div>

    <section class="panel-section">
      <div class="rule-title">Program Info</div>
      <div class="fact-grid">
        <div class="fact"><span>Region</span><strong>${escapeHtml(program.region)}</strong></div>
        <div class="fact"><span>Country / Area</span><strong>${escapeHtml(program.country)}</strong></div>
        <div class="fact"><span>Length</span><strong>${escapeHtml(program.length)}</strong></div>
        <div class="fact"><span>Tuition</span><strong>${escapeHtml(program.tuition)}</strong></div>
        <div class="fact"><span>Location</span><strong>${escapeHtml(program.location)}</strong></div>
        <div class="fact"><span>Program short name</span><strong>${escapeHtml(program.programShort)}</strong></div>
        <div class="fact"><span>STEM / OPT</span><strong>${program.stem ? "Yes" : escapeHtml(program.stemNote)}</strong></div>
        <div class="fact"><span>Last verified</span><strong>${escapeHtml(program.lastVerified)}</strong></div>
      </div>
    </section>

    <section class="panel-section">
      <div class="rule-title">Admission Requirements</div>
      <div class="req-grid">
        <div class="req"><span>Academic</span><strong>${escapeHtml(program.academic)}</strong></div>
        <div class="req"><span>IELTS</span><strong>${escapeHtml(program.ielts)}</strong></div>
        <div class="req"><span>TOEFL</span><strong>${escapeHtml(program.toefl)}</strong></div>
        <div class="req"><span>GRE</span><strong>${escapeHtml(program.gre)}</strong></div>
        <div class="req"><span>Portfolio</span><strong>${escapeHtml(program.portfolio)}</strong></div>
      </div>
    </section>

    <section class="panel-section">
      <div class="rule-title">Verification Notes</div>
      <div class="insight">${escapeHtml(program.note)}</div>
    </section>

    <section class="panel-section">
      <div class="insight">数据来自已验证更新表格，字段仍建议在每轮申请季开始前复核 deadline、tuition、portfolio、GRE、STEM 和语言要求。</div>
    </section>
  `;
}

function openProgram(id) {
  const program = window.PROGRAMS.find((item) => item.id === id);
  if (!program) return;
  renderPanel(program);
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function hidePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
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
    renderRows();
  });
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    activeFilter = filter.dataset.filter;
    renderRows();
  });
});

searchInput.addEventListener("input", renderRows);

renderRows();
