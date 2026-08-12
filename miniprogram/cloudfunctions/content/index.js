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

async function resolveArticleImages(article) {
  if (!article || !Array.isArray(article.images)) return article;
  const fileIds = [...new Set(article.images
    .map((image) => image && (image.fileID || image.mini))
    .filter((fileID) => /^cloud:\/\//i.test(String(fileID || ""))))];
  if (!fileIds.length) return article;
  try {
    const response = await cloud.getTempFileURL({ fileList: fileIds });
    const urls = new Map((response.fileList || []).map((file) => [file.fileID, file.tempFileURL]));
    return {
      ...article,
      images: article.images.map((image) => {
        const fileID = image.fileID || image.mini;
        return urls.has(fileID) ? { ...image, resolvedUrl: urls.get(fileID) } : image;
      })
    };
  } catch (error) {
    console.error("[Top UX Schools] Failed to resolve article image URLs.", error);
    return article;
  }
}

async function getPublishedArticle(id) {
  return resolveArticleImages(await getPublishedOne("articles", id));
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
    .filter((caseStudy) => normalize((caseStudy.searchTerms || []).join(" ")).includes(normalize(query)))
    .sort((left, right) => (left.displayOrder || Number.MAX_SAFE_INTEGER) - (right.displayOrder || Number.MAX_SAFE_INTEGER));
  return paginate(filtered.map(stripSystemFields), page, pageSize);
}

async function getHomeContent() {
  const [programs, caseStudies, articles] = await Promise.all([
    getAll("programs"),
    getAll("caseStudies"),
    getAll("articles")
  ]);
  const publishedPrograms = programs.filter(isPublished);
  const publishedCases = caseStudies
    .filter(isPublished)
    .sort((left, right) => (left.displayOrder || Number.MAX_SAFE_INTEGER) - (right.displayOrder || Number.MAX_SAFE_INTEGER));
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

async function getProgramRelations(id) {
  const [program, caseStudies, articles] = await Promise.all([
    getPublishedOne("programs", id),
    getAll("caseStudies"),
    getAll("articles")
  ]);
  if (!program) return { caseStudies: [], articles: [] };
  return {
    caseStudies: caseStudies.filter(isPublished).filter((caseStudy) => caseMatchesProgram(caseStudy, program)).map(stripSystemFields),
    articles: articles.filter(isPublished).filter((article) => articleMatchesProgram(article, program)).map(stripSystemFields)
  };
}

function clean(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanIds(value, limit = 100) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => clean(item, 120)).filter(Boolean))].slice(0, limit);
}

function currentIdentity() {
  const context = cloud.getWXContext();
  if (!context.OPENID) throw new Error("无法识别当前微信用户");
  return { openId: context.OPENID };
}

const FAVORITE_FIELDS = {
  program: "favoritePrograms",
  case: "favoriteCases",
  article: "favoriteArticles"
};

async function findWorkspace(openId) {
  const result = await db.collection("userWorkspaces").where({ ownerOpenId: openId }).limit(1).get();
  return result.data[0] || null;
}

function publicWorkspace(workspace) {
  return {
    favoritePrograms: cleanIds(workspace && workspace.favoritePrograms, 50),
    favoriteCases: cleanIds(workspace && workspace.favoriteCases, 100),
    favoriteArticles: cleanIds(workspace && workspace.favoriteArticles, 100),
    updatedAt: workspace && workspace.updatedAt ? workspace.updatedAt : ""
  };
}

async function recordsByIds(collectionName, ids) {
  const requested = cleanIds(ids);
  if (!requested.length) return [];
  const records = (await getAll(collectionName)).filter(isPublished);
  const byId = new Map(records.map((item) => [item.id, stripSystemFields(item)]));
  return requested.map((id) => byId.get(id)).filter(Boolean);
}

async function getProgramsByIds(ids) {
  return recordsByIds("programs", cleanIds(ids, 12));
}

async function getUserWorkspace() {
  const { openId } = currentIdentity();
  const workspace = publicWorkspace(await findWorkspace(openId));
  const [programs, caseStudies, articles] = await Promise.all([
    recordsByIds("programs", workspace.favoritePrograms),
    recordsByIds("caseStudies", workspace.favoriteCases),
    recordsByIds("articles", workspace.favoriteArticles)
  ]);
  return { ...workspace, programs, caseStudies, articles };
}

async function setFavorite(payload) {
  const { openId } = currentIdentity();
  const type = clean(payload && payload.type, 20);
  const id = clean(payload && payload.id, 120);
  const field = FAVORITE_FIELDS[type];
  if (!field || !id) throw new Error("收藏参数不完整");

  const current = await findWorkspace(openId);
  const workspace = publicWorkspace(current);
  const values = new Set(workspace[field]);
  if (payload.saved === false) values.delete(id);
  else values.add(id);
  const limits = { favoritePrograms: 50, favoriteCases: 100, favoriteArticles: 100 };
  workspace[field] = [...values].slice(0, limits[field]);
  workspace.updatedAt = new Date().toISOString();

  if (current) {
    await db.collection("userWorkspaces").doc(current._id).update({ data: workspace });
  } else {
    await db.collection("userWorkspaces").add({ data: { ownerOpenId: openId, ...workspace, createdAt: workspace.updatedAt } });
  }
  return workspace;
}

function cleanProperties(properties) {
  const result = {};
  Object.entries(properties && typeof properties === "object" ? properties : {}).slice(0, 16).forEach(([key, value]) => {
    if (["string", "number", "boolean"].includes(typeof value)) result[clean(key, 48)] = typeof value === "string" ? clean(value, 160) : value;
  });
  return result;
}

async function trackEvent(payload) {
  const { openId } = currentIdentity();
  const eventName = clean(payload && payload.eventName, 64);
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(eventName)) throw new Error("埋点事件名称不合法");
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const recent = await db.collection("analyticsEvents").where({ visitorOpenId: openId }).limit(200).get();
  const dailyCount = recent.data.filter((item) => item.day === day).length;
  if (dailyCount >= 150) return { status: "limited" };
  await db.collection("analyticsEvents").add({ data: {
    eventName,
    properties: cleanProperties(payload.properties),
    visitorOpenId: openId,
    day,
    createdAt: now.toISOString()
  } });
  return { status: "recorded" };
}

async function submitConsultation(payload) {
  const { openId } = currentIdentity();
  const record = payload && payload.record ? payload.record : {};
  if (!record.consentContact) throw new Error("请确认同意我们仅为本次咨询使用这些信息");
  const contact = clean(record.contact, 160);
  if (!contact) throw new Error("请留下微信号或邮箱，方便回复");
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await db.collection("consultations").where({ submitterOpenId: openId }).limit(100).get();
  if (recent.data.filter((item) => item.submittedAt >= since).length >= 5) throw new Error("今天已提交较多咨询，请明天再试或直接发送邮件。 ");

  const source = record.source || {};
  const consultation = {
    consultationStatus: "new",
    submittedAt: now.toISOString(),
    submitterOpenId: openId,
    source: {
      type: clean(source.type, 32),
      id: clean(source.id, 120),
      title: clean(source.title, 160),
      intent: clean(source.intent, 48)
    },
    contextIds: cleanIds(record.contextIds, 8),
    profile: {
      fallYear: clean(record.fallYear, 24),
      backgroundType: clean(record.backgroundType, 48),
      major: clean(record.major, 100),
      gpa: clean(record.gpa, 48),
      language: clean(record.language, 80),
      targetRegions: cleanIds(record.targetRegions, 8),
      progress: clean(record.progress, 80),
      concerns: clean(record.concerns, 1000),
      serviceInterest: clean(record.serviceInterest, 80),
      budget: clean(record.budget, 48),
      contact
    }
  };
  const result = await db.collection("consultations").add({ data: consultation });
  return { id: result._id, status: "new" };
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
    case "getProgramRelations":
      return getProgramRelations(payload.id);
    case "getProgramsByIds":
      return getProgramsByIds(payload.ids);
    case "getUserWorkspace":
      return getUserWorkspace();
    case "setFavorite":
      return setFavorite(payload);
    case "trackEvent":
      return trackEvent(payload);
    case "submitConsultation":
      return submitConsultation(payload);
    case "getCaseStudy":
      return getPublishedOne("caseStudies", payload.id);
    case "getArticle":
      return getPublishedArticle(payload.id);
    case "getArticles":
      return (await getAll("articles")).filter(isPublished).map(stripSystemFields);
    case "getHomeContent":
      return getHomeContent();
    case "submitCaseStudy":
      return admin.submitCase(payload.record);
    case "submitArticle":
      return admin.submitArticle(payload.record);
    case "submitProgramReport":
      return admin.submitProgramReport(payload.record);
    case "adminGetStatus":
      return admin.getStatus();
    case "adminListContent":
      return admin.list(payload.collection);
    case "adminSaveContent":
      return admin.save(payload.collection, payload.record);
    case "adminPublishArticleImage":
      return admin.publishArticleImage(payload);
    case "adminArchiveContent":
      return admin.archive(payload.collection, payload.id);
    case "adminListCaseSubmissions":
      return admin.listCaseSubmissions();
    case "adminApproveCaseSubmission":
      return admin.approveCaseSubmission(payload.id, payload.publishedCaseId);
    case "adminRejectCaseSubmission":
      return admin.rejectCaseSubmission(payload.id);
    case "adminListReviewTasks":
      return admin.listReviewTasks();
    case "adminApproveArticleSubmission":
      return admin.approveArticleSubmission(payload.id, payload.publishedArticleId);
    case "adminRejectArticleSubmission":
      return admin.rejectArticleSubmission(payload.id);
    case "adminResolveProgramReport":
      return admin.resolveProgramReport(payload.id);
    case "adminRejectProgramReport":
      return admin.rejectProgramReport(payload.id);
    case "adminListConsultations":
      return admin.listConsultations();
    case "adminUpdateConsultation":
      return admin.updateConsultation(payload.id, payload.status);
    case "adminGetAnalyticsSummary":
      return admin.getAnalyticsSummary();
    default:
      throw new Error("Unsupported content action");
  }
};
