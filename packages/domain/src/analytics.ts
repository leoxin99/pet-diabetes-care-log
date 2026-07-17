import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { CareRecord, GlucoseUnit } from "./schema";

export const recordTypeLabels = {
  glucose: "血糖",
  meal: "进食",
  treatment: "治疗记录",
  weight: "体重",
  observation: "状态观察",
  notes: "备注",
} as const;

export const timeBucketLabels = {
  night: "00-05 时",
  morning: "06-11 时",
  afternoon: "12-17 时",
  evening: "18-23 时",
} as const;

type RecordType = keyof typeof recordTypeLabels;
type TimeBucket = keyof typeof timeBucketLabels;

export interface NumericSummary {
  count: number;
  minimum: number;
  maximum: number;
  average: number;
}

export interface DataQualityCheck {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: "ok" | "attention" | "neutral";
}

export interface RecordAnalytics {
  totalRecords: number;
  coveredDays: number;
  rangeDays: number;
  coverageRate: number;
  averageRecordsPerCoveredDay: number;
  activeDimensions: number;
  recordTypeCounts: Record<RecordType, number>;
  timeBucketCounts: Record<TimeBucket, number>;
  glucoseByUnit: Partial<Record<GlucoseUnit, NumericSummary>>;
  weightSummary?: NumericSummary;
  qualityChecks: DataQualityCheck[];
}

function summarize(values: number[]): NumericSummary | undefined {
  if (!values.length) return undefined;
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    average: Math.round((total / values.length) * 10) / 10,
  };
}

function timeBucket(recordedAt: string): TimeBucket {
  const hour = parseISO(recordedAt).getHours();
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function analyzeRecords(records: CareRecord[], start: Date, end: Date): RecordAnalytics {
  const rangeDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const coveredDays = new Set(records.map((record) => format(parseISO(record.recordedAt), "yyyy-MM-dd"))).size;
  const recordTypeCounts: Record<RecordType, number> = {
    glucose: 0, meal: 0, treatment: 0, weight: 0, observation: 0, notes: 0,
  };
  const timeBucketCounts: Record<TimeBucket, number> = {
    night: 0, morning: 0, afternoon: 0, evening: 0,
  };
  const glucoseValues: Record<GlucoseUnit, number[]> = { "mg/dL": [], "mmol/L": [] };
  const weightValues: number[] = [];
  let unknownGlucoseContext = 0;
  let unknownMealConsumption = 0;
  let observationRecords = 0;
  let observationWithDetails = 0;

  for (const record of records) {
    timeBucketCounts[timeBucket(record.recordedAt)] += 1;
    if (record.glucose) {
      recordTypeCounts.glucose += 1;
      glucoseValues[record.glucose.unit].push(record.glucose.value);
      if (record.glucose.context === "unknown") unknownGlucoseContext += 1;
    }
    if (record.meal) {
      recordTypeCounts.meal += 1;
      if (record.meal.consumedLevel === "unknown") unknownMealConsumption += 1;
    }
    if (record.treatments?.length) recordTypeCounts.treatment += 1;
    if (record.weightKg !== undefined) {
      recordTypeCounts.weight += 1;
      weightValues.push(record.weightKg);
    }
    if (record.dailyObservation) {
      recordTypeCounts.observation += 1;
      observationRecords += 1;
      if (record.dailyObservation.appetite || record.dailyObservation.drinking ||
          record.dailyObservation.urination || record.dailyObservation.activity ||
          record.dailyObservation.symptoms?.length) observationWithDetails += 1;
    }
    if (record.notes?.trim()) recordTypeCounts.notes += 1;
  }

  const usedUnits = (Object.keys(glucoseValues) as GlucoseUnit[]).filter((unit) => glucoseValues[unit].length > 0);
  const glucoseCount = recordTypeCounts.glucose;
  const mealCount = recordTypeCounts.meal;
  const qualityChecks: DataQualityCheck[] = [
    {
      id: "glucose-unit",
      label: "血糖单位一致性",
      value: usedUnits.length <= 1 ? "单位一致" : `${usedUnits.length} 种单位`,
      detail: usedUnits.length ? `当前范围：${usedUnits.join("、")}` : "当前范围没有血糖记录",
      status: usedUnits.length <= 1 ? "ok" : "attention",
    },
    {
      id: "glucose-context",
      label: "血糖场景字段",
      value: glucoseCount ? `${glucoseCount - unknownGlucoseContext}/${glucoseCount} 已填写` : "暂无数据",
      detail: unknownGlucoseContext ? `${unknownGlucoseContext} 条记录未标注餐前、餐后或随机场景` : "已有血糖记录的场景字段完整",
      status: unknownGlucoseContext ? "attention" : (glucoseCount ? "ok" : "neutral"),
    },
    {
      id: "meal-consumption",
      label: "进食完成情况",
      value: mealCount ? `${mealCount - unknownMealConsumption}/${mealCount} 已填写` : "暂无数据",
      detail: unknownMealConsumption ? `${unknownMealConsumption} 条进食记录选择了“不确定”` : "已有进食记录的完成情况完整",
      status: unknownMealConsumption ? "attention" : (mealCount ? "ok" : "neutral"),
    },
    {
      id: "observation-detail",
      label: "状态观察明细",
      value: observationRecords ? `${observationWithDetails}/${observationRecords} 有结构化字段` : "暂无数据",
      detail: "统计食欲、饮水、排尿、活动或症状字段是否被记录，不判断医学意义",
      status: observationRecords && observationWithDetails < observationRecords ? "attention" : (observationRecords ? "ok" : "neutral"),
    },
  ];

  return {
    totalRecords: records.length,
    coveredDays,
    rangeDays,
    coverageRate: Math.round((coveredDays / rangeDays) * 100),
    averageRecordsPerCoveredDay: coveredDays ? Math.round((records.length / coveredDays) * 10) / 10 : 0,
    activeDimensions: Object.values(recordTypeCounts).filter((count) => count > 0).length,
    recordTypeCounts,
    timeBucketCounts,
    glucoseByUnit: {
      "mg/dL": summarize(glucoseValues["mg/dL"]),
      "mmol/L": summarize(glucoseValues["mmol/L"]),
    },
    weightSummary: summarize(weightValues),
    qualityChecks,
  };
}

function csvCell(value: string | number | undefined) {
  const text = value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function recordsToAnalysisCsv(records: CareRecord[]) {
  const headers = [
    "recorded_at", "glucose_value", "glucose_unit", "glucose_context",
    "meal_consumed_level", "water_ml", "treatment_kinds", "treatment_names", "treatment_recorded_amounts", "treatment_units",
    "weight_kg", "appetite", "drinking", "urination", "activity", "symptoms", "notes",
  ];
  const rows = [...records]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((record) => [
      record.recordedAt,
      record.glucose?.value,
      record.glucose?.unit,
      record.glucose?.context,
      record.meal?.consumedLevel,
      record.waterMl,
      record.treatments?.map((item) => item.kind).join("|"),
      record.treatments?.map((item) => item.name || "").join("|"),
      record.treatments?.map((item) => item.recordedAmount ?? "").join("|"),
      record.treatments?.map((item) => item.unitLabel || "").join("|"),
      record.weightKg,
      record.dailyObservation?.appetite,
      record.dailyObservation?.drinking,
      record.dailyObservation?.urination,
      record.dailyObservation?.activity,
      record.dailyObservation?.symptoms?.join("|"),
      record.notes,
    ].map(csvCell).join(","));
  return `\uFEFF${headers.join(",")}\n${rows.join("\n")}`;
}
