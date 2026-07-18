Component({
  data: {
    selected: 0,
    tabs: [
      { path: "/pages/programs/index", text: "项目", icon: "/assets/tab-icons/program.svg" },
      { path: "/pages/cases/index", text: "案例", icon: "/assets/tab-icons/cases.svg" },
      { path: "/pages/notes/index", text: "笔记", icon: "/assets/tab-icons/notes.svg" }
    ]
  },

  methods: {
    setSelected(index) {
      this.setData({ selected: Number(index) || 0 });
    },

    switchTab(event) {
      const { index, path } = event.currentTarget.dataset;
      this.setData({ selected: Number(index) });
      wx.switchTab({ url: path });
    }
  }
});
