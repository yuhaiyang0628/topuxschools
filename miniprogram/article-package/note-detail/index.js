const { getArticle } = require("../../services/content");
const { isCloudFile, resolveCloudImageBlocks } = require("../../services/media");
const { getUserWorkspace, setFavorite } = require("../../services/workspace");
const { track } = require("../../services/analytics");

function getArticleBlocks(article) {
  if (Array.isArray(article.content) && article.content.length) {
    return article.content.map((block) => {
      if (block.type !== "image" || block.miniSrc || !block.src) return block;
      const miniSrc = block.src
        .replace("/assets/articles/tud-series/", "/article-package/assets/article-mini/tud-series/")
        .replace(/\.(png|jpe?g)$/i, ".jpg");
      return miniSrc === block.src ? block : { ...block, miniSrc };
    });
  }
  const imagesByPosition = (article.images || []).reduce((groups, image) => {
    const position = Number(image.after) || 0;
    const originalSrc = image.resolvedUrl || image.fileID || image.mini || image.src || "";
    const block = isCloudFile(originalSrc) || /^https?:\/\//i.test(originalSrc) ? {
      type: "image",
      alt: image.alt || "文章配图",
      fileID: image.fileID || image.mini || "",
      miniSrc: originalSrc
    } : {
      type: "image",
      alt: image.alt || "文章配图",
      miniSrc: `/article-package/assets/article-mini/uw-series/${originalSrc.split("/").pop().replace(/\.(png|jpe?g|webp)$/i, ".jpg")}`
    };
    groups[position] = [...(groups[position] || []), block];
    return groups;
  }, {});
  const blocks = [];
  (imagesByPosition[0] || []).forEach((image) => blocks.push(image));
  (article.body || []).forEach((text, index) => {
    blocks.push({ type: "paragraph", segments: [{ text }] });
    (imagesByPosition[index + 1] || []).forEach((image) => blocks.push(image));
  });
  return blocks;
}

Page({
  data: {
    article: null,
    saved: false,
    savingFavorite: false,
    contactOpen: false,
    contactOpening: ""
  },

  async onLoad(options) {
    const article = await getArticle(options.id);
    if (!article) {
      wx.showToast({ title: "未找到这篇笔记", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: article.title });
    const articleBlocks = await resolveCloudImageBlocks(getArticleBlocks(article));
    this.setData({ article, articleBlocks });
    track("detail_view", { type: "article", id: article.id, category: article.category });
    this.loadFavoriteState();
  },

  async onShow() {
    if (this.data.article) this.loadFavoriteState();
  },

  async loadFavoriteState() {
    try {
      const workspace = await getUserWorkspace();
      this.setData({ saved: (workspace.favoriteArticles || []).includes(this.data.article.id) });
    } catch (error) {
      console.info("[Top UX Schools] Favorite state unavailable.", error);
    }
  },

  async toggleFavorite() {
    const saved = !this.data.saved;
    this.setData({ savingFavorite: true });
    try {
      await setFavorite("article", this.data.article.id, saved);
      this.setData({ saved, savingFavorite: false });
      track(saved ? "favorite_add" : "favorite_remove", { type: "article", id: this.data.article.id });
      wx.showToast({ title: saved ? "笔记已收藏" : "已取消收藏", icon: "success" });
    } catch (error) {
      this.setData({ savingFavorite: false });
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },

  openContact() {
    const article = this.data.article;
    track("contact_intent", { sourceType: "article", sourceId: article.id });
    this.setData({ contactOpen: true, contactOpening: `你好，我读了《${article.title}》，在自己的材料里也遇到了类似问题，想具体请教一下。` });
  },

  closeContact() {
    this.setData({ contactOpen: false });
  },

  onShareAppMessage() {
    const article = this.data.article;
    track("share", { type: "article", id: article ? article.id : "" });
    return {
      title: article ? article.title : "Top UX Schools 干货笔记",
      path: `/article-package/note-detail/index?id=${article.id}`
    };
  },

  onShareTimeline() {
    const article = this.data.article;
    return { title: article ? article.title : "Top UX Schools 干货笔记", query: `id=${article.id}` };
  }
});
