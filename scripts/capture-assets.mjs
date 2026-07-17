import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

await mkdir("docs/assets", { recursive: true });
await mkdir("output/pdf", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();

await page.goto("http://127.0.0.1:5173");
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByLabel("我已了解产品边界").check();
await page.getByRole("button", { name: "下一步" }).click();
await page.getByLabel("小狗名字").fill("临时档案");
await page.getByRole("button", { name: "下一步" }).click();
await page.getByRole("button", { name: "下一步" }).click();
await page.getByRole("button", { name: "开始记录" }).click();
await page.goto("http://127.0.0.1:5173/#/settings");
page.on("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "加载合成 Demo" }).click();

await page.goto("http://127.0.0.1:5173/#/today");
await page.getByRole("heading", { level: 1, name: /今天，陪/ }).waitFor();
await page.screenshot({ path: "docs/assets/today-desktop.png", fullPage: true });
await page.goto("http://127.0.0.1:5173/#/records");
await page.getByRole("heading", { level: 1, name: "记录与趋势" }).waitFor();
await page.screenshot({ path: "docs/assets/records-desktop.png", fullPage: true });
await page.goto("http://127.0.0.1:5173/#/analytics");
await page.getByRole("heading", { level: 1, name: "记录数据分析" }).waitFor();
await page.screenshot({ path: "docs/assets/analytics-desktop.png", fullPage: true });
await page.goto("http://127.0.0.1:5173/#/reports");
await page.getByRole("heading", { level: 1, name: "复诊报告" }).waitFor();
await page.getByLabel("准备向兽医确认的问题").fill("最近进食量变化是否需要继续观察？\n下次复诊希望确认记录频率。");
await page.screenshot({ path: "docs/assets/report-desktop.png", fullPage: true });
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("resize")));
await page.waitForTimeout(300);
await page.pdf({
  path: "output/pdf/糖宠照护_合成示例复诊报告.pdf",
  format: "A4",
  printBackground: true,
  margin: { top: "13mm", right: "13mm", bottom: "13mm", left: "13mm" },
});

const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
await mobile.goto("http://127.0.0.1:5173/#/today");
const demo = await page.evaluate(() => localStorage.getItem("pet-diabetes-care-log:v0.3"));
await mobile.evaluate((value) => {
  if (value) localStorage.setItem("pet-diabetes-care-log:v0.3", value);
}, demo);
await mobile.reload();
await mobile.getByRole("heading", { level: 1, name: /今天，陪/ }).waitFor();
await mobile.screenshot({ path: "docs/assets/today-mobile.png", fullPage: true });

await browser.close();
console.log("截图与示例 PDF 已生成。");
