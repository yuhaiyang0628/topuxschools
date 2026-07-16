const config = require("../../data/config");
const { getAdminStatus } = require("../../services/admin");

Page({
  data: {
    contactEmail: config.contactEmail,
    contactWechat: config.contactWechat,
    contactNote: config.contactNote,
    isAdmin: false
  },

  async onLoad() {
    try {
      const status = await getAdminStatus();
      this.setData({ isAdmin: Boolean(status.isAdmin) });
      console.info("[Top UX Schools] Current admin identity.", status);
    } catch (error) {
      console.info("[Top UX Schools] Admin entry is unavailable.", error);
    }
  },

  copyEmail() {
    wx.setClipboardData({
      data: this.data.contactEmail,
      success: () => wx.showToast({ title: "邮箱已复制", icon: "success" })
    });
  },

  copyWechat() {
    if (!this.data.contactWechat) return;
    wx.setClipboardData({
      data: this.data.contactWechat,
      success: () => wx.showToast({ title: "微信号已复制", icon: "success" })
    });
  },

  openAdmin() {
    wx.navigateTo({ url: "/pages/admin/index" });
  },

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜有问题，先聊聊",
      path: "/pages/contact/index"
    };
  }
});
