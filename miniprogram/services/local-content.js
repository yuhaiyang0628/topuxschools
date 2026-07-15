const { programs, caseStudies, articles } = require("../data/content");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesText(item, query, keys) {
  const keyword = normalize(query);
  if (!keyword) return true;
  return keys.some((key) => normalize(item[key]).includes(keyword)) ||
    (item.tags || []).some((tag) => normalize(tag).includes(keyword));
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
    .filter((program) => !region || program.region === region)
    .filter((program) => programMatchesFilter(program, filter))
    .filter((program) => matchesText(program, query, ["school", "schoolCn", "program", "programShort", "location", "country", "region"]));
  return paginate(filtered, page, pageSize);
}

function queryCases({ region = "", query = "", page = 1, pageSize = 6 } = {}) {
  const filtered = caseStudies
    .filter((caseStudy) => !region || caseStudy.region === region)
    .filter((caseStudy) => matchesText(caseStudy, query, ["school", "schoolCn", "program", "background", "region", "result"]));
  return paginate(filtered, page, pageSize);
}

function getProgram(id) {
  return programs.find((program) => program.id === id);
}

function getCaseStudy(id) {
  return caseStudies.find((caseStudy) => caseStudy.id === id);
}

function getArticle(id) {
  return articles.find((article) => article.id === id);
}

function getArticles() {
  return articles;
}

function getHomeContent() {
  return {
    programCount: programs.length,
    caseCount: caseStudies.length,
    articleCount: articles.length,
    featuredPrograms: programs.slice(0, 3),
    featuredCases: caseStudies.slice(0, 3),
    featuredArticles: articles.slice(0, 3)
  };
}

module.exports = {
  getArticle,
  getArticles,
  getCaseStudy,
  getHomeContent,
  getProgram,
  queryCases,
  queryPrograms
};
