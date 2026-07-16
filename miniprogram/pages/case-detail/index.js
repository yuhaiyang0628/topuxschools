const { getCaseStudy } = require("../../services/content");

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
    facts: []
  },

  async onLoad(options) {
    const caseStudy = await getCaseStudy(options.id);
    if (!caseStudy) {
      wx.showToast({ title: "未找到这个案例", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: caseStudy.title });
    this.setData({ caseStudy, facts: buildFacts(caseStudy) });
  },

  goToContact() {
    wx.switchTab({ url: "/pages/contact/index" });
  },

  onShareAppMessage() {
    const caseStudy = this.data.caseStudy;
    return {
      title: caseStudy ? caseStudy.result : "Top UX Schools 录取案例",
      path: `/pages/case-detail/index?id=${caseStudy.id}`
    };
  }
});
