const cloud = require("wx-server-sdk");
const { createAdminApi, isPublic, stripSystemFields } = require("./admin");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
// Use the server-side database client so administrator writes do not depend on document creator permissions.
const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV });
const MAX_LIMIT = 100;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isPublished(item) {
  return isPublic(item);
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
  return result.data[0] ? stripSystemFields(result.data[0]) : null;
}

async function queryPrograms(options) {
  const { region = "US", filter = "all", query = "", page = 1, pageSize = 20 } = options;
  const programs = (await getAll("programs")).sort((left, right) => (left.rank || 0) - (right.rank || 0));
  const filtered = programs
    .filter(isPublished)
    .filter((program) => !region || program.region === region)
    .filter((program) => programMatchesFilter(program, filter))
    .filter((program) => matchesText(program, query, ["school", "schoolCn", "program", "programShort", "location", "country", "region"]));
  return paginate(filtered.map(stripSystemFields), page, pageSize);
}

async function queryCases(options) {
  const { region = "", query = "", page = 1, pageSize = 6 } = options;
  const caseStudies = await getAll("caseStudies");
  const filtered = caseStudies
    .filter(isPublished)
    .filter((caseStudy) => !region || (caseStudy.regions || []).includes(region))
    .filter((caseStudy) => normalize((caseStudy.searchTerms || []).join(" ")).includes(normalize(query)));
  return paginate(filtered.map(stripSystemFields), page, pageSize);
}

async function getHomeContent() {
  const [programs, caseStudies, articles] = await Promise.all([
    getAll("programs"),
    getAll("caseStudies"),
    getAll("articles")
  ]);
  const publishedPrograms = programs.filter(isPublished);
  const publishedCases = caseStudies.filter(isPublished);
  const publishedArticles = articles.filter(isPublished);
  return {
    programCount: publishedPrograms.length,
    caseCount: publishedCases.length,
    articleCount: publishedArticles.length,
    featuredPrograms: publishedPrograms.sort((left, right) => (left.rank || 0) - (right.rank || 0)).slice(0, 3).map(stripSystemFields),
    featuredCases: publishedCases.slice(0, 3).map(stripSystemFields),
    featuredArticles: publishedArticles.slice(0, 3).map(stripSystemFields)
  };
}

async function getPublishedOne(collectionName, id) {
  const item = await getOne(collectionName, id);
  return item && isPublished(item) ? item : null;
}

const admin = createAdminApi({ cloud, db, getAll });

exports.main = async (event) => {
  const payload = event.payload || {};
  switch (event.action) {
    case "queryPrograms":
      return queryPrograms(payload);
    case "queryCases":
      return queryCases(payload);
    case "getProgram":
      return getPublishedOne("programs", payload.id);
    case "getCaseStudy":
      return getPublishedOne("caseStudies", payload.id);
    case "getArticle":
      return getPublishedOne("articles", payload.id);
    case "getArticles":
      return (await getAll("articles")).filter(isPublished).map(stripSystemFields);
    case "getHomeContent":
      return getHomeContent();
    case "adminGetStatus":
      return admin.getStatus();
    case "adminListContent":
      return admin.list(payload.collection);
    case "adminSaveContent":
      return admin.save(payload.collection, payload.record);
    case "adminArchiveContent":
      return admin.archive(payload.collection, payload.id);
    default:
      throw new Error("Unsupported content action");
  }
};
