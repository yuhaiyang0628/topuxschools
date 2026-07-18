const config = require("../data/config");
const localContent = require("./local-content");

function useCloud() {
  return config.contentMode === "cloud" &&
    config.cloudEnvId &&
    typeof wx !== "undefined" &&
    wx.cloud &&
    typeof wx.cloud.callFunction === "function";
}

async function fromSource(action, payload, fallback) {
  if (!useCloud()) {
    console.warn("[Top UX Schools] Cloud content is unavailable; using local content.", {
      contentMode: config.contentMode,
      cloudEnvId: config.cloudEnvId,
      hasCloudApi: typeof wx !== "undefined" && Boolean(wx.cloud)
    });
    return fallback();
  }
  try {
    const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    console.warn("[Top UX Schools] Runtime caller identity.", {
      appId: accountInfo && accountInfo.miniProgram ? accountInfo.miniProgram.appId : "unavailable",
      cloudEnvId: config.cloudEnvId
    });
    console.info(`[Top UX Schools] Calling cloud content: ${action}`);
    const response = await wx.cloud.callFunction({
      name: config.cloudFunctionName,
      data: { action, payload }
    });
    console.info(`[Top UX Schools] Cloud content succeeded: ${action}`);
    return response.result;
  } catch (error) {
    console.warn("[Top UX Schools] Cloud content failed; using local content.", error);
    return fallback();
  }
}

function queryPrograms(options) {
  return fromSource("queryPrograms", options, () => localContent.queryPrograms(options));
}

function queryCases(options) {
  return fromSource("queryCases", options, () => localContent.queryCases(options));
}

function getProgram(id) {
  return fromSource("getProgram", { id }, () => localContent.getProgram(id));
}

function getProgramRelations(id) {
  return fromSource("getProgramRelations", { id }, () => localContent.getProgramRelations(id));
}

function getCaseStudy(id) {
  return fromSource("getCaseStudy", { id }, () => localContent.getCaseStudy(id));
}

function getArticle(id) {
  return fromSource("getArticle", { id }, () => localContent.getArticle(id));
}

function getArticles() {
  return fromSource("getArticles", {}, () => localContent.getArticles());
}

function getHomeContent() {
  return fromSource("getHomeContent", {}, () => localContent.getHomeContent());
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
