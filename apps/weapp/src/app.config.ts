export default defineAppConfig({
  pages: [
    "pages/today/index",
    "pages/records/index",
    "pages/report/index",
    "pages/resources/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#f6f2eb",
    navigationBarTitleText: "糖宠照护",
    navigationBarTextStyle: "black",
    backgroundColor: "#f6f2eb",
  },
  tabBar: {
    color: "#697477",
    selectedColor: "#506b78",
    backgroundColor: "#fffdf9",
    list: [
      { pagePath: "pages/today/index", text: "今日" },
      { pagePath: "pages/records/index", text: "记录" },
      { pagePath: "pages/report/index", text: "报告" },
      { pagePath: "pages/resources/index", text: "资料" },
    ],
  },
});
