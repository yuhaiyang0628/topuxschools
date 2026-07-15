const { getArticle } = require("../../services/content");

Page({
  data: {
    article: null
  },

  async onLoad(options) {
    const article = await getArticle(options.id);
    if (!article) {
      wx.showToast({ title: "未找到这篇笔记", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: article.title });
    this.setData({ article });
  },

  onShareAppMessage() {
    const article = this.data.article;
    return {
      title: article ? article.title : "Top UX Schools 干货笔记",
      path: `/pages/note-detail/index?id=${article.id}`
    };
  }
});
