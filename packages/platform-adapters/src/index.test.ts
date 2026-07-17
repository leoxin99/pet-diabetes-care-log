import { describe, expect, it } from "vitest";
import { WeappStorageAdapter, type WeappStorageApi } from "./index";

describe("WeappStorageAdapter", () => {
  it("adapts asynchronous mini-program storage without importing Taro", async () => {
    const values = new Map<string, string>();
    const api: WeappStorageApi = {
      getStorage: async ({ key }) => {
        if (!values.has(key)) throw new Error("missing");
        return { data: values.get(key) as string };
      },
      setStorage: async ({ key, data }) => { values.set(key, data); },
      removeStorage: async ({ key }) => { values.delete(key); },
    };
    const storage = new WeappStorageAdapter(api);
    expect(await storage.getItem("care")).toBeNull();
    await storage.setItem("care", "local-only");
    expect(await storage.getItem("care")).toBe("local-only");
    await storage.removeItem("care");
    expect(await storage.getItem("care")).toBeNull();
  });
});
