const https = require("https");

const COLLECTIONS = new Set(["programs", "caseStudies", "articles"]);
const COUNTRY_NAMES = {
  "United States": "美国",
  Canada: "加拿大",
  "United Kingdom": "英国",
  Australia: "澳大利亚",
  Singapore: "新加坡",
  "Hong Kong": "中国香港",
  China: "中国",
  Ireland: "爱尔兰",
  Netherlands: "荷兰",
  Italy: "意大利",
  Finland: "芬兰",
  Sweden: "瑞典",
  Norway: "挪威",
  Denmark: "丹麦"
};

const SCHOOL_ALIASES = {
  Austin: { school: "University of Texas at Austin", schoolCn: "德州大学奥斯汀分校", region: "US", country: "United States", countryCn: "美国", aliases: ["Austin", "UT Austin"] },
  CMU: { school: "Carnegie Mellon University", schoolCn: "卡内基梅隆大学", region: "US", country: "United States", countryCn: "美国", aliases: ["Carnegie Mellon University", "卡内基梅隆大学"] },
  GaTech: { school: "Georgia Institute of Technology", schoolCn: "佐治亚理工学院", region: "US", country: "United States", countryCn: "美国", aliases: ["Georgia Tech", "Georgia Institute of Technology", "佐治亚理工学院"] },
  GSD: { school: "Harvard Graduate School of Design", schoolCn: "哈佛大学设计学院", region: "US", country: "United States", countryCn: "美国", aliases: ["Harvard", "Harvard Graduate School of Design", "哈佛大学", "哈佛大学设计学院"] },
  IUB: { school: "Indiana University Bloomington", schoolCn: "印第安纳大学布鲁明顿分校", region: "US", country: "United States", countryCn: "美国", aliases: ["Indiana University Bloomington", "印第安纳大学布鲁明顿分校"] },
  MIT: { school: "Massachusetts Institute of Technology", schoolCn: "麻省理工学院", region: "US", country: "United States", countryCn: "美国", aliases: ["Massachusetts Institute of Technology", "麻省理工学院"] },
  NWU: { school: "Northwestern University", schoolCn: "西北大学", region: "US", country: "United States", countryCn: "美国", aliases: ["Northwestern University", "西北大学"] },
  NYU: { school: "New York University", schoolCn: "纽约大学", region: "US", country: "United States", countryCn: "美国", aliases: ["New York University", "纽约大学"] },
  SFU: { school: "Simon Fraser University", schoolCn: "西蒙菲莎大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["Simon Fraser University", "西蒙菲莎大学"] },
  UBC: { school: "University of British Columbia", schoolCn: "英属哥伦比亚大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["University of British Columbia", "英属哥伦比亚大学"] },
  UCB: { school: "University of California, Berkeley", schoolCn: "加州大学伯克利分校", region: "US", country: "United States", countryCn: "美国", aliases: ["UC Berkeley", "University of California, Berkeley", "加州大学伯克利分校"] },
  UMD: { school: "University of Maryland", schoolCn: "马里兰大学", region: "US", country: "United States", countryCn: "美国", aliases: ["University of Maryland", "马里兰大学"] },
  Umich: { school: "University of Michigan", schoolCn: "密歇根大学", region: "US", country: "United States", countryCn: "美国", aliases: ["UMich", "University of Michigan", "密歇根大学"] },
  UofT: { school: "University of Toronto", schoolCn: "多伦多大学", region: "CAN", country: "Canada", countryCn: "加拿大", aliases: ["University of Toronto", "多伦多大学"] },
  Upenn: { school: "University of Pennsylvania", schoolCn: "宾夕法尼亚大学", region: "US", country: "United States", countryCn: "美国", aliases: ["UPenn", "Penn", "University of Pennsylvania", "宾夕法尼亚大学"] },
  UW: { school: "University of Washington", schoolCn: "华盛顿大学", region: "US", country: "United States", countryCn: "美国", aliases: ["University of Washington", "华盛顿大学"] }
};

function clean(value) {
  return String(value || "").trim();
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map(clean).filter(Boolean)
    : clean(value).split(/[,，\n]/).map(clean).filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function slug(value, fallback) {
  const result = clean(value).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return result || fallback;
}

function isPublic(record) {
  return !record.status || record.status === "published";
}

function stripSystemFields(record) {
  const { _openid, ...content } = record;
  return content;
}

function collectionWindowName(collection) {
  return {
    programs: "PROGRAMS",
    caseStudies: "CASE_STUDIES",
    articles: "ARTICLES"
  }[collection];
}

function contentFilePath(collection) {
  return {
    programs: "content/programs.js",
    caseStudies: "content/case-studies.js",
    articles: "content/articles.js"
  }[collection];
}

function requestJson(options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let text = "";
      response.on("data", (chunk) => { text += chunk; });
      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(text ? JSON.parse(text) : {});
          } catch (error) {
            resolve({ body: text });
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${text}`));
        }
      });
    });
    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

async function syncCollectionToGithub(collection, records) {
  const token = clean(process.env.GITHUB_TOKEN);
  const repo = clean(process.env.GITHUB_REPO);
  if (!token || !repo) return { status: "not-configured" };

  const branch = clean(process.env.GITHUB_BRANCH) || "main";
  const filePath = contentFilePath(collection);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "top-ux-schools-content-admin",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const current = await requestJson({
    hostname: "api.github.com",
    path: `/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
    method: "GET",
    headers
  });
  const publicRecords = records.map(stripSystemFields);
  const source = `// Generated by the Top UX Schools content admin. Do not edit this file manually.\nwindow.${collectionWindowName(collection)} = ${JSON.stringify(publicRecords, null, 2)};\n`;
  const body = JSON.stringify({
    message: `content: update ${collection}`,
    content: Buffer.from(source).toString("base64"),
    sha: current.sha,
    branch
  });
  await requestJson({
    hostname: "api.github.com",
    path: `/repos/${repo}/contents/${filePath}`,
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  }, body);

  const hook = clean(process.env.NETLIFY_BUILD_HOOK);
  if (hook) {
    const target = new URL(hook);
    await requestJson({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: "POST",
      headers: { "Content-Length": 0 }
    });
  }
  return { status: "queued" };
}

function buildCatalog(programs, caseStudies) {
  const entries = Object.entries(SCHOOL_ALIASES).map(([label, item]) => ({ label, ...item }));
  programs.forEach((program) => entries.push({
    label: program.school,
    school: program.school,
    schoolCn: program.schoolCn || "",
    region: program.region || "",
    country: program.country || "",
    countryCn: COUNTRY_NAMES[program.country] || "",
    aliases: [program.school, program.schoolCn]
  }));
  caseStudies.forEach((caseStudy) => (caseStudy.outcomes || []).forEach((outcome) => entries.push(outcome)));
  return entries;
}

function findSchool(value, catalog) {
  const query = clean(value).toLowerCase();
  const match = catalog.find((item) => unique([item.label, item.school, item.schoolCn, ...(item.aliases || [])])
    .some((alias) => clean(alias).toLowerCase() === query));
  if (match) {
    return {
      label: match.label || value,
      school: match.school || value,
      schoolCn: match.schoolCn || "",
      region: match.region || "",
      country: match.country || "",
      countryCn: match.countryCn || COUNTRY_NAMES[match.country] || "",
      aliases: unique([match.label, match.school, match.schoolCn, ...(match.aliases || [])])
    };
  }
  return { label: clean(value), school: clean(value), schoolCn: "", region: "", country: "", countryCn: "", aliases: [clean(value)] };
}

function buildProgram(input, existing) {
  const id = existing ? existing.id : clean(input.id) || slug(`${input.region}-${input.school}-${input.program}`, `program-${Date.now()}`);
  return {
    ...(existing || {}),
    id,
    _id: existing ? existing._id : `program-${id}`,
    rank: Number(input.rank) || (existing && existing.rank) || 999,
    region: clean(input.region),
    country: clean(input.country),
    school: clean(input.school),
    schoolCn: clean(input.schoolCn),
    short: clean(input.short),
    program: clean(input.program),
    programShort: clean(input.programShort),
    length: clean(input.length),
    tuition: clean(input.tuition),
    location: clean(input.location),
    ielts: clean(input.ielts),
    toefl: clean(input.toefl),
    gre: clean(input.gre),
    portfolio: clean(input.portfolio),
    deadline: clean(input.deadline),
    academic: clean(input.academic),
    stem: Boolean(input.stem),
    stemNote: clean(input.stemNote),
    website: clean(input.website),
    note: clean(input.note),
    lastVerified: clean(input.lastVerified),
    tags: unique(cleanList(input.tags)),
    status: clean(input.status) || "published"
  };
}

function buildArticle(input, existing) {
  const id = existing ? existing.id : clean(input.id) || slug(input.title, `article-${Date.now()}`);
  return {
    ...(existing || {}),
    id,
    _id: existing ? existing._id : `article-${id}`,
    category: clean(input.category),
    title: clean(input.title),
    excerpt: clean(input.excerpt),
    readTime: clean(input.readTime),
    date: clean(input.date),
    body: clean(input.body).split(/\n{2,}/).map(clean).filter(Boolean),
    status: clean(input.status) || "published"
  };
}

function buildCase(input, existing, catalog) {
  const selectedSchool = findSchool(input.selectedSchool, catalog);
  const selectedProgram = {
    label: clean(input.selectedProgram),
    program: clean(input.selectedProgramFull) || clean(input.selectedProgram),
    aliases: unique([input.selectedProgram, input.selectedProgramFull])
  };
  const offerLabels = unique([selectedSchool.label, ...cleanList(input.offerSchools)]);
  const rejectedLabels = cleanList(input.rejectedSchools).filter((label) => !offerLabels.includes(label));
  const selectedOutcome = { ...selectedSchool, status: "selected" };
  const offers = offerLabels.filter((label) => label !== selectedSchool.label).map((label) => ({ ...findSchool(label, catalog), status: "offer" }));
  const rejected = rejectedLabels.map((label) => ({ ...findSchool(label, catalog), status: "rejected" }));
  const outcomes = [selectedOutcome, ...offers, ...rejected];
  const offerOutcomes = outcomes.filter((item) => item.status !== "rejected");
  const year = clean(input.year) || "申请季未填写";
  const id = existing ? existing.id : clean(input.id) || slug(`${year}-${selectedSchool.label}-${selectedProgram.label}`, `case-${Date.now()}`);
  return {
    ...(existing || {}),
    id,
    _id: existing ? existing._id : `case-${id}`,
    year,
    title: `${selectedSchool.label} ${selectedProgram.label}`.trim(),
    selected: { school: selectedSchool, program: selectedProgram },
    regions: unique(offerOutcomes.map((item) => item.region)),
    background: clean(input.background),
    gpa: clean(input.gpa),
    language: clean(input.language),
    applicationMethods: unique(cleanList(input.applicationMethods)),
    supportServices: unique(cleanList(input.supportServices)),
    outcomes,
    searchTerms: unique([
      id,
      input.background,
      input.gpa,
      input.language,
      ...cleanList(input.applicationMethods),
      ...cleanList(input.supportServices),
      selectedProgram.label,
      selectedProgram.program,
      ...selectedProgram.aliases,
      ...offerOutcomes.flatMap((item) => [item.label, item.school, item.schoolCn, ...(item.aliases || [])])
    ]),
    status: clean(input.status) || "published"
  };
}

function createAdminApi({ cloud, db, getAll }) {
  function getAdminOpenIds() {
    return clean(process.env.ADMIN_OPENIDS).split(/[,\s]+/).filter(Boolean);
  }

  function getIdentity() {
    const context = cloud.getWXContext();
    const openId = context.OPENID || "";
    return { openId, isAdmin: getAdminOpenIds().includes(openId) };
  }

  function requireAdmin() {
    const identity = getIdentity();
    if (!identity.isAdmin) throw new Error("无管理员权限");
    return identity;
  }

  async function getStatus() {
    const identity = getIdentity();
    return { isAdmin: identity.isAdmin, openId: identity.openId };
  }

  async function list(collection) {
    requireAdmin();
    if (!COLLECTIONS.has(collection)) throw new Error("未知内容类型");
    return (await getAll(collection)).map(stripSystemFields);
  }

  async function save(collection, input) {
    requireAdmin();
    if (!COLLECTIONS.has(collection)) throw new Error("未知内容类型");
    const current = await getAll(collection);
    const existing = input && input._id ? current.find((item) => item._id === input._id) : null;
    if (input && input._id && !existing) throw new Error("找不到要修改的记录");

    let record;
    if (collection === "programs") record = buildProgram(input || {}, existing);
    if (collection === "articles") record = buildArticle(input || {}, existing);
    if (collection === "caseStudies") {
      const [programs, cases] = await Promise.all([getAll("programs"), getAll("caseStudies")]);
      record = buildCase(input || {}, existing, buildCatalog(programs, cases));
    }
    if (!record.title && collection !== "programs") throw new Error("请填写标题或最终选择");
    if (collection === "programs" && (!record.school || !record.program || !record.region)) {
      throw new Error("请填写学校、项目和地区");
    }

    const { _id, _openid, ...data } = record;
    await db.collection(collection).doc(_id).set({ data });
    const updated = current.filter((item) => item._id !== _id).concat({ ...data, _id });
    let webSync;
    try {
      webSync = await syncCollectionToGithub(collection, updated);
    } catch (error) {
      console.error("[Top UX Schools] Web sync failed after cloud save.", error);
      webSync = { status: "failed", message: error.message };
    }
    return { record: stripSystemFields({ ...data, _id }), webSync };
  }

  async function archive(collection, id) {
    requireAdmin();
    if (!COLLECTIONS.has(collection) || !id) throw new Error("缺少内容类型或记录 ID");
    const current = await getAll(collection);
    const existing = current.find((item) => item._id === id);
    if (!existing) throw new Error("找不到要下架的记录");
    const { _id, _openid, ...data } = existing;
    await db.collection(collection).doc(_id).set({ data: { ...data, status: "archived" } });
    const updated = current.map((item) => item._id === id ? { ...item, status: "archived" } : item);
    let webSync;
    try {
      webSync = await syncCollectionToGithub(collection, updated);
    } catch (error) {
      console.error("[Top UX Schools] Web sync failed after archive.", error);
      webSync = { status: "failed", message: error.message };
    }
    return { webSync };
  }

  return { archive, getStatus, list, save };
}

module.exports = { createAdminApi, isPublic, stripSystemFields };
