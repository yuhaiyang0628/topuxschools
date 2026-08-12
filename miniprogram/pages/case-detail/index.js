const { getCaseStudy } = require("../../services/content");
const { getUserWorkspace, setFavorite } = require("../../services/workspace");
const { track } = require("../../services/analytics");

function buildFacts(caseStudy) {
  return [
    { label: "学校背景", value: caseStudy.background },
    { label: "GPA", value: caseStudy.gpa },
    { label: "语言成绩", value: caseStudy.language }
  ];
}

Page({
  data: {
    caseStudy: null,
    facts: [],
    saved: false,
    savingFavorite: false,
    contactOpen: false,
    contactOpening: ""
  },

  async onLoad(options) {
    const caseStudy = await getCaseStudy(options.id);
    if (!caseStudy) {
      wx.showToast({ title: "未找到这个案例", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: caseStudy.title });
    this.setData({ caseStudy, facts: buildFacts(caseStudy) });
    track("detail_view", { type: "case", id: caseStudy.id, year: caseStudy.year });
    this.loadFavoriteState();
  },

  async onShow() {
    if (this.data.caseStudy) this.loadFavoriteState();
  },

  async loadFavoriteState() {
    try {
      const workspace = await getUserWorkspace();
      this.setData({ saved: (workspace.favoriteCases || []).includes(this.data.caseStudy.id) });
    } catch (error) {
      console.info("[Top UX Schools] Favorite state unavailable.", error);
    }
  },

  async toggleFavorite() {
    const saved = !this.data.saved;
    this.setData({ savingFavorite: true });
    try {
      await setFavorite("case", this.data.caseStudy.id, saved);
      this.setData({ saved, savingFavorite: false });
      track(saved ? "favorite_add" : "favorite_remove", { type: "case", id: this.data.caseStudy.id });
      wx.showToast({ title: saved ? "案例已收藏" : "已取消收藏", icon: "success" });
    } catch (error) {
      this.setData({ savingFavorite: false });
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },

  openContact() {
    const item = this.data.caseStudy;
    track("contact_intent", { sourceType: "case", sourceId: item.id });
    this.setData({ contactOpen: true, contactOpening: `你好，我看了 ${item.title} 这篇录取案例，想结合自己的背景请教一个具体问题。` });
  },

  closeContact() {
    this.setData({ contactOpen: false });
  },

  onShareAppMessage() {
    const caseStudy = this.data.caseStudy;
    track("share", { type: "case", id: caseStudy ? caseStudy.id : "" });
    return {
      title: caseStudy ? `${caseStudy.title}｜录取案例` : "Top UX Schools 录取案例",
      path: `/pages/case-detail/index?id=${caseStudy.id}`
    };
  },

  onShareTimeline() {
    const item = this.data.caseStudy;
    return { title: item ? `${item.title}｜录取案例` : "Top UX Schools 录取案例", query: `id=${item.id}` };
  }
});
