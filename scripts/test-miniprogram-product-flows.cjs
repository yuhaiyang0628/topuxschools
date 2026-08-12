const assert = require("assert").strict;
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const calls = [];
const toasts = [];
const modals = [];
const navigations = [];
const clipboard = [];
const previews = [];
const responses = new Map();

global.wx = {
  cloud: {
    callFunction: async ({ data }) => {
      calls.push(data);
      if (!responses.has(data.action)) throw new Error(`Missing test response for ${data.action}`);
      const response = responses.get(data.action);
      return { result: typeof response === "function" ? response(data.payload) : response };
    }
  },
  navigateBack: () => navigations.push("back"),
  navigateTo: ({ url }) => navigations.push(url),
  previewImage: (options) => previews.push(options),
  setClipboardData: ({ data, success }) => {
    clipboard.push(data);
    if (success) success();
  },
  showModal: (options) => {
    modals.push(options);
    if (options.success) options.success({ confirm: true });
  },
  showToast: (options) => toasts.push(options),
  stopPullDownRefresh: () => {}
};

function setNested(target, key, value) {
  const parts = key.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
}

function loadPage(relativePath) {
  let definition;
  global.Page = (config) => { definition = config; };
  const absolutePath = path.join(projectRoot, relativePath);
  delete require.cache[require.resolve(absolutePath)];
  require(absolutePath);
  const instance = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update, callback) {
      Object.entries(update).forEach(([key, value]) => setNested(this.data, key, value));
      if (callback) callback();
    }
  };
  Object.keys(definition).forEach((key) => {
    if (typeof definition[key] === "function") instance[key] = definition[key].bind(instance);
  });
  return instance;
}

function loadComponent(relativePath) {
  let definition;
  global.Component = (config) => { definition = config; };
  const absolutePath = path.join(projectRoot, relativePath);
  delete require.cache[require.resolve(absolutePath)];
  require(absolutePath);
  const properties = Object.fromEntries(Object.entries(definition.properties || {}).map(([key, config]) => [key, config.value]));
  const instance = {
    ...definition,
    data: { ...properties, ...JSON.parse(JSON.stringify(definition.data || {})) },
    setData(update) {
      Object.entries(update).forEach(([key, value]) => setNested(this.data, key, value));
    },
    triggerEvent(name) {
      this.lastEvent = name;
    }
  };
  Object.keys(definition.methods || {}).forEach((key) => {
    instance[key] = definition.methods[key].bind(instance);
  });
  return instance;
}

async function testWorkspace() {
  const programs = ["p1", "p2", "p3", "p4", "p5"].map((id, index) => ({
    id,
    school: `School ${index + 1}`,
    schoolCn: `学校 ${index + 1}`,
    program: `Program ${index + 1}`,
    programShort: `P${index + 1}`,
    region: "US",
    location: "City",
    length: "1年"
  }));
  responses.set("getProgramsByIds", ({ ids }) => programs.filter((item) => ids.includes(item.id)));
  responses.set("getUserWorkspace", { programs, caseStudies: [], articles: [] });
  responses.set("setFavorite", { favoritePrograms: [], favoriteCases: [], favoriteArticles: [] });
  responses.set("trackEvent", { status: "recorded" });

  const sharedPage = loadPage("miniprogram/pages/workspace/index.js");
  sharedPage.onLoad({ ids: "p2,p1" });
  await sharedPage.loadWorkspace();
  assert.equal(sharedPage.data.shared, true);
  assert.deepEqual(sharedPage.data.programs.map((item) => item.id), ["p1", "p2"]);

  const page = loadPage("miniprogram/pages/workspace/index.js");
  page.onLoad({});
  await page.loadWorkspace();
  assert.equal(page.data.programs.length, 5);
  ["p1", "p2", "p3", "p4"].forEach((id) => page.toggleCompare({ currentTarget: { dataset: { id } } }));
  assert.equal(page.data.selectedIds.length, 4);
  page.toggleCompare({ currentTarget: { dataset: { id: "p5" } } });
  assert.equal(page.data.selectedIds.length, 4);
  assert.equal(toasts[toasts.length - 1].title, "一次最多比较 4 个项目");
  page.comparePrograms();
  assert.equal(page.data.comparing, true);
  assert.equal(page.data.comparisonPrograms.length, 4);
  assert.equal(page.data.comparisonRows.length, 9);

  const share = page.onShareAppMessage();
  assert.match(share.path, /pages\/workspace\/index\?ids=p1,p2,p3,p4/);
  page.openContact();
  assert.equal(page.data.contactOpen, true);
  page.closeContact();
  assert.equal(page.data.contactOpen, false);
}

async function testContactSheet() {
  responses.set("trackEvent", { status: "recorded" });
  const component = loadComponent("miniprogram/components/contact-sheet/index.js");
  assert.equal(component.data.hasWechat, false);
  assert.equal(component.data.hasQr, false);
  component.copyWechat();
  assert.equal(toasts[toasts.length - 1].title, "微信号即将补充");
  component.previewQr();
  assert.equal(toasts[toasts.length - 1].title, "二维码即将补充");
  component.data.openingText = "这是测试开场白";
  component.copyOpening();
  assert.equal(clipboard[clipboard.length - 1], "这是测试开场白");
  component.close();
  assert.equal(component.lastEvent, "close");
  assert.equal(previews.length, 0);
}

async function main() {
  await testWorkspace();
  await testContactSheet();
  assert.ok(calls.some((item) => item.action === "trackEvent"));
  console.log("Product flow tests passed: workspace, compare, share, direct contact placeholders and opening copy.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
