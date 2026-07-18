const { getProgram, getProgramRelations } = require("../../services/content");
const { submitProgramReport } = require("../../services/submissions");
const { programTags } = require("../../utils/format");

function buildFacts(program) {
  return [
    { label: "地区", value: program.region },
    { label: "国家 / 地区", value: program.country },
    { label: "城市", value: program.location },
    { label: "学制", value: program.length },
    { label: "学费", value: program.tuition },
    { label: "申请截止", value: program.deadline },
    { label: "IELTS", value: program.ielts },
    { label: "TOEFL", value: program.toefl },
    { label: "GRE", value: program.gre },
    { label: "作品集", value: program.portfolio },
    { label: "STEM / OPT", value: program.stem ? "是" : program.stemNote },
    { label: "最后核验", value: program.lastVerified }
  ];
}

Page({
  data: {
    program: null,
    facts: [],
    tagLabels: [],
    activeRelatedTab: "cases",
    relatedCases: [],
    relatedArticles: [],
    reporting: false,
    reportMessage: "",
    reportContact: "",
    reportSubmitting: false
  },

  async onLoad(options) {
    const [program, relations] = await Promise.all([
      getProgram(options.id),
      getProgramRelations(options.id)
    ]);
    if (!program) {
      wx.showToast({ title: "未找到这个项目", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: program.schoolCn });
    this.setData({
      program,
      facts: buildFacts(program),
      tagLabels: programTags(program),
      relatedCases: relations.caseStudies || [],
      relatedArticles: relations.articles || []
    });
  },

  switchRelatedTab(event) {
    this.setData({ activeRelatedTab: event.currentTarget.dataset.tab });
  },

  openCase(event) {
    wx.navigateTo({ url: `/pages/case-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openArticle(event) {
    wx.navigateTo({ url: `/pages/note-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openReport() {
    this.setData({ reporting: true, reportMessage: "", reportContact: "" });
  },

  closeReport() {
    this.setData({ reporting: false });
  },

  onReportInput(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value });
  },

  async submitReport() {
    if (!this.data.reportMessage.trim()) {
      wx.showToast({ title: "请描述发现的信息问题", icon: "none" });
      return;
    }
    this.setData({ reportSubmitting: true });
    try {
      await submitProgramReport({
        programId: this.data.program.id,
        message: this.data.reportMessage,
        contact: this.data.reportContact
      });
      this.setData({ reportSubmitting: false, reporting: false });
      wx.showToast({ title: "反馈已提交审核", icon: "success" });
    } catch (error) {
      this.setData({ reportSubmitting: false });
      wx.showModal({ title: "提交失败", content: error.message || "请稍后再试。", showCancel: false });
    }
  },

  onShareAppMessage() {
    const program = this.data.program;
    return {
      title: program ? `${program.schoolCn}｜${program.program}` : "Top UX Schools 项目详情",
      path: `/pages/program-detail/index?id=${program.id}`
    };
  }
});
