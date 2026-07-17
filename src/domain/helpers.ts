import { endOfDay, format, isSameDay, parseISO, startOfDay, subDays } from "date-fns";
import type { CareRecord, CareTask } from "./schema";

export const DISCLAIMER = "糖宠照护用于记录、整理和复诊沟通辅助，不提供诊断、治疗建议或胰岛素剂量建议。有关宠物健康和治疗的问题，请咨询兽医。";

export const levelLabels = {
  less: "比平时少",
  usual: "和平时差不多",
  more: "比平时多",
  unknown: "不确定",
  none: "没有吃",
  little: "少量",
  half: "约一半",
  most: "大部分",
  all: "全部",
} as const;

export const glucoseContextLabels = {
  before_meal: "餐前",
  after_meal: "餐后",
  random: "随机",
  unknown: "未标注",
} as const;

export const taskTypeLabels = {
  meal_insulin: "进食与注射",
  glucose: "血糖",
  weight: "体重",
  observation: "今日状态",
  appointment: "复诊",
  custom: "其他",
} as const;

export function recordSummary(record: CareRecord): string[] {
  const parts: string[] = [];
  if (record.glucose) parts.push(`血糖 ${record.glucose.value} ${record.glucose.unit}（${glucoseContextLabels[record.glucose.context]}）`);
  if (record.meal) {
    const amount = record.meal.amount !== undefined ? `，${record.meal.amount} ${record.meal.unit === "g" ? "g" : record.meal.customUnit || "份"}` : "";
    parts.push(`进食 ${levelLabels[record.meal.consumedLevel]}${record.meal.foodName ? `，${record.meal.foodName}` : ""}${amount}`);
  }
  if (record.insulinAdministration) {
    parts.push(`已记录注射${record.insulinAdministration.recordedAmount !== undefined ? ` ${record.insulinAdministration.recordedAmount} ${record.insulinAdministration.unitLabel || "单位"}` : ""}`);
  }
  if (record.weightKg !== undefined) parts.push(`体重 ${record.weightKg} kg`);
  if (record.waterMl !== undefined) parts.push(`饮水 ${record.waterMl} ml`);
  if (record.dailyObservation) {
    const observations = [
      record.dailyObservation.appetite && `食欲${levelLabels[record.dailyObservation.appetite]}`,
      record.dailyObservation.drinking && `饮水${levelLabels[record.dailyObservation.drinking]}`,
      record.dailyObservation.urination && `排尿${levelLabels[record.dailyObservation.urination]}`,
      record.dailyObservation.activity && `活动${levelLabels[record.dailyObservation.activity]}`,
      ...(record.dailyObservation.symptoms || []),
    ].filter(Boolean);
    if (observations.length) parts.push(`状态：${observations.join("、")}`);
  }
  if (record.notes) parts.push(`备注：${record.notes}`);
  return parts;
}

export function recordsInRange(records: CareRecord[], start: Date, end: Date) {
  const from = startOfDay(start).getTime();
  const to = endOfDay(end).getTime();
  return records
    .filter((record) => {
      const time = parseISO(record.recordedAt).getTime();
      return time >= from && time <= to;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function recentRange(days: number) {
  return { start: subDays(new Date(), days - 1), end: new Date() };
}

export function isTaskScheduledToday(task: CareTask) {
  return task.enabled && task.repeatDays.includes(new Date().getDay());
}

export function isTaskRecordedToday(task: CareTask, records: CareRecord[]) {
  return records.some((record) => record.taskId === task.id && isSameDay(parseISO(record.recordedAt), new Date()));
}

export function toLocalInput(iso = new Date().toISOString()) {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

export function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

export function formatDateTime(iso: string) {
  return format(parseISO(iso), "MM月dd日 HH:mm");
}
