const config = require("../data/config");

function track(eventName, properties = {}) {
  if (config.contentMode !== "cloud" || !wx.cloud || typeof wx.cloud.callFunction !== "function") return Promise.resolve();
  return wx.cloud.callFunction({
    name: config.cloudFunctionName,
    data: { action: "trackEvent", payload: { eventName, properties } }
  }).catch((error) => console.info("[Top UX Schools] Analytics skipped.", error));
}

module.exports = { track };
