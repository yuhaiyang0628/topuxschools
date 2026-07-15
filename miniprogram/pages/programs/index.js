const { queryPrograms } = require("../../services/content");
const { compactText, programTags } = require("../../utils/format");

const REGIONS = [
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

function decoratePrograms(programs) {
  return programs.map((program) => ({
    ...program,
    tagLabels: programTags(program),
    tuitionLabel: compactText(program.tuition, 26),
    deadlineLabel: compactText(program.deadline, 20)
  }));
}

Page({
  data: {
    regions: REGIONS,
    filters: FILTERS,
    activeRegion: "US",
    activeFilter: "all",
    query: "",
    programs: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false
  },

  onLoad() {
    this.loadPrograms(true);
  },

  async onPullDownRefresh() {
    await this.loadPrograms(true);
    wx.stopPullDownRefresh();
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

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜学校列表",
      path: "/pages/programs/index"
    };
  }
});
