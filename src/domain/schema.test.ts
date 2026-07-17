import { describe, expect, it } from "vitest";
import { careRecordSchema, exportBundleSchema } from "./schema";

const baseRecord = {
  id: "record-1",
  petId: "pet-1",
  recordedAt: "2026-07-16T08:00:00.000Z",
  createdAt: "2026-07-16T08:00:00.000Z",
  updatedAt: "2026-07-16T08:00:00.000Z",
};

describe("careRecordSchema", () => {
  it("accepts a factual glucose record", () => {
    const result = careRecordSchema.safeParse({
      ...baseRecord,
      glucose: { value: 12.4, unit: "mmol/L", context: "before_meal" },
    });
    expect(result.success).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])("rejects invalid numeric value %s", (value) => {
    const result = careRecordSchema.safeParse({
      ...baseRecord,
      glucose: { value, unit: "mg/dL", context: "unknown" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty record", () => {
    expect(careRecordSchema.safeParse(baseRecord).success).toBe(false);
  });

  it("only accepts administered=true for treatment records", () => {
    expect(careRecordSchema.safeParse({
      ...baseRecord,
      treatments: [{ kind: "insulin", administered: false, recordedAmount: 3 }],
    }).success).toBe(false);
  });
});

describe("exportBundleSchema", () => {
  it("rejects an unsupported schema version", () => {
    const result = exportBundleSchema.safeParse({
      schemaVersion: "0.3",
      exportedAt: new Date().toISOString(),
      appVersion: "0.2.0",
      onboardingComplete: false,
      pets: [],
      records: [],
      tasks: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate record IDs", () => {
    const record = { ...baseRecord, notes: "事实备注" };
    const result = exportBundleSchema.safeParse({
      schemaVersion: "0.5",
      exportedAt: new Date().toISOString(),
      appVersion: "0.5.0",
      onboardingComplete: true,
      activePetId: "pet-1",
      pets: [{ id: "pet-1", name: "豆豆", species: "dog", defaultGlucoseUnit: "mg/dL", createdAt: baseRecord.createdAt, updatedAt: baseRecord.updatedAt }],
      records: [record, record],
      tasks: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects records that reference another pet's task", () => {
    const now = baseRecord.recordedAt;
    const result = exportBundleSchema.safeParse({
      schemaVersion: "0.5", exportedAt: now, appVersion: "0.5.0", onboardingComplete: true, activePetId: "pet-1",
      pets: [
        { id: "pet-1", name: "豆豆", species: "dog", defaultGlucoseUnit: "mg/dL", createdAt: now, updatedAt: now },
        { id: "pet-2", name: "团子", species: "cat", defaultGlucoseUnit: "mg/dL", createdAt: now, updatedAt: now },
      ],
      tasks: [{ id: "task-2", petId: "pet-2", type: "glucose", title: "记录", localTime: "08:00", repeatDays: [1], enabled: true, createdAt: now, updatedAt: now }],
      records: [{ ...baseRecord, taskId: "task-2", notes: "事实" }],
    });
    expect(result.success).toBe(false);
  });
});
