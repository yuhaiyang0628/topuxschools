const config = require("../data/config");

function cloudAvailable() {
  return config.contentMode === "cloud" &&
    config.cloudEnvId &&
    typeof wx !== "undefined" &&
    wx.cloud &&
    typeof wx.cloud.callFunction === "function";
}

async function submitCaseStudy(record) {
  if (!cloudAvailable()) throw new Error("案例提报需要已连接的云开发环境");
  const response = await wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action: "submitCaseStudy", payload: { record } }
  });
  return response.result;
}

async function submitArticle(record) {
  if (!cloudAvailable()) throw new Error("笔记投稿需要已连接的云开发环境");
  const response = await wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action: "submitArticle", payload: { record } }
  });
  return response.result;
}

async function submitProgramReport(record) {
  if (!cloudAvailable()) throw new Error("信息反馈需要已连接的云开发环境");
  const response = await wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action: "submitProgramReport", payload: { record } }
  });
  return response.result;
}

module.exports = { submitArticle, submitCaseStudy, submitProgramReport };
