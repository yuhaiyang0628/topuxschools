const { submitCaseStudy } = require("../../services/submissions");

const METHODS = ["作品集辅导", "作品集DIY", "作品集半DIY", "文书辅导", "文书DIY", "文书半DIY"];

function emptyForm() {
  return {
    year: "2026 Fall",
    background: "",
    gpa: "",
    language: "",
    schoolRows: [{ value: "", offer: true, isFinal: true }],
    applicationMethods: [],
    supportServices: "",
    contact: ""
  };
}

Page({
  data: {
    form: emptyForm(),
    methods: METHODS,
    methodOptions: METHODS.map((value) => ({ value, checked: false })),
    consent: false,
    submitting: false
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onMethodsChange(event) {
    const applicationMethods = event.detail.value;
    this.setData({
      "form.applicationMethods": applicationMethods,
      methodOptions: METHODS.map((value) => ({ value, checked: applicationMethods.includes(value) }))
    });
  },

  onSchoolRowInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ [`form.schoolRows[${index}].value`]: event.detail.value });
  },

  onSchoolOfferChange(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (this.data.form.schoolRows[index].isFinal) return;
    this.setData({ [`form.schoolRows[${index}].offer`]: event.detail.value });
  },

  addSchoolRow() {
    this.setData({ "form.schoolRows": this.data.form.schoolRows.concat({ value: "", offer: false, isFinal: false }) });
  },

  removeSchoolRow(event) {
    const index = Number(event.currentTarget.dataset.index);
    const row = this.data.form.schoolRows[index];
    if (!row || row.isFinal) return;
    wx.showModal({
      title: "删除这所学校？",
      content: "删除后不会保留这行的学校和录取结果。",
      success: (result) => {
        if (result.confirm) this.setData({ "form.schoolRows": this.data.form.schoolRows.filter((_, rowIndex) => rowIndex !== index) });
      }
    });
  },

  onConsentChange(event) {
    const value = event.detail.value;
    this.setData({ consent: Array.isArray(value) ? value.includes("consent") : Boolean(value) });
  },

  async submit() {
    if (!this.data.consent) {
      wx.showToast({ title: "请先确认公开说明", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      await submitCaseStudy({ ...this.data.form, consentPublic: true });
      this.setData({ submitting: false });
      wx.showModal({
        title: "已提交审核",
        content: "感谢分享。审核通过后，这条匿名案例会出现在公开案例页。",
        showCancel: false,
        success: () => wx.navigateBack()
      });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showModal({ title: "提交失败", content: error.message || "请稍后再试。", showCancel: false });
    }
  },

  onShareAppMessage() {
    return { title: "Top UX Schools｜提交我的录取案例", path: "/pages/case-submit/index" };
  }
});
