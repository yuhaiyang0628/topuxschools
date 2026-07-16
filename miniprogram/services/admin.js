const config = require("../data/config");

function cloudAvailable() {
  return config.contentMode === "cloud" &&
    config.cloudEnvId &&
    typeof wx !== "undefined" &&
    wx.cloud &&
    typeof wx.cloud.callFunction === "function";
}

async function callAdmin(action, payload = {}) {
  if (!cloudAvailable()) throw new Error("内容后台需要已连接的云开发环境");
  const response = await wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action, payload }
  });
  return response.result;
}

function getAdminStatus() {
  return callAdmin("adminGetStatus");
}

function listAdminContent(collection) {
  return callAdmin("adminListContent", { collection });
}

function saveAdminContent(collection, record) {
  return callAdmin("adminSaveContent", { collection, record });
}

function archiveAdminContent(collection, id) {
  return callAdmin("adminArchiveContent", { collection, id });
}

module.exports = {
  archiveAdminContent,
  getAdminStatus,
  listAdminContent,
  saveAdminContent
};
