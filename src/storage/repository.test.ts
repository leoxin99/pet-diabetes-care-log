import { describe, expect, it } from "vitest";
import { emptyBundle, loadBundle, parseImport, saveBundle, STORAGE_KEY, StorageError } from "./repository";

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
    expect(loadBundle(storage)).toMatchObject({ schemaVersion: "0.3", records: [] });
    expect(storage.getItem(STORAGE_KEY)).toContain('"schemaVersion":"0.3"');
  });

  it("does not accept malformed JSON imports", () => {
    expect(() => parseImport("{broken")).toThrow(StorageError);
  });

  it("does not accept incompatible imports", () => {
    expect(() => parseImport(JSON.stringify({ schemaVersion: "0.2" }))).toThrow("数据校验失败");
  });
});
