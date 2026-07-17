import { describe, expect, it } from "vitest";
import { recordsInRange, selectRecords } from "./helpers";
import type { CareRecord } from "./schema";

describe("recordsInRange", () => {
  it("includes the full local boundary dates and sorts newest first", () => {
    const localRecord = (id: string, day: number, hour: number, minute: number) => {
      const recordedAt = new Date(2026, 6, day, hour, minute).toISOString();
      return { id, petId: "p", notes: "记录", recordedAt, createdAt: recordedAt, updatedAt: recordedAt } as CareRecord;
    };
    const records = [
      localRecord("1", 15, 0, 1),
      localRecord("2", 16, 23, 59),
      localRecord("3", 17, 0, 1),
    ];
    const result = recordsInRange(records, new Date(2026, 6, 15), new Date(2026, 6, 16));
    expect(result.map((record) => record.id)).toEqual(["2", "1"]);
  });

  it("scopes selected records by pet and data type", () => {
    const now = new Date(2026, 6, 16, 8).toISOString();
    const records = [
      { id: "dog-glucose", petId: "dog", glucose: { value: 200, unit: "mg/dL" as const, context: "random" as const } },
      { id: "dog-note", petId: "dog", notes: "观察" },
      { id: "cat-glucose", petId: "cat", glucose: { value: 180, unit: "mg/dL" as const, context: "random" as const } },
    ].map((record) => ({ ...record, recordedAt: now, createdAt: now, updatedAt: now })) as CareRecord[];
    const result = selectRecords(records, { start: new Date(2026, 6, 16), end: new Date(2026, 6, 16), petId: "dog", types: ["glucose"] });
    expect(result.map((record) => record.id)).toEqual(["dog-glucose"]);
  });
});
