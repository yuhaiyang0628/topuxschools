const { getProgramsByIds, getUserWorkspace, setFavorite } = require("../../services/workspace");
const { track } = require("../../services/analytics");

function comparisonFacts(program) {
  return [
    { label: "学校", value: program.schoolCn || program.school },
    { label: "项目", value: program.programShort || program.short || program.program },
    { label: "地区", value: `${program.region || ""} ${program.location || ""}`.trim() },
    { label: "学制", value: program.length || "未注明" },
    { label: "学费", value: program.tuition || "未注明" },
    { label: "截止", value: program.deadline || "未注明" },
    { label: "作品集", value: program.portfolio || "未注明" },
    { label: "语言", value: [program.ielts, program.toefl].filter(Boolean).join(" / ") || "未注明" },
    { label: "GRE", value: program.gre || "未注明" }
  ];
}

Page({
  data: {
    loading: true,
    shared: false,
    activeTab: "programs",
    programs: [],
    caseStudies: [],
    articles: [],
    selectedIds: [],
    comparing: false,
    comparisonRows: [],
    contactOpen: false,
    contactOpening: "你好，这是我目前整理的 UX/HCI 选校单，主要还拿不准项目梯度和取舍，想请你有空帮我看一眼。"
  },

  onLoad(options) {
    const ids = String(options.ids || "").split(",").filter(Boolean).slice(0, 8);
    this.sharedIds = ids;
    this.setData({ shared: ids.length > 0 });
  },

  onShow() {
    this.loadWorkspace();
  },

  async onPullDownRefresh() {
    await this.loadWorkspace();
    wx.stopPullDownRefresh();
  },

  async loadWorkspace() {
    this.setData({ loading: true });
    try {
      if (this.data.shared) {
        const programs = await getProgramsByIds(this.sharedIds);
        this.setData({ programs, loading: false });
      } else {
        const workspace = await getUserWorkspace();
        this.setData({
          programs: workspace.programs || [],
          caseStudies: workspace.caseStudies || [],
          articles: workspace.articles || [],
          loading: false
        });
      }
      track("workspace_view", { shared: this.data.shared, programCount: this.data.programs.length });
    } catch (error) {
      this.setData({ loading: false });
      wx.showModal({ title: "读取收藏失败", content: error.message || "请稍后再试。", showCancel: false });
    }
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab, comparing: false });
  },

  openItem(event) {
    const type = event.currentTarget.dataset.type;
    const id = event.currentTarget.dataset.id;
    const pages = { program: "program-detail", case: "case-detail", article: "note-detail" };
    wx.navigateTo({ url: `/pages/${pages[type]}/index?id=${id}` });
  },

  async removeItem(event) {
    const type = event.currentTarget.dataset.type;
    const id = event.currentTarget.dataset.id;
    const confirmed = await new Promise((resolve) => wx.showModal({ title: "移出收藏？", content: "之后仍可在内容详情页重新收藏。", success: (result) => resolve(result.confirm) }));
    if (!confirmed) return;
    try {
      await setFavorite(type, id, false);
      track("favorite_remove", { type, id });
      await this.loadWorkspace();
    } catch (error) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },

  toggleCompare(event) {
    const id = event.currentTarget.dataset.id;
    const selectedIds = this.data.selectedIds.includes(id)
      ? this.data.selectedIds.filter((item) => item !== id)
      : this.data.selectedIds.concat(id);
    if (selectedIds.length > 4) {
      wx.showToast({ title: "一次最多比较 4 个项目", icon: "none" });
      return;
    }
    this.setData({
      selectedIds,
      comparing: false,
      programs: this.data.programs.map((item) => ({ ...item, compareSelected: selectedIds.includes(item.id) }))
    });
  },

  comparePrograms() {
    if (this.data.selectedIds.length < 2) {
      wx.showToast({ title: "请先选择 2–4 个项目", icon: "none" });
      return;
    }
    const selected = this.data.selectedIds.map((id) => this.data.programs.find((item) => item.id === id)).filter(Boolean);
    const facts = selected.map(comparisonFacts);
    const comparisonRows = facts[0].map((row, index) => ({ label: row.label, values: facts.map((group) => group[index].value) }));
    this.setData({ comparing: true, comparisonRows, comparisonPrograms: selected });
    track("shortlist_compare", { count: selected.length });
  },

  openContact() {
    track("contact_intent", { sourceType: "shortlist", count: this.data.programs.length });
    this.setData({ contactOpen: true });
  },

  closeContact() {
    this.setData({ contactOpen: false });
  },

  onShareAppMessage() {
    const ids = (this.data.selectedIds.length ? this.data.selectedIds : this.data.programs.slice(0, 8).map((item) => item.id)).slice(0, 8);
    track("share", { type: "shortlist", count: ids.length });
    return {
      title: `我的 UX / HCI 选校单（${ids.length} 个项目）`,
      path: `/pages/workspace/index?ids=${ids.join(",")}`
    };
  }
});
