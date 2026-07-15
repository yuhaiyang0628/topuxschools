const { getProgram } = require("../../services/content");
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
    tagLabels: []
  },

  async onLoad(options) {
    const program = await getProgram(options.id);
    if (!program) {
      wx.showToast({ title: "未找到这个项目", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: program.schoolCn });
    this.setData({
      program,
      facts: buildFacts(program),
      tagLabels: programTags(program)
    });
  },

  copyWebsite() {
    wx.setClipboardData({
      data: this.data.program.website,
      success: () => wx.showToast({ title: "官网链接已复制", icon: "success" })
    });
  },

  goToContact() {
    wx.switchTab({ url: "/pages/contact/index" });
  },

  onShareAppMessage() {
    const program = this.data.program;
    return {
      title: program ? `${program.schoolCn}｜${program.program}` : "Top UX Schools 项目详情",
      path: `/pages/program-detail/index?id=${program.id}`
    };
  }
});
