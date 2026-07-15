const { getArticles } = require("../../services/content");

Page({
  data: {
    articles: []
  },

  async onLoad() {
    this.setData({ articles: await getArticles() });
  },

  async onPullDownRefresh() {
    this.setData({ articles: await getArticles() });
    wx.stopPullDownRefresh();
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/note-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜干货笔记",
      path: "/pages/notes/index"
    };
  }
});
