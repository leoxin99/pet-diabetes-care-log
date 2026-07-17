import { exportBundleSchema, type ExportBundle } from "../domain/schema";

export const STORAGE_KEY = "pet-diabetes-care-log:v0.3";
export const APP_VERSION = "0.4.0";

export const emptyBundle = (): ExportBundle => ({
  schemaVersion: "0.3",
  exportedAt: new Date().toISOString(),
  appVersion: APP_VERSION,
  onboardingComplete: false,
  pets: [],
  records: [],
  tasks: [],
});

export class StorageError extends Error {}

export function loadBundle(storage: Storage = localStorage): ExportBundle {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyBundle();
  try {
    return exportBundleSchema.parse(JSON.parse(raw));
  } catch {
    throw new StorageError("浏览器中的数据无法读取。请先导出可用数据或清空后重试。");
  }
}

export function saveBundle(bundle: ExportBundle, storage: Storage = localStorage): ExportBundle {
  const next = exportBundleSchema.parse({ ...bundle, appVersion: APP_VERSION, exportedAt: new Date().toISOString() });
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    throw new StorageError("保存失败，可能是浏览器存储不可用或空间不足。");
  }
}

export function parseImport(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError("文件不是有效的 JSON。");
  }
  const result = exportBundleSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new StorageError(`数据校验失败：${first.path.join(".") || "根对象"} ${first.message}`);
  }
  return result.data;
}

export function downloadBundle(bundle: ExportBundle, filename = `糖宠照护备份-${new Date().toISOString().slice(0, 10)}.json`) {
  const blob = new Blob([JSON.stringify({ ...bundle, appVersion: APP_VERSION, exportedAt: new Date().toISOString() }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
