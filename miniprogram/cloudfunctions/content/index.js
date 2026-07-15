const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const MAX_LIMIT = 100;

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
  return {
    list: items.slice(start, start + pageSize),
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

async function getAll(collectionName) {
  const collection = db.collection(collectionName);
  const countResult = await collection.count();
  const batches = [];
  for (let skip = 0; skip < countResult.total; skip += MAX_LIMIT) {
    batches.push(collection.skip(skip).limit(MAX_LIMIT).get());
  }
  const results = await Promise.all(batches);
  return results.reduce((all, result) => all.concat(result.data), []);
}

async function getOne(collectionName, id) {
  const result = await db.collection(collectionName).where({ id }).limit(1).get();
  return result.data[0] || null;
}

async function queryPrograms(options) {
  const { region = "US", filter = "all", query = "", page = 1, pageSize = 20 } = options;
  const programs = (await getAll("programs")).sort((left, right) => (left.rank || 0) - (right.rank || 0));
  const filtered = programs
    .filter((program) => !region || program.region === region)
    .filter((program) => programMatchesFilter(program, filter))
    .filter((program) => matchesText(program, query, ["school", "schoolCn", "program", "programShort", "location", "country", "region"]));
  return paginate(filtered, page, pageSize);
}

async function queryCases(options) {
  const { region = "", query = "", page = 1, pageSize = 6 } = options;
  const caseStudies = await getAll("caseStudies");
  const filtered = caseStudies
    .filter((caseStudy) => !region || caseStudy.region === region)
    .filter((caseStudy) => matchesText(caseStudy, query, ["school", "schoolCn", "program", "background", "region", "result"]));
  return paginate(filtered, page, pageSize);
}

async function getHomeContent() {
  const [programs, caseStudies, articles] = await Promise.all([
    getAll("programs"),
    getAll("caseStudies"),
    getAll("articles")
  ]);
  return {
    programCount: programs.length,
    caseCount: caseStudies.length,
    articleCount: articles.length,
    featuredPrograms: programs.sort((left, right) => (left.rank || 0) - (right.rank || 0)).slice(0, 3),
    featuredCases: caseStudies.slice(0, 3),
    featuredArticles: articles.slice(0, 3)
  };
}

exports.main = async (event) => {
  const payload = event.payload || {};
  switch (event.action) {
    case "queryPrograms":
      return queryPrograms(payload);
    case "queryCases":
      return queryCases(payload);
    case "getProgram":
      return getOne("programs", payload.id);
    case "getCaseStudy":
      return getOne("caseStudies", payload.id);
    case "getArticle":
      return getOne("articles", payload.id);
    case "getArticles":
      return getAll("articles");
    case "getHomeContent":
      return getHomeContent();
    default:
      throw new Error("Unsupported content action");
  }
};
