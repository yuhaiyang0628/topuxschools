const { queryCases } = require("../../services/content");

const REGIONS = ["US", "CAN", "UK", "AUS", "EU", "Asia"];

Page({
  data: {
    regions: REGIONS,
    activeRegion: "",
    query: "",
    cases: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false
  },

  onLoad() {
    this.loadCases(true);
  },

  async onPullDownRefresh() {
    await this.loadCases(true);
    wx.stopPullDownRefresh();
  },

  async loadCases(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    const result = await queryCases({
      region: this.data.activeRegion,
      query: this.data.query,
      page,
      pageSize: 6
    });
    const cases = result.list.map((caseStudy) => ({
      ...caseStudy,
      regionLabel: (caseStudy.regions || []).join(" · ")
    }));
    this.setData({
      cases: reset ? cases : this.data.cases.concat(cases),
      total: result.total,
      page: result.page,
      hasMore: result.hasMore,
      loading: false
    });
  },

  onRegionTap(event) {
    const region = event.currentTarget.dataset.region;
    this.setData({ activeRegion: this.data.activeRegion === region ? "" : region }, () => this.loadCases(true));
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value });
  },

  onSearchConfirm() {
    this.loadCases(true);
  },

  onSearchClear() {
    this.setData({ query: "" }, () => this.loadCases(true));
  },

  loadMore() {
    this.loadCases(false);
  },

  openCase(event) {
    wx.navigateTo({ url: `/pages/case-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  onShareAppMessage() {
    return {
      title: "Top UX Schools｜真实录取案例",
      path: "/pages/cases/index"
    };
  }
});
