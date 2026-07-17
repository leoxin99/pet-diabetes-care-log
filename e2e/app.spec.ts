import { expect, test } from "@playwright/test";

async function completeOnboarding(page: import("@playwright/test").Page, name = "豆豆", species: "dog" | "cat" = "dog") {
  await page.getByLabel("我已了解产品边界").check();
  await page.getByRole("button", { name: "下一步" }).click();
  if (species === "cat") await page.getByLabel("猫咪").check();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByLabel(species === "dog" ? "小狗名字" : "猫咪名字").fill(name);
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "开始记录" }).click();
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("onboarding, record and refresh persistence", async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByRole("heading", { name: /今天，陪 豆豆/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /血糖/ }).click();
  await page.getByLabel("数值").fill("208");
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(page.getByText(/血糖 208 mg\/dL/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/血糖 208 mg\/dL/)).toBeVisible();
});

test("demo data supports trends and report", async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) remoteRequests.push(request.url());
  });
  await completeOnboarding(page, "临时档案");
  await page.goto("/#/settings");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "加载合成 Demo" }).click();
  await expect(page.getByRole("status")).toContainText("已加载犬猫合成 Demo");
  await page.goto("/#/records");
  await expect(page.locator("canvas")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/#/analytics");
  await expect(page.getByRole("heading", { name: "记录数据分析" })).toBeVisible();
  await expect(page.getByText("血糖单位一致性")).toBeVisible();
  await expect(page.getByRole("button", { name: "导出当前范围 CSV" })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await page.goto("/#/reports");
  await expect(page.getByRole("heading", { name: /豆包（合成犬）.*复诊沟通记录/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(remoteRequests).toEqual([]);
});

test("treatment record requires explicit completed confirmation", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: /进食与治疗/ }).click();
  await page.getByLabel("同时记录一次已经执行的治疗").check();
  await page.getByLabel("治疗类型").selectOption("insulin");
  await page.getByLabel("实际记录量（可留空）").fill("4");
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(page.getByRole("alert")).toContainText("请确认这次治疗已经实际完成");
  await page.getByLabel("我确认这次治疗已经实际完成").check();
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(page.getByText(/已记录胰岛素注射 4 单位/)).toBeVisible();
});

test("community keeps new and medical-risk content out of the public list", async ({ page }) => {
  await completeOnboarding(page);
  await page.goto("/#/community");
  await expect(page.getByRole("heading", { name: "家长互助社区" })).toBeVisible();
  await expect(page.locator(".chip", { hasText: "合成示例" })).toHaveCount(2);
  await page.getByRole("button", { name: "发布脱敏经验" }).click();
  await page.getByLabel("标题").fill("想分享一个做法");
  await page.getByLabel("脱敏经验摘要").fill("我打算自行调整胰岛素并增加 2 IU，这只是审核门禁测试。");
  await page.getByRole("button", { name: "提交审核" }).click();
  await expect(page.getByRole("heading", { name: "我的待审内容" })).toBeVisible();
  await expect(page.getByText(/treatment_change/)).toBeVisible();
  await expect(page.locator(".chip", { hasText: "合成示例" })).toHaveCount(2);
  await expectNoHorizontalOverflow(page);
});

test("cat onboarding and active pet switching keep records isolated", async ({ page }) => {
  await completeOnboarding(page, "团子", "cat");
  await expect(page.getByRole("heading", { name: /今天，陪 团子/ })).toBeVisible();
  await page.goto("/#/settings");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "加载合成 Demo" }).click();
  await expect(page.getByRole("status")).toContainText("已加载犬猫合成 Demo");
  await page.getByLabel("当前宠物").selectOption({ label: "团子（合成猫）（猫）" });
  await page.goto("/#/records");
  await expect(page.getByText("176 mg/dL", { exact: true })).toBeVisible();
  await expect(page.getByText("218 mg/dL", { exact: true })).toHaveCount(0);
});
