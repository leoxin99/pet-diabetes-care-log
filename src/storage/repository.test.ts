import { describe, expect, it } from "vitest";
import { emptyBundle, LEGACY_STORAGE_KEY, loadBundle, parseImport, saveBundle, STORAGE_KEY, StorageError } from "./repository";
import { createDemoBundle } from "../demo/data";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe("versioned storage repository", () => {
  it("round-trips a bundle", () => {
    const storage = new MemoryStorage();
    const bundle = emptyBundle();
    saveBundle(bundle, storage);
    expect(loadBundle(storage)).toMatchObject({ schemaVersion: "0.5", records: [] });
    expect(storage.getItem(STORAGE_KEY)).toContain('"schemaVersion":"0.5"');
  });

  it("validates and persists the dog and cat demo bundle", () => {
    const storage = new MemoryStorage();
    const saved = saveBundle(createDemoBundle(), storage);
    expect(saved.pets.map((pet) => pet.species)).toEqual(["dog", "cat"]);
    expect(loadBundle(storage).records.length).toBeGreaterThan(10);
  });

  it("does not accept malformed JSON imports", () => {
    expect(() => parseImport("{broken")).toThrow(StorageError);
  });

  it("does not accept incompatible imports", () => {
    expect(() => parseImport(JSON.stringify({ schemaVersion: "0.2" }))).toThrow("数据校验失败");
  });

  it("migrates v0.3 data without deleting the legacy key", () => {
    const storage = new MemoryStorage();
    const now = "2026-07-16T08:00:00.000Z";
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({
      schemaVersion: "0.3", exportedAt: now, appVersion: "0.4.0", onboardingComplete: true,
      pets: [{ id: "pet-1", name: "豆豆", species: "dog", defaultGlucoseUnit: "mg/dL", createdAt: now, updatedAt: now }],
      tasks: [{ id: "task-1", petId: "pet-1", type: "meal_insulin", title: "早间记录", localTime: "08:00", repeatDays: [0,1,2,3,4,5,6], enabled: true, createdAt: now, updatedAt: now }],
      records: [{ id: "record-1", petId: "pet-1", taskId: "task-1", recordedAt: now, insulinAdministration: { administered: true, recordedAmount: 4, unitLabel: "单位" }, createdAt: now, updatedAt: now }],
    }));
    const migrated = loadBundle(storage);
    expect(migrated.schemaVersion).toBe("0.5");
    expect(migrated.activePetId).toBe("pet-1");
    expect(migrated.records[0].treatments?.[0]).toMatchObject({ kind: "insulin", recordedAmount: 4 });
    expect(storage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toContain('"schemaVersion":"0.5"');
  });
});
