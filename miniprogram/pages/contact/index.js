const config = require("../../data/config");

Page({
  data: {
    contactEmail: config.contactEmail,
    contactWechat: config.contactWechat,
    contactNote: config.contactNote
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

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜有问题，先聊聊",
      path: "/pages/contact/index"
    };
  }
});
