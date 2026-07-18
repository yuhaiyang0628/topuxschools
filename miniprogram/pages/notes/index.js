const { getArticles } = require("../../services/content");

Page({
  data: {
    articles: []
  },

  async onLoad() {
    this.setData({ articles: await getArticles() });
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setSelected(2);
  },

  async onPullDownRefresh() {
    this.setData({ articles: await getArticles() });
    wx.stopPullDownRefresh();
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/note-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openSubmission() {
    wx.navigateTo({ url: "/pages/article-submit/index" });
  },

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜干货笔记",
      path: "/pages/notes/index"
    };
  }
});
