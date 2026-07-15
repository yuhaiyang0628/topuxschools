const config = require("../data/config");
const localContent = require("./local-content");

function useCloud() {
  return config.contentMode === "cloud" && config.cloudEnvId && typeof wx !== "undefined" && wx.cloud;
}

async function fromSource(action, payload, fallback) {
  if (!useCloud()) return fallback();
  try {
    const response = await wx.cloud.callFunction({
      name: config.cloudFunctionName,
      data: { action, payload }
    });
    return response.result;
  } catch (error) {
    console.warn("Cloud content unavailable; using local content.", error);
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
  queryCases,
  queryPrograms
};
