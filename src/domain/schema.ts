import { z } from "zod";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "时间格式无效");
const finiteNonNegative = z.number().finite().min(0);

export const glucoseUnitSchema = z.enum(["mg/dL", "mmol/L"]);
export const relativeLevelSchema = z.enum(["less", "usual", "more", "unknown"]);
export const consumedLevelSchema = z.enum(["none", "little", "half", "most", "all", "unknown"]);

export const petProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "请填写小狗名字").max(40),
  species: z.enum(["dog", "cat"]),
  breed: z.string().trim().max(80).optional(),
  birthDate: z.string().optional(),
  defaultGlucoseUnit: glucoseUnitSchema,
  vetName: z.string().trim().max(80).optional(),
  vetContact: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const careTaskSchema = z.object({
  id: z.string().min(1),
  petId: z.string().min(1),
  type: z.enum(["meal_insulin", "glucose", "weight", "observation", "appointment", "custom"]),
  title: z.string().trim().min(1).max(80),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  repeatDays: z.array(z.number().int().min(0).max(6)).min(1),
  enabled: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const careRecordSchema = z.object({
  id: z.string().min(1),
  petId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  recordedAt: isoDate,
  glucose: z.object({
    value: finiteNonNegative,
    unit: glucoseUnitSchema,
    context: z.enum(["before_meal", "after_meal", "random", "unknown"]),
  }).optional(),
  meal: z.object({
    foodName: z.string().trim().max(100).optional(),
    amount: finiteNonNegative.optional(),
    unit: z.enum(["g", "portion", "custom"]).optional(),
    customUnit: z.string().trim().max(30).optional(),
    consumedLevel: consumedLevelSchema,
  }).optional(),
  waterMl: finiteNonNegative.optional(),
  insulinAdministration: z.object({
    administered: z.literal(true),
    recordedAmount: finiteNonNegative.optional(),
    unitLabel: z.string().trim().max(20).optional(),
    note: z.string().trim().max(300).optional(),
  }).optional(),
  weightKg: finiteNonNegative.optional(),
  dailyObservation: z.object({
    appetite: relativeLevelSchema.optional(),
    drinking: relativeLevelSchema.optional(),
    urination: relativeLevelSchema.optional(),
    activity: relativeLevelSchema.optional(),
    symptoms: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  }).optional(),
  notes: z.string().trim().max(1000).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).superRefine((record, ctx) => {
  const hasObservation = record.dailyObservation &&
    (record.dailyObservation.appetite ||
      record.dailyObservation.drinking ||
      record.dailyObservation.urination ||
      record.dailyObservation.activity ||
      record.dailyObservation.symptoms?.length);
  if (!record.glucose && !record.meal && record.waterMl === undefined &&
      !record.insulinAdministration && record.weightKg === undefined &&
      !hasObservation && !record.notes?.trim()) {
    ctx.addIssue({ code: "custom", message: "请至少填写一项记录或备注" });
  }
});

export const exportBundleSchema = z.object({
  schemaVersion: z.literal("0.3"),
  exportedAt: isoDate,
  appVersion: z.string().min(1),
  onboardingComplete: z.boolean(),
  pets: z.array(petProfileSchema),
  records: z.array(careRecordSchema),
  tasks: z.array(careTaskSchema),
}).superRefine((bundle, ctx) => {
  for (const [label, items] of [["宠物", bundle.pets], ["记录", bundle.records], ["计划", bundle.tasks]] as const) {
    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: `${label}中存在重复 ID` });
    }
  }
});

export type PetProfile = z.infer<typeof petProfileSchema>;
export type CareTask = z.infer<typeof careTaskSchema>;
export type CareRecord = z.infer<typeof careRecordSchema>;
export type ExportBundle = z.infer<typeof exportBundleSchema>;
export type GlucoseUnit = z.infer<typeof glucoseUnitSchema>;
