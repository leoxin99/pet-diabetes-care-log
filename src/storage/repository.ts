import {
  exportBundleSchema,
  legacyExportBundleSchema,
  type ExportBundle,
  type LegacyExportBundle,
} from "../domain/schema";

export const STORAGE_KEY = "pet-diabetes-care-log:v0.5";
export const LEGACY_STORAGE_KEY = "pet-diabetes-care-log:v0.3";
export const APP_VERSION = "0.7.0-alpha.1";

export const emptyBundle = (): ExportBundle => ({
  schemaVersion: "0.5",
  exportedAt: new Date().toISOString(),
  appVersion: APP_VERSION,
  onboardingComplete: false,
  activePetId: undefined,
  pets: [],
  records: [],
  tasks: [],
});

export class StorageError extends Error {}

export function migrateLegacyBundle(legacy: LegacyExportBundle): ExportBundle {
  const migrated = {
    schemaVersion: "0.5" as const,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    onboardingComplete: legacy.onboardingComplete,
    activePetId: legacy.pets[0]?.id,
    pets: legacy.pets,
    records: legacy.records.map(({ insulinAdministration, ...record }) => ({
      ...record,
      treatments: insulinAdministration ? [{
        kind: "insulin" as const,
        administered: true as const,
        recordedAmount: insulinAdministration.recordedAmount,
        unitLabel: insulinAdministration.unitLabel,
        note: insulinAdministration.note,
      }] : undefined,
    })),
    tasks: legacy.tasks.map((task) => ({
      ...task,
      type: task.type === "meal_insulin" ? "meal_treatment" as const : task.type,
    })),
  };
  return exportBundleSchema.parse(migrated);
}

function validationMessage(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    const issue = (error as { issues: { path: PropertyKey[]; message: string }[] }).issues[0];
    if (issue) return `${issue.path.join(".") || "根对象"} ${issue.message}`;
  }
  return "数据结构不兼容";
}

export function loadBundle(storage: Storage = localStorage): ExportBundle {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw) {
    try { return exportBundleSchema.parse(JSON.parse(raw)); }
    catch (error) { throw new StorageError(`浏览器中的 v0.5 数据无法读取：${validationMessage(error)}。`); }
  }

  const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return emptyBundle();
  try {
    const migrated = migrateLegacyBundle(legacyExportBundleSchema.parse(JSON.parse(legacyRaw)));
    storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (error) {
    throw new StorageError(`旧版数据迁移失败：${validationMessage(error)}。旧数据未被覆盖。`);
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
  try { parsed = JSON.parse(raw); }
  catch { throw new StorageError("文件不是有效的 JSON。"); }

  const current = exportBundleSchema.safeParse(parsed);
  if (current.success) return current.data;
  const legacy = legacyExportBundleSchema.safeParse(parsed);
  if (legacy.success) return migrateLegacyBundle(legacy.data);
  const first = current.error.issues[0];
  throw new StorageError(`数据校验失败：${first.path.join(".") || "根对象"} ${first.message}`);
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
