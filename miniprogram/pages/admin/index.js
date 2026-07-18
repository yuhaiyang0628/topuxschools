const {
  approveArticleSubmission,
  approveCaseSubmission,
  archiveAdminContent,
  getAdminStatus,
  listAdminContent,
  listReviewTasks,
  rejectArticleSubmission,
  rejectCaseSubmission,
  rejectProgramReport,
  resolveProgramReport,
  saveAdminContent
} = require("../../services/admin");

const COLLECTIONS = [
  { value: "caseStudies", label: "案例" },
  { value: "programs", label: "项目" },
  { value: "articles", label: "文章" }
];
const REGIONS = ["US", "CAN", "UK", "AUS", "EU", "Asia"];
const STATUSES = ["published", "draft", "reviewing", "archived"];
const METHODS = ["作品集辅导", "作品集DIY", "作品集半DIY", "文书辅导", "文书DIY", "文书半DIY"];

function emptyForm(collection) {
  const shared = { _id: "", id: "", status: "published" };
  if (collection === "programs") {
    return { ...shared, rank: "", region: "US", country: "United States", school: "", schoolCn: "", short: "", program: "", programShort: "", length: "", tuition: "", location: "", ielts: "", toefl: "", gre: "", portfolio: "", deadline: "", academic: "", stem: false, stemNote: "", website: "", note: "", lastVerified: "", tags: "" };
  }
  if (collection === "articles") {
    return { ...shared, category: "", title: "", excerpt: "", readTime: "", date: "", body: "", tags: "" };
  }
  return {
    ...shared,
    year: "2026 Fall",
    background: "",
    gpa: "",
    language: "",
    schoolRows: [{ value: "", offer: true, isFinal: true }],
    applicationMethods: [],
    supportServices: ""
  };
}

function titleFor(collection, item) {
  if (collection === "programs") return `${item.school || "未命名学校"} · ${item.program || "未命名项目"}`;
  if (collection === "articles") return item.title || "未命名文章";
  return item.title || "未命名案例";
}

function decorateRecords(collection, records) {
  return records.map((item) => ({
    ...item,
    displayTitle: titleFor(collection, item),
    searchText: JSON.stringify(item).toLowerCase()
  }));
}

function filterRecords(records, query) {
  const keyword = String(query || "").trim().toLowerCase();
  if (!keyword) return records;
  return records.filter((item) => item.searchText.includes(keyword));
}

function formFromRecord(collection, item) {
  if (collection === "programs") {
    return { ...emptyForm(collection), ...item, tags: (item.tags || []).join(", ") };
  }
  if (collection === "articles") {
    return { ...emptyForm(collection), ...item, body: (item.body || []).join("\n\n"), tags: (item.tags || []).join(", ") };
  }
  const outcomes = item.outcomes || [];
  const selected = item.selected || {};
  return {
    ...emptyForm(collection),
    ...item,
    schoolRows: [
      {
        value: `${selected.school ? selected.school.label : ""}, ${selected.program ? selected.program.label : ""}`.replace(/^, |, $/g, ""),
        offer: true,
        isFinal: true
      },
      ...outcomes.filter((outcome) => outcome.status === "offer").map((outcome) => ({ value: outcome.label, offer: true, isFinal: false })),
      ...outcomes.filter((outcome) => outcome.status === "rejected").map((outcome) => ({ value: outcome.label, offer: false, isFinal: false }))
    ],
    applicationMethods: item.applicationMethods || [],
    supportServices: (item.supportServices || []).join(", ")
  };
}

function editorState(form) {
  return {
    form,
    regionIndex: Math.max(0, REGIONS.indexOf(form.region)),
    statusIndex: Math.max(0, STATUSES.indexOf(form.status)),
    methodOptions: METHODS.map((value) => ({ value, checked: (form.applicationMethods || []).includes(value) }))
  };
}

Page({
  data: {
    authorized: null,
    collections: COLLECTIONS,
    activeCollection: "caseStudies",
    query: "",
    allRecords: [],
    records: [],
    reviewTasks: [],
    pendingCount: 0,
    loading: false,
    saving: false,
    editing: false,
    reviewing: false,
    reviewingTaskId: "",
    reviewingTaskType: "",
    form: emptyForm("caseStudies"),
    regions: REGIONS,
    statuses: STATUSES,
    methodOptions: METHODS.map((value) => ({ value, checked: false })),
    regionIndex: 0,
    statusIndex: 0
  },

  async onLoad() {
    await this.verifyAndLoad();
  },

  async onPullDownRefresh() {
    await Promise.all([this.loadRecords(), this.loadReviewTasks()]);
    wx.stopPullDownRefresh();
  },

  async verifyAndLoad() {
    try {
      const status = await getAdminStatus();
      this.setData({ authorized: Boolean(status.isAdmin) });
      if (status.isAdmin) await Promise.all([this.loadRecords(), this.loadReviewTasks()]);
    } catch (error) {
      this.setData({ authorized: false });
      console.error("[Top UX Schools] Admin authorization failed.", error);
    }
  },

  async loadRecords() {
    if (!this.data.authorized) return;
    this.setData({ loading: true });
    try {
      const records = await listAdminContent(this.data.activeCollection);
      const allRecords = decorateRecords(this.data.activeCollection, records);
      this.setData({ allRecords, records: filterRecords(allRecords, this.data.query), loading: false });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: "读取失败", icon: "error" });
      console.error(error);
    }
  },

  async loadReviewTasks() {
    if (!this.data.authorized) return;
    try {
      const reviewTasks = (await listReviewTasks()).map((task) => {
        if (task.type === "case") return {
          ...task,
          typeLabel: "案例投稿",
          displayTitle: task.content && task.content.title ? task.content.title : "未命名案例",
          displayCopy: task.content && task.content.background ? task.content.background : "未填写背景"
        };
        if (task.type === "article") return {
          ...task,
          typeLabel: "笔记投稿",
          displayTitle: task.content && task.content.title ? task.content.title : "未命名笔记",
          displayCopy: task.content && task.content.excerpt ? task.content.excerpt : "未填写摘要"
        };
        return { ...task, typeLabel: "项目信息反馈", displayTitle: task.programLabel || "未命名项目", displayCopy: task.message || "未填写反馈" };
      });
      this.setData({ reviewTasks, pendingCount: reviewTasks.length });
    } catch (error) {
      console.error("[Top UX Schools] Submission queue failed to load.", error);
    }
  },

  switchCollection(event) {
    const collection = event.currentTarget.dataset.collection;
    this.setData({ activeCollection: collection, query: "", allRecords: [], editing: false, reviewingTaskId: "", reviewingTaskType: "", records: [], ...editorState(emptyForm(collection)) }, () => this.loadRecords());
  },

  onSearchInput(event) {
    const query = event.detail.value;
    this.setData({ query, records: filterRecords(this.data.allRecords, query) });
  },

  startNew() {
    this.setData({ editing: true, reviewingTaskId: "", reviewingTaskType: "", ...editorState(emptyForm(this.data.activeCollection)) });
  },

  editRecord(event) {
    const record = this.data.records.find((item) => item._id === event.currentTarget.dataset.id);
    if (!record) return;
    this.setData({ editing: true, ...editorState(formFromRecord(this.data.activeCollection, record)) });
  },

  closeEditor() {
    this.setData({ editing: false, reviewingTaskId: "", reviewingTaskType: "", ...editorState(emptyForm(this.data.activeCollection)) });
  },

  openReviewQueue() {
    this.setData({ reviewing: true }, () => this.loadReviewTasks());
  },

  closeReviewQueue() {
    this.setData({ reviewing: false });
  },

  async editReviewTask(event) {
    const task = this.data.reviewTasks.find((item) => item.id === event.currentTarget.dataset.id);
    if (!task) return;
    if (task.type === "programReport") {
      try {
        const programs = await listAdminContent("programs");
        const program = programs.find((item) => item.id === task.programId);
        if (!program) throw new Error("对应项目已不存在");
        this.setData({
          activeCollection: "programs",
          reviewing: false,
          editing: true,
          reviewingTaskId: task.id,
          reviewingTaskType: task.type,
          ...editorState(formFromRecord("programs", program))
        });
      } catch (error) {
        wx.showModal({ title: "无法打开项目", content: error.message || "请稍后再试。", showCancel: false });
      }
      return;
    }
    const collection = task.type === "article" ? "articles" : "caseStudies";
    const draft = { ...(task.content || {}), _id: "" };
    this.setData({
      activeCollection: collection,
      reviewing: false,
      editing: true,
      reviewingTaskId: task.id,
      reviewingTaskType: task.type,
      ...editorState(formFromRecord(collection, draft))
    });
  },

  approveReviewTask(event) {
    const id = event.currentTarget.dataset.id;
    const type = event.currentTarget.dataset.type;
    const report = type === "programReport";
    wx.showModal({
      title: report ? "标记这条反馈为已处理？" : "通过并公开这条投稿？",
      content: report ? "请确认你已核验并手动更新项目资料。" : "内容会立刻公开，并同步到网页（如已完成网页同步配置）。",
      success: async (result) => {
        if (!result.confirm) return;
        try {
          const response = type === "case" ? await approveCaseSubmission(id) : type === "article" ? await approveArticleSubmission(id) : await resolveProgramReport(id);
          wx.showToast({ title: response.webSync && response.webSync.status === "queued" ? "已发布并同步网页" : report ? "已标记处理" : "已发布", icon: "success" });
          await Promise.all([this.loadRecords(), this.loadReviewTasks()]);
        } catch (error) {
          wx.showModal({ title: "发布失败", content: error.message || "请稍后再试。", showCancel: false });
        }
      }
    });
  },

  rejectReviewTask(event) {
    const id = event.currentTarget.dataset.id;
    const type = event.currentTarget.dataset.type;
    wx.showModal({
      title: "拒绝这条提报？",
      content: "提报不会公开，且会保留处理记录。",
      confirmColor: "#b34d45",
      success: async (result) => {
        if (!result.confirm) return;
        try {
          if (type === "case") await rejectCaseSubmission(id);
          if (type === "article") await rejectArticleSubmission(id);
          if (type === "programReport") await rejectProgramReport(id);
          wx.showToast({ title: "已拒绝", icon: "success" });
          await this.loadReviewTasks();
        } catch (error) {
          wx.showModal({ title: "处理失败", content: error.message || "请稍后再试。", showCancel: false });
        }
      }
    });
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onRegionChange(event) {
    const regionIndex = Number(event.detail.value);
    this.setData({ regionIndex, "form.region": REGIONS[regionIndex] });
  },

  onStatusChange(event) {
    const statusIndex = Number(event.detail.value);
    this.setData({ statusIndex, "form.status": STATUSES[statusIndex] });
  },

  onStemChange(event) {
    this.setData({ "form.stem": event.detail.value });
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
    const schoolRows = this.data.form.schoolRows.concat({ value: "", offer: false, isFinal: false });
    this.setData({ "form.schoolRows": schoolRows });
  },

  removeSchoolRow(event) {
    const index = Number(event.currentTarget.dataset.index);
    const row = this.data.form.schoolRows[index];
    if (!row || row.isFinal) return;
    wx.showModal({
      title: "删除这所学校？",
      content: "删除后不会保留这行的学校和录取结果。",
      success: (result) => {
        if (!result.confirm) return;
        const schoolRows = this.data.form.schoolRows.filter((_, rowIndex) => rowIndex !== index);
        this.setData({ "form.schoolRows": schoolRows });
      }
    });
  },

  async saveRecord() {
    this.setData({ saving: true });
    try {
      const result = await saveAdminContent(this.data.activeCollection, this.data.form);
      const reviewingTaskId = this.data.reviewingTaskId;
      const reviewingTaskType = this.data.reviewingTaskType;
      if (reviewingTaskType === "case") await approveCaseSubmission(reviewingTaskId, result.record._id);
      if (reviewingTaskType === "article") await approveArticleSubmission(reviewingTaskId, result.record._id);
      if (reviewingTaskType === "programReport") await resolveProgramReport(reviewingTaskId);
      this.setData({ saving: false, editing: false, reviewingTaskId: "", reviewingTaskType: "", ...editorState(emptyForm(this.data.activeCollection)) });
      wx.showToast({ title: reviewingTaskId ? "已审核并发布" : result.webSync && result.webSync.status === "queued" ? "已保存并同步网页" : "已保存到云端", icon: "success" });
      await Promise.all([this.loadRecords(), this.loadReviewTasks()]);
    } catch (error) {
      this.setData({ saving: false });
      wx.showModal({ title: "保存失败", content: error.message || "请检查填写内容和管理员配置。", showCancel: false });
    }
  },

  archiveRecord(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "下架这条内容？",
      content: "下架后公开网页和小程序将不再显示，但记录会保留，之后可以恢复。",
      success: async (result) => {
        if (!result.confirm) return;
        try {
          const response = await archiveAdminContent(this.data.activeCollection, id);
          wx.showToast({ title: response.webSync && response.webSync.status === "queued" ? "已下架并同步网页" : "已下架", icon: "success" });
          await this.loadRecords();
        } catch (error) {
          wx.showModal({ title: "下架失败", content: error.message || "请稍后再试。", showCancel: false });
        }
      }
    });
  }
});
