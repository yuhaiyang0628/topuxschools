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

function money(value) {
  return value || "-";
}

function matchesFilter(program) {
  if (activeFilter === "all") return true;
  if (activeFilter === "portfolio") return /required|recommended|y/i.test(program.portfolio);
  if (activeFilter === "stem") return program.stem;
  return program.tags.includes(activeFilter);
}

function matchesRegion(program) {
  return activeRegion === "All" || program.region === activeRegion;
}

function matchesSearch(program) {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return true;
  return [
    program.school,
    program.program,
    program.location,
    program.note,
    program.region
  ].join(" ").toLowerCase().includes(query);
}

function renderRows() {
  const programs = window.PROGRAMS
    .filter(matchesRegion)
    .filter(matchesFilter)
    .filter(matchesSearch);

  rowsEl.innerHTML = programs.map((program) => `
    <tr data-id="${program.id}" tabindex="0">
      <td>${program.rank}</td>
      <td>
        <div class="school-cell">
          <span class="school-logo">${program.short}</span>
          <strong>${program.school}</strong>
        </div>
      </td>
      <td class="program-name">${program.program}</td>
      <td>${program.length}</td>
      <td>${money(program.tuition)}</td>
      <td>${program.location}</td>
      <td>${program.classSize}</td>
      <td>${program.toefl}</td>
      <td>${program.gre}</td>
      <td><span class="pill ${/not|required/i.test(program.portfolio) ? "warn" : ""}">${program.portfolio}</span></td>
      <td>${program.deadline}</td>
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
        <span class="school-logo">${program.short}</span>
        <span>${program.school}</span>
      </div>
      <h2 class="panel-title">${program.program}</h2>
      <div class="panel-meta">Deadline: ${program.deadline} | Application fee: ${program.fee}</div>
      <div class="panel-actions">
        <a class="round-link main" href="${program.website}" target="_blank" rel="noreferrer">Website</a>
        <a class="round-link" href="mailto:hello@example.com?subject=${encodeURIComponent(program.school + " " + program.program + " 申请咨询")}">Ask</a>
        <a class="round-link" href="#diagnosis">Fit</a>
      </div>
    </div>

    <section class="panel-section">
      <div class="rule-title">Program Info</div>
      <div class="fact-grid">
        <div class="fact"><span>Length</span><strong>${program.length}</strong></div>
        <div class="fact"><span>Total tuition</span><strong>${program.tuition}</strong></div>
        <div class="fact"><span>Location</span><strong>${program.location}</strong></div>
        <div class="fact"><span>Class size</span><strong>${program.classSize}</strong></div>
        <div class="fact"><span>Commitment</span><strong>${program.commitment}</strong></div>
        <div class="fact"><span>Founded in</span><strong>${program.founded}</strong></div>
        <div class="fact"><span>STEM / OPT</span><strong>${program.stem ? "Yes" : "Check official page"}</strong></div>
      </div>
    </section>

    <section class="panel-section">
      <div class="rule-title">Admission Requirements</div>
      <div class="req-grid">
        <div class="req"><span>GPA</span><strong>${program.gpa}</strong></div>
        <div class="req"><span>SOP</span><strong>${program.sop}</strong></div>
        <div class="req"><span>Resume</span><strong>${program.resume}</strong></div>
        <div class="req"><span>Recommendation</span><strong>${program.recommendation}</strong></div>
        <div class="req"><span>TOEFL</span><strong>${program.toefl}</strong></div>
        <div class="req"><span>IELTS</span><strong>${program.ielts}</strong></div>
        <div class="req"><span>GRE</span><strong>${program.gre}</strong></div>
        <div class="req"><span>Portfolio</span><strong>${program.portfolio}</strong></div>
        <div class="req"><span>Programming skill</span><strong>${program.coding}</strong></div>
      </div>
    </section>

    <section class="panel-section">
      <div class="rule-title">申请判断</div>
      <div class="insight">${program.note}</div>
    </section>

    <section class="panel-section">
      <div class="insight">数据需要按官方页面逐项校验。第一版上线时建议标注 Last verified，并优先核查 deadline、tuition、portfolio、GRE、STEM。</div>
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
