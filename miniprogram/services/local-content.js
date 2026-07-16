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
  queryCases,
  queryPrograms
};
