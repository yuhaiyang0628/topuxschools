const config = require("./data/config");

App({
  globalData: {
    contentVersion: "2026.07"
  },

  onLaunch() {
    if (config.contentMode === "cloud" && config.cloudEnvId && wx.cloud) {
      wx.cloud.init({ env: config.cloudEnvId });
    }
  }
});
