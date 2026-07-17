import type { CareRecord, CareTask, ExportBundle, PetProfile } from "../domain/schema";

function recordsForPet(pet: PetProfile, values: number[], now: Date): CareRecord[] {
  return values.flatMap((value, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    date.setHours(8, 10, 0, 0);
    const treatment = index % 2 === 0 ? [{
      kind: "insulin" as const,
      administered: true as const,
      recordedAmount: pet.species === "dog" ? 4 : 2,
      unitLabel: "单位",
      note: "合成演示记录，不代表治疗建议",
    }] : undefined;
    return [
      {
        id: crypto.randomUUID(), petId: pet.id, recordedAt: date.toISOString(),
        glucose: { value, unit: "mg/dL" as const, context: "before_meal" as const },
        meal: { foodName: pet.species === "dog" ? "演示犬粮" : "演示猫粮", amount: pet.species === "dog" ? 85 : 40, unit: "g" as const, consumedLevel: index === 3 ? "most" as const : "all" as const },
        treatments: treatment,
        createdAt: date.toISOString(), updatedAt: date.toISOString(),
      },
      ...(index % 2 === 0 ? [{
        id: crypto.randomUUID(), petId: pet.id, recordedAt: new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        weightKg: pet.species === "dog" ? 9.42 - index * 0.01 : 5.3 - index * 0.01,
        dailyObservation: { appetite: "usual" as const, drinking: "usual" as const, activity: "usual" as const },
        notes: "合成演示观察记录", createdAt: date.toISOString(), updatedAt: date.toISOString(),
      }] : []),
    ];
  });
}

function tasksForPet(petId: string, now: Date): CareTask[] {
  return [["早间照护记录", "08:00"], ["晚间照护记录", "20:00"]].map(([title, localTime]) => ({
    id: crypto.randomUUID(), petId, type: "meal_treatment" as const, title, localTime,
    repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }));
}

export function createDemoBundle(): ExportBundle {
  const now = new Date();
  const dog: PetProfile = {
    id: crypto.randomUUID(), name: "豆包（合成犬）", species: "dog", breed: "混合犬",
    defaultGlucoseUnit: "mg/dL", vetName: "演示宠物医院",
    notes: "此档案与所有记录均为合成数据。",
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  };
  const cat: PetProfile = {
    id: crypto.randomUUID(), name: "团子（合成猫）", species: "cat", breed: "混合猫",
    defaultGlucoseUnit: "mg/dL", vetName: "演示宠物医院",
    notes: "此档案与所有记录均为合成数据。",
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  };
  return {
    schemaVersion: "0.5", exportedAt: now.toISOString(), appVersion: "0.7.0-alpha.1", onboardingComplete: true,
    activePetId: dog.id, pets: [dog, cat],
    records: [...recordsForPet(dog, [218, 196, 241, 205, 229, 188, 214], now), ...recordsForPet(cat, [176, 188, 169, 194, 181, 172, 186], now)],
    tasks: [...tasksForPet(dog.id, now), ...tasksForPet(cat.id, now)],
  };
}
