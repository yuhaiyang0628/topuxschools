const config = require("../data/config");

function cloudAvailable() {
  return config.contentMode === "cloud" && config.cloudEnvId && wx.cloud && typeof wx.cloud.callFunction === "function";
}

async function call(action, payload = {}) {
  if (!cloudAvailable()) throw new Error("收藏功能需要已连接的云开发环境");
  const response = await wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action, payload }
  });
  return response.result;
}

function getUserWorkspace() {
  return call("getUserWorkspace");
}

function setFavorite(type, id, saved) {
  return call("setFavorite", { type, id, saved });
}

function getProgramsByIds(ids) {
  return call("getProgramsByIds", { ids });
}

module.exports = { getProgramsByIds, getUserWorkspace, setFavorite };
