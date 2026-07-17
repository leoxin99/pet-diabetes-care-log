import { describe, expect, it } from "vitest";
import { recordsInRange } from "./helpers";
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
});
