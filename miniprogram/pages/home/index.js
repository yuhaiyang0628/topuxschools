const { getHomeContent } = require("../../services/content");
const { compactText, programTags } = require("../../utils/format");

Page({
  data: {
    programCount: 0,
    caseCount: 0,
    articleCount: 0,
    featuredPrograms: [],
    featuredCases: [],
    featuredArticles: []
  },

  async onLoad() {
    const content = await getHomeContent();
    this.setData({
      ...content,
      featuredPrograms: content.featuredPrograms.map((program) => ({
        ...program,
        tagLabels: programTags(program),
        tuitionLabel: compactText(program.tuition, 22)
      })),
      featuredCases: content.featuredCases,
      featuredArticles: content.featuredArticles
    });
  },

  goToPrograms() {
    wx.switchTab({ url: "/pages/programs/index" });
  },

  goToCases() {
    wx.switchTab({ url: "/pages/cases/index" });
  },

  goToNotes() {
    wx.switchTab({ url: "/pages/notes/index" });
  },

  goToContact() {
    wx.switchTab({ url: "/pages/contact/index" });
  },

  openProgram(event) {
    wx.navigateTo({ url: `/pages/program-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openCase(event) {
    wx.navigateTo({ url: `/pages/case-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/note-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜全球 UX / HCI 申请资源库",
      path: "/pages/home/index"
    };
  }
});
