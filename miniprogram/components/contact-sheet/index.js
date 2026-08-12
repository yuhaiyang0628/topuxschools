const config = require("../../data/config");
const { track } = require("../../services/analytics");

Component({
  properties: {
    visible: { type: Boolean, value: false, observer(value) {
      if (value && !this.wasVisible) {
        this.wasVisible = true;
        track("contact_open", { sourceType: this.data.sourceType, sourceId: this.data.sourceId });
      }
      if (!value) this.wasVisible = false;
    } },
    sourceType: { type: String, value: "general" },
    sourceId: { type: String, value: "" },
    sourceTitle: { type: String, value: "" },
    openingText: { type: String, value: "你好，我在 Top UX Schools 看了一些内容，想带着一个具体问题和你聊聊。" },
    shareLabel: { type: String, value: "把当前页面发给我" }
  },

  data: {
    contactName: config.contactName,
    contactBio: config.contactBio,
    wechat: config.contactWechat,
    qrImage: config.contactWechatQr,
    hasWechat: Boolean(config.contactWechat),
    hasQr: Boolean(config.contactWechatQr)
  },

  methods: {
    close() {
      this.triggerEvent("close");
    },

    keepOpen() {},

    copyWechat() {
      if (!this.data.hasWechat) {
        wx.showToast({ title: "微信号即将补充", icon: "none" });
        return;
      }
      wx.setClipboardData({
        data: this.data.wechat,
        success: () => {
          track("contact_copy_wechat", { sourceType: this.data.sourceType, sourceId: this.data.sourceId });
          wx.showToast({ title: "微信号已复制", icon: "success" });
        }
      });
    },

    copyOpening() {
      wx.setClipboardData({
        data: this.data.openingText,
        success: () => {
          track("contact_copy_opening", { sourceType: this.data.sourceType, sourceId: this.data.sourceId });
          wx.showToast({ title: "开场白已复制", icon: "success" });
        }
      });
    },

    previewQr() {
      if (!this.data.hasQr) {
        wx.showToast({ title: "二维码即将补充", icon: "none" });
        return;
      }
      track("contact_view_qr", { sourceType: this.data.sourceType, sourceId: this.data.sourceId });
      wx.previewImage({ current: this.data.qrImage, urls: [this.data.qrImage] });
    },

    onShareTap() {
      track("contact_share_intent", { sourceType: this.data.sourceType, sourceId: this.data.sourceId });
    }
  }
});
