const { getArticles } = require("../../services/content");
const { track } = require("../../services/analytics");

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
    wx.navigateTo({ url: `/article-package/note-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openSubmission() {
    wx.navigateTo({ url: "/pages/article-submit/index" });
  },

  openWorkspace() {
    wx.navigateTo({ url: "/pages/workspace/index" });
  },

  onShareAppMessage() {
    track("share", { type: "article_list" });
    return {
      title: "Top UX Schools｜干货笔记",
      path: "/pages/notes/index"
    };
  }
});
