import { describe, expect, it } from "vitest";
import { recordsInRange, selectRecords } from "./helpers";
import type { CareRecord } from "./schema";

describe("recordsInRange", () => {
  it("includes the full local boundary dates and sorts newest first", () => {
    const records = [
      { id: "1", recordedAt: "2026-07-15T00:01:00+08:00" },
      { id: "2", recordedAt: "2026-07-16T23:59:00+08:00" },
      { id: "3", recordedAt: "2026-07-17T00:01:00+08:00" },
    ].map((record) => ({
      ...record, petId: "p", notes: "记录", createdAt: record.recordedAt, updatedAt: record.recordedAt,
    })) as CareRecord[];
    const result = recordsInRange(records, new Date(2026, 6, 15), new Date(2026, 6, 16));
    expect(result.map((record) => record.id)).toEqual(["2", "1"]);
  });

  it("scopes selected records by pet and data type", () => {
    const now = "2026-07-16T08:00:00+08:00";
    const records = [
      { id: "dog-glucose", petId: "dog", glucose: { value: 200, unit: "mg/dL" as const, context: "random" as const } },
      { id: "dog-note", petId: "dog", notes: "观察" },
      { id: "cat-glucose", petId: "cat", glucose: { value: 180, unit: "mg/dL" as const, context: "random" as const } },
    ].map((record) => ({ ...record, recordedAt: now, createdAt: now, updatedAt: now })) as CareRecord[];
    const result = selectRecords(records, { start: new Date(2026, 6, 16), end: new Date(2026, 6, 16), petId: "dog", types: ["glucose"] });
    expect(result.map((record) => record.id)).toEqual(["dog-glucose"]);
  });
});
