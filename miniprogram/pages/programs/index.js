const { queryPrograms } = require("../../services/content");
const { compactText, programTags } = require("../../utils/format");
const { getUserWorkspace } = require("../../services/workspace");
const { track } = require("../../services/analytics");

const REGIONS = [
  { value: "", label: "Global" },
  { value: "US", label: "US" },
  { value: "CAN", label: "CAN" },
  { value: "UK", label: "UK" },
  { value: "AUS", label: "AUS" },
  { value: "EU", label: "EU" },
  { value: "Asia", label: "Asia" }
];

const FILTERS = [
  { value: "all", label: "全部" },
  { value: "portfolio", label: "需要作品集" },
  { value: "stem", label: "STEM / OPT" },
  { value: "rolling", label: "滚动录取" },
  { value: "no-gre", label: "免 GRE" }
];

function programTitle(program) {
  const short = String(program.programShort || program.short || "").trim();
  let full = String(program.program || "").trim();

  // Source data often repeats the abbreviation at the end of the full name.
  [` (${short})`, `（${short}）`].forEach((suffix) => {
    if (short && full.endsWith(suffix)) full = full.slice(0, -suffix.length).trim();
  });

  if (short && full) return `${short}(${full})`;
  return short || full;
}

function decoratePrograms(programs) {
  return programs.map((program) => ({
    ...program,
    displayTitle: programTitle(program),
    tagLabels: programTags(program),
    tuitionLabel: compactText(program.tuition, 26),
    deadlineLabel: compactText(program.deadline, 20)
  }));
}

Page({
  data: {
    regions: REGIONS,
    filters: FILTERS,
    activeRegion: "",
    activeFilter: "all",
    query: "",
    programs: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false,
    savedCount: 0
  },

  onLoad() {
    this.loadPrograms(true);
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setSelected(0);
    this.loadSavedCount();
  },

  async loadSavedCount() {
    try {
      const workspace = await getUserWorkspace();
      this.setData({ savedCount: (workspace.favoritePrograms || []).length });
    } catch (error) {
      console.info("[Top UX Schools] Workspace count unavailable.", error);
    }
  },

  async onPullDownRefresh() {
    await this.loadPrograms(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMore();
  },

  async loadPrograms(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    const result = await queryPrograms({
      region: this.data.activeRegion,
      filter: this.data.activeFilter,
      query: this.data.query,
      page,
      pageSize: 20
    });
    this.setData({
      programs: reset ? decoratePrograms(result.list) : this.data.programs.concat(decoratePrograms(result.list)),
      total: result.total,
      page: result.page,
      hasMore: result.hasMore,
      loading: false
    });
  },

  onRegionTap(event) {
    this.setData({ activeRegion: event.currentTarget.dataset.region }, () => this.loadPrograms(true));
  },

  onFilterTap(event) {
    this.setData({ activeFilter: event.currentTarget.dataset.filter }, () => this.loadPrograms(true));
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value });
  },

  onSearchConfirm() {
    track("search", { type: "program", query: this.data.query, region: this.data.activeRegion, filter: this.data.activeFilter });
    this.loadPrograms(true);
  },

  onSearchClear() {
    this.setData({ query: "" }, () => this.loadPrograms(true));
  },

  loadMore() {
    this.loadPrograms(false);
  },

  openProgram(event) {
    wx.navigateTo({ url: `/pages/program-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openWorkspace() {
    wx.navigateTo({ url: "/pages/workspace/index" });
  },

  onShareAppMessage() {
    track("share", { type: "program_list", region: this.data.activeRegion });
    return {
      title: "Top UX Schools｜学校列表",
      path: "/pages/programs/index"
    };
  }
});
