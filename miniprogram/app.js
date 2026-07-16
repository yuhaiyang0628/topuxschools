const config = require("./data/config");

App({
  globalData: {
    contentVersion: "2026.07"
  },

  onLaunch() {
    const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    console.info("[Top UX Schools] Runtime app and cloud configuration.", {
      appId: accountInfo && accountInfo.miniProgram ? accountInfo.miniProgram.appId : "unavailable",
      contentMode: config.contentMode,
      cloudEnvId: config.cloudEnvId,
      hasCloudApi: Boolean(wx.cloud)
    });

    if (config.contentMode === "cloud" && config.cloudEnvId && wx.cloud) {
      try {
        wx.cloud.init({
          env: config.cloudEnvId,
          traceUser: true
        });
        console.info("[Top UX Schools] Cloud initialization completed.");
      } catch (error) {
        console.error("[Top UX Schools] Cloud initialization failed.", error);
      }
    }
  }
});
