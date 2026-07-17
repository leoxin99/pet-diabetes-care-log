import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "README.md", "docs"];
const forbidden = ["血糖正常", "血糖危险", "建议调整胰岛素", "推荐剂量", "AI 兽医", "医学级准确", "临床验证"];
const allowedExtensions = new Set([".ts", ".tsx", ".md", ".html"]);
const findings = [];

async function scan(path) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await scan(child);
    else if (allowedExtensions.has(extname(child))) {
      const text = await readFile(child, "utf8");
      for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${child}: ${phrase}`);
    }
  }
}

for (const root of roots) {
  try {
    const stat = await import("node:fs/promises").then(({ stat }) => stat(root));
    if (stat.isDirectory()) await scan(root);
    else {
      const text = await readFile(root, "utf8");
      for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${root}: ${phrase}`);
    }
  } catch {}
}

if (findings.length) {
  console.error("发现可能越过产品边界的文案：\n" + findings.join("\n"));
  process.exit(1);
}
console.log("安全文案扫描通过。");
