import { z } from "zod";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "时间格式无效");
const finiteNonNegative = z.number().finite().min(0);

export const speciesSchema = z.enum(["dog", "cat"]);
export const glucoseUnitSchema = z.enum(["mg/dL", "mmol/L"]);
export const relativeLevelSchema = z.enum(["less", "usual", "more", "unknown"]);
export const consumedLevelSchema = z.enum(["none", "little", "half", "most", "all", "unknown"]);
export const treatmentKindSchema = z.enum(["insulin", "oral_medication", "other"]);

export const petProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "请填写宠物名字").max(40),
  species: speciesSchema,
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
  type: z.enum(["meal_treatment", "glucose", "weight", "observation", "appointment", "custom"]),
  title: z.string().trim().min(1).max(80),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  repeatDays: z.array(z.number().int().min(0).max(6)).min(1),
  enabled: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const treatmentEventSchema = z.object({
  kind: treatmentKindSchema,
  administered: z.literal(true),
  name: z.string().trim().max(80).optional(),
  recordedAmount: finiteNonNegative.optional(),
  unitLabel: z.string().trim().max(20).optional(),
  note: z.string().trim().max(300).optional(),
});

const careRecordFields = {
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
};

export const careRecordSchema = z.object({
  ...careRecordFields,
  treatments: z.array(treatmentEventSchema).max(10).optional(),
}).superRefine((record, ctx) => {
  const hasObservation = record.dailyObservation &&
    (record.dailyObservation.appetite ||
      record.dailyObservation.drinking ||
      record.dailyObservation.urination ||
      record.dailyObservation.activity ||
      record.dailyObservation.symptoms?.length);
  if (!record.glucose && !record.meal && record.waterMl === undefined &&
      !record.treatments?.length && record.weightKg === undefined &&
      !hasObservation && !record.notes?.trim()) {
    ctx.addIssue({ code: "custom", message: "请至少填写一项记录或备注" });
  }
});

export const exportBundleSchema = z.object({
  schemaVersion: z.literal("0.5"),
  exportedAt: isoDate,
  appVersion: z.string().min(1),
  onboardingComplete: z.boolean(),
  activePetId: z.string().min(1).optional(),
  pets: z.array(petProfileSchema).max(20),
  records: z.array(careRecordSchema),
  tasks: z.array(careTaskSchema),
}).superRefine((bundle, ctx) => {
  for (const [label, items] of [["宠物", bundle.pets], ["记录", bundle.records], ["计划", bundle.tasks]] as const) {
    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: `${label}中存在重复 ID` });
    }
  }
  const petIds = new Set(bundle.pets.map((pet) => pet.id));
  const taskById = new Map(bundle.tasks.map((task) => [task.id, task]));
  if (bundle.pets.length && (!bundle.activePetId || !petIds.has(bundle.activePetId))) {
    ctx.addIssue({ code: "custom", path: ["activePetId"], message: "当前宠物档案无效" });
  }
  if (!bundle.pets.length && bundle.activePetId) {
    ctx.addIssue({ code: "custom", path: ["activePetId"], message: "空档案不能设置当前宠物" });
  }
  for (const [index, record] of bundle.records.entries()) {
    if (!petIds.has(record.petId)) ctx.addIssue({ code: "custom", path: ["records", index, "petId"], message: "记录关联的宠物不存在" });
    if (record.taskId) {
      const task = taskById.get(record.taskId);
      if (!task || task.petId !== record.petId) ctx.addIssue({ code: "custom", path: ["records", index, "taskId"], message: "记录关联的计划无效" });
    }
  }
  for (const [index, task] of bundle.tasks.entries()) {
    if (!petIds.has(task.petId)) ctx.addIssue({ code: "custom", path: ["tasks", index, "petId"], message: "计划关联的宠物不存在" });
  }
});

const legacyCareRecordSchema = z.object({
  ...careRecordFields,
  insulinAdministration: z.object({
    administered: z.literal(true),
    recordedAmount: finiteNonNegative.optional(),
    unitLabel: z.string().trim().max(20).optional(),
    note: z.string().trim().max(300).optional(),
  }).optional(),
});

export const legacyExportBundleSchema = z.object({
  schemaVersion: z.literal("0.3"),
  exportedAt: isoDate,
  appVersion: z.string().min(1),
  onboardingComplete: z.boolean(),
  pets: z.array(petProfileSchema),
  records: z.array(legacyCareRecordSchema),
  tasks: z.array(z.object({
    id: z.string().min(1), petId: z.string().min(1),
    type: z.enum(["meal_insulin", "glucose", "weight", "observation", "appointment", "custom"]),
    title: z.string().trim().min(1).max(80), localTime: z.string(),
    repeatDays: z.array(z.number()), enabled: z.boolean(), createdAt: isoDate, updatedAt: isoDate,
  })),
});

export type PetProfile = z.infer<typeof petProfileSchema>;
export type CareTask = z.infer<typeof careTaskSchema>;
export type TreatmentEvent = z.infer<typeof treatmentEventSchema>;
export type CareRecord = z.infer<typeof careRecordSchema>;
export type ExportBundle = z.infer<typeof exportBundleSchema>;
export type LegacyExportBundle = z.infer<typeof legacyExportBundleSchema>;
export type GlucoseUnit = z.infer<typeof glucoseUnitSchema>;
export type Species = z.infer<typeof speciesSchema>;
export type TreatmentKind = z.infer<typeof treatmentKindSchema>;
