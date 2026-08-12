const { submitConsultation } = require("../../services/submissions");
const { track } = require("../../services/analytics");

const FALL_YEARS = ["2026 Fall", "2027 Fall", "2028 Fall", "尚未确定"];
const BACKGROUNDS = ["设计相关本科", "理工 / 商科转专业", "艺术与媒体相关", "已有工作经验", "其他背景"];
const PROGRESS = ["刚开始了解", "正在选校", "正在准备作品集 / 文书", "材料基本完成", "已开始投递"];
const SERVICES = ["先判断方向", "DIY 陪跑", "文书服务", "作品集服务", "全套申请服务"];
const BUDGETS = ["暂不确定", "1 万以内", "1–3 万", "3–6 万", "6 万以上"];
const REGIONS = ["US", "CAN", "UK", "AUS", "EU", "Asia"];

const INTENT_COPY = {
  shortlist_review: { title: "检查这份选校单", intro: "把背景和当前选校放在一起判断，先找出明显的结构问题。", action: "提交选校单检查" },
  program_fit: { title: "判断这个项目是否适合我", intro: "不是只看 GPA，而是一起看背景、材料进度和申请目标。", action: "提交项目匹配咨询" },
  case_compare: { title: "用我的背景对照这个案例", intro: "案例只提供参照。真正有用的是找出你与它之间可以行动的差异。", action: "提交背景对照" },
  material_review: { title: "把材料问题说具体", intro: "先说明你卡在作品集、文书还是整体叙事，我们再判断下一步。", action: "提交材料咨询" },
  general: { title: "做一次申请背景梳理", intro: "十分钟把背景、目标和当前进度放在一张纸上。", action: "提交背景咨询" }
};

Page({
  data: {
    title: "做一次申请背景梳理",
    intro: "十分钟把背景、目标和当前进度放在一张纸上。",
    actionLabel: "提交背景咨询",
    fallYears: FALL_YEARS,
    backgrounds: BACKGROUNDS,
    progressOptions: PROGRESS,
    serviceOptions: SERVICES,
    budgetOptions: BUDGETS,
    regionOptions: REGIONS.map((value) => ({ value, checked: false })),
    form: { fallYear: FALL_YEARS[0], backgroundType: BACKGROUNDS[0], major: "", gpa: "", language: "", targetRegions: [], progress: PROGRESS[0], concerns: "", serviceInterest: SERVICES[0], budget: BUDGETS[0], contact: "", consentContact: false },
    fallIndex: 0,
    backgroundIndex: 0,
    progressIndex: 0,
    serviceIndex: 0,
    budgetIndex: 0,
    result: "",
    submitting: false
  },

  onLoad(options) {
    const intent = INTENT_COPY[options.intent] ? options.intent : "general";
    this.source = { type: options.sourceType || intent.split("_")[0], id: options.sourceId || "", title: decodeURIComponent(options.sourceTitle || ""), intent };
    this.contextIds = decodeURIComponent(options.ids || "").split(",").filter(Boolean).slice(0, 8);
    const copy = INTENT_COPY[intent];
    this.setData({ title: copy.title, intro: copy.intro, actionLabel: copy.action });
    track("assessment_view", { intent, sourceType: this.source.type, sourceId: this.source.id });
  },

  onTextInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value });
  },

  onPickerChange(event) {
    const key = event.currentTarget.dataset.key;
    const field = event.currentTarget.dataset.field;
    const options = event.currentTarget.dataset.options;
    const index = Number(event.detail.value);
    const source = { fall: FALL_YEARS, background: BACKGROUNDS, progress: PROGRESS, service: SERVICES, budget: BUDGETS }[options];
    this.setData({ [key]: index, [`form.${field}`]: source[index] });
  },

  onRegionChange(event) {
    const targetRegions = event.detail.value;
    this.setData({
      "form.targetRegions": targetRegions,
      regionOptions: REGIONS.map((value) => ({ value, checked: targetRegions.includes(value) }))
    });
  },

  onConsentChange(event) {
    this.setData({ "form.consentContact": event.detail.value.includes("yes") });
  },

  generateResult() {
    const form = this.data.form;
    if (!form.major.trim() || !form.targetRegions.length) {
      wx.showToast({ title: "请先填写专业背景和目标地区", icon: "none" });
      return;
    }
    const focus = form.progress === "刚开始了解" || form.progress === "正在选校"
      ? "你当前最值得先做的是收窄方向和建立选校梯度，不要急着进入材料制作。"
      : "你已经进入材料阶段，接下来应优先检查项目匹配和个人叙事是否一致。";
    const language = form.language.trim() ? "语言成绩已被纳入判断，但它只是门槛，不应替代项目匹配。" : "语言成绩尚未填写，后续需要按目标项目的硬门槛补齐。";
    const result = `${focus}${language} 这不是录取概率承诺，而是一份下一步行动判断。`;
    this.setData({ result });
    track("assessment_result", { intent: this.source.intent, progress: form.progress, regionCount: form.targetRegions.length });
  },

  async submit() {
    const form = this.data.form;
    if (!form.major.trim() || !form.targetRegions.length) {
      wx.showToast({ title: "请先补全背景和目标地区", icon: "none" });
      return;
    }
    if (!form.contact.trim()) {
      wx.showToast({ title: "请留下微信号或邮箱", icon: "none" });
      return;
    }
    if (!form.consentContact) {
      wx.showToast({ title: "请确认信息使用说明", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      await submitConsultation({ ...form, source: this.source, contextIds: this.contextIds });
      track("consultation_submit", { intent: this.source.intent, sourceType: this.source.type, service: form.serviceInterest });
      this.setData({ submitting: false });
      wx.showModal({ title: "已收到", content: "这份信息已经进入导师的待联系列表。我们会按你留下的方式回复。", showCancel: false, success: () => wx.navigateBack() });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showModal({ title: "提交失败", content: error.message || "请稍后再试。", showCancel: false });
    }
  }
});
