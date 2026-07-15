const { getCaseStudy } = require("../../services/content");

function buildFacts(caseStudy) {
  return [
    { label: "学校背景", value: caseStudy.background },
    { label: "申请方式", value: caseStudy.diy ? "DIY" : "协助申请" },
    { label: "GPA", value: caseStudy.gpa },
    { label: "语言成绩", value: caseStudy.language },
    { label: "工作经历", value: caseStudy.work },
    { label: "实习经历", value: caseStudy.internships }
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
    wx.setNavigationBarTitle({ title: caseStudy.result });
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
