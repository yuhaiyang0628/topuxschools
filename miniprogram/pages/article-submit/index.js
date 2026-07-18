const { submitArticle } = require("../../services/submissions");

function emptyForm() {
  return { category: "", title: "", excerpt: "", readTime: "", tags: "", body: "", contact: "" };
}

Page({
  data: {
    form: emptyForm(),
    consent: false,
    submitting: false
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onConsentChange(event) {
    const value = event.detail.value;
    this.setData({ consent: Array.isArray(value) ? value.includes("consent") : Boolean(value) });
  },

  async submit() {
    if (!this.data.consent) {
      wx.showToast({ title: "请先确认公开说明", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      await submitArticle({ ...this.data.form, consentPublic: true });
      this.setData({ submitting: false });
      wx.showModal({
        title: "已提交审核",
        content: "感谢分享。审核通过后，这篇笔记会出现在公开笔记页。",
        showCancel: false,
        success: () => wx.navigateBack()
      });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showModal({ title: "提交失败", content: error.message || "请稍后再试。", showCancel: false });
    }
  },

  onShareAppMessage() {
    return { title: "Top UX Schools｜投稿笔记", path: "/pages/article-submit/index" };
  }
});
