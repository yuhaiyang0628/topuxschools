const { programs, caseStudies, articles } = require("../data/content");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isPublished(item) {
  return !item.status || item.status === "published";
}

function matchesText(item, query, keys) {
  const keyword = normalize(query);
  if (!keyword) return true;
  return keys.some((key) => normalize(item[key]).includes(keyword)) ||
    (item.tags || []).some((tag) => normalize(tag).includes(keyword));
}

function normalizedToken(value) {
  return normalize(value).replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
}

function matchesAlias(left, right) {
  const leftToken = normalizedToken(left);
  const rightToken = normalizedToken(right);
  return Boolean(leftToken && rightToken && (leftToken === rightToken || leftToken.includes(rightToken) || rightToken.includes(leftToken)));
}

function caseMatchesProgram(caseStudy, program) {
  const selected = caseStudy.selected || {};
  const selectedSchool = selected.school || {};
  const selectedProgram = selected.program || {};
  const schoolValues = [selectedSchool.label, selectedSchool.school, selectedSchool.schoolCn, ...(selectedSchool.aliases || [])];
  const programSchoolValues = [program.school, program.schoolCn];
  const schoolMatches = schoolValues.some((value) => programSchoolValues.some((programValue) => matchesAlias(value, programValue)));
  const selectedProgramValues = [selectedProgram.label, selectedProgram.program, ...(selectedProgram.aliases || [])];
  const programValues = [program.short, program.programShort, program.program];
  const programMatches = selectedProgramValues.some((value) => programValues.some((programValue) => normalizedToken(value) === normalizedToken(programValue)));
  return schoolMatches && programMatches;
}

function articleMatchesProgram(article, program) {
  const programTags = [program.id, program.short, program.programShort, program.program]
    .map(normalizedToken)
    .filter(Boolean);
  return (article.tags || []).some((tag) => programTags.includes(normalizedToken(tag)));
}

function paginate(items, page, pageSize) {
  const safePage = Math.max(1, Number(page) || 1);
  const start = (safePage - 1) * pageSize;
  const list = items.slice(start, start + pageSize);
  return {
    list,
    total: items.length,
    page: safePage,
    hasMore: start + pageSize < items.length
  };
}

function programMatchesFilter(program, filter) {
  if (!filter || filter === "all") return true;
  if (filter === "portfolio") return (program.tags || []).includes("portfolio");
  if (filter === "stem") return program.stem;
  if (filter === "rolling") return (program.tags || []).includes("rolling");
  if (filter === "no-gre") return (program.tags || []).includes("no-gre");
  return true;
}

function queryPrograms({ region = "US", filter = "all", query = "", page = 1, pageSize = 20 } = {}) {
  const filtered = programs
    .filter(isPublished)
    .filter((program) => !region || program.region === region)
    .filter((program) => programMatchesFilter(program, filter))
    .filter((program) => matchesText(program, query, ["school", "schoolCn", "program", "programShort", "location", "country", "region"]));
  return paginate(filtered, page, pageSize);
}

function queryCases({ region = "", query = "", page = 1, pageSize = 6 } = {}) {
  const filtered = caseStudies
    .filter(isPublished)
    .filter((caseStudy) => !region || (caseStudy.regions || []).includes(region))
    .filter((caseStudy) => normalize((caseStudy.searchTerms || []).join(" ")).includes(normalize(query)));
  return paginate(filtered, page, pageSize);
}

function getProgram(id) {
  return programs.find((program) => program.id === id && isPublished(program));
}

function getCaseStudy(id) {
  return caseStudies.find((caseStudy) => caseStudy.id === id && isPublished(caseStudy));
}

function getArticle(id) {
  return articles.find((article) => article.id === id && isPublished(article));
}

function getArticles() {
  return articles.filter(isPublished);
}

function getProgramRelations(id) {
  const program = getProgram(id);
  if (!program) return { caseStudies: [], articles: [] };
  return {
    caseStudies: caseStudies.filter(isPublished).filter((caseStudy) => caseMatchesProgram(caseStudy, program)),
    articles: articles.filter(isPublished).filter((article) => articleMatchesProgram(article, program))
  };
}

function getHomeContent() {
  const publishedPrograms = programs.filter(isPublished);
  const publishedCases = caseStudies.filter(isPublished);
  const publishedArticles = articles.filter(isPublished);
  return {
    programCount: publishedPrograms.length,
    caseCount: publishedCases.length,
    articleCount: publishedArticles.length,
    featuredPrograms: publishedPrograms.slice(0, 3),
    featuredCases: publishedCases.slice(0, 3),
    featuredArticles: publishedArticles.slice(0, 3)
  };
}

module.exports = {
  getArticle,
  getArticles,
  getCaseStudy,
  getHomeContent,
  getProgram,
  getProgramRelations,
  queryCases,
  queryPrograms
};
