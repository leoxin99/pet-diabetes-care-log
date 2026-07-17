import { describe, expect, it } from "vitest";
import { analyzeRecords, recordsToAnalysisCsv } from "./analytics";
import type { CareRecord } from "./schema";

function record(id: string, recordedAt: string, extra: Partial<CareRecord>): CareRecord {
  return {
    id, petId: "pet", recordedAt, createdAt: recordedAt, updatedAt: recordedAt, notes: "记录",
    ...extra,
  };
}

describe("record analytics", () => {
  it("profiles coverage, dimensions, units and field completeness", () => {
    const records = [
      record("1", "2026-07-15T08:00:00+08:00", {
        glucose: { value: 200, unit: "mg/dL", context: "before_meal" },
        meal: { consumedLevel: "all" },
      }),
      record("2", "2026-07-16T20:00:00+08:00", {
        glucose: { value: 11.2, unit: "mmol/L", context: "unknown" },
        weightKg: 9.4,
      }),
    ];
    const result = analyzeRecords(records, new Date(2026, 6, 15), new Date(2026, 6, 17));
    expect(result.totalRecords).toBe(2);
    expect(result.coveredDays).toBe(2);
    expect(result.coverageRate).toBe(67);
    expect(result.activeDimensions).toBe(4);
    expect(result.glucoseByUnit["mg/dL"]?.average).toBe(200);
    expect(result.qualityChecks.find((item) => item.id === "glucose-unit")?.status).toBe("attention");
  });

  it("exports analysis-ready CSV without changing source values", () => {
    const csv = recordsToAnalysisCsv([record("1", "2026-07-15T08:00:00+08:00", {
      glucose: { value: 208, unit: "mg/dL", context: "before_meal" }, notes: "早餐前",
    })]);
    expect(csv).toContain("glucose_value");
    expect(csv).toContain('"208"');
    expect(csv).toContain('"早餐前"');
  });
});
