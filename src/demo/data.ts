import type { ExportBundle, PetProfile } from "../domain/schema";

export function createDemoBundle(): ExportBundle {
  const now = new Date();
  const petId = crypto.randomUUID();
  const pet: PetProfile = {
    id: petId, name: "豆包（合成演示）", species: "dog", breed: "混合犬",
    defaultGlucoseUnit: "mg/dL", vetName: "演示宠物医院",
    notes: "此档案与所有记录均为合成数据。",
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  };
  const values = [218, 196, 241, 205, 229, 188, 214];
  const records = values.flatMap((value, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    date.setHours(8, 10, 0, 0);
    return [
      {
        id: crypto.randomUUID(), petId, recordedAt: date.toISOString(),
        glucose: { value, unit: "mg/dL" as const, context: "before_meal" as const },
        meal: { foodName: "演示犬粮", amount: 85, unit: "g" as const, consumedLevel: index === 3 ? "most" as const : "all" as const },
        insulinAdministration: { administered: true as const, recordedAmount: 4, unitLabel: "单位" },
        createdAt: date.toISOString(), updatedAt: date.toISOString(),
      },
      ...(index % 2 === 0 ? [{
        id: crypto.randomUUID(), petId, recordedAt: new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        weightKg: 9.42 - index * 0.01,
        dailyObservation: { appetite: "usual" as const, drinking: "usual" as const, activity: "usual" as const },
        notes: "合成演示观察记录", createdAt: date.toISOString(), updatedAt: date.toISOString(),
      }] : []),
    ];
  });
  const tasks = [
    ["早间照护记录", "08:00"], ["晚间照护记录", "20:00"],
  ].map(([title, localTime]) => ({
    id: crypto.randomUUID(), petId, type: "meal_insulin" as const, title, localTime,
    repeatDays: [0,1,2,3,4,5,6], enabled: true, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }));
  return { schemaVersion: "0.3", exportedAt: now.toISOString(), appVersion: "0.4.0", onboardingComplete: true, pets: [pet], records, tasks };
}
