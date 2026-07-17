import Taro from "@tarojs/taro";
import { exportBundleSchema, type CareRecord, type ExportBundle, type PetProfile, type Species } from "@sugarpet/domain";

const STORAGE_KEY = "pet-diabetes-care-log:weapp:v0.5";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyBundle(): ExportBundle {
  return {
    schemaVersion: "0.5",
    appVersion: "0.5.0-weapp-prototype",
    exportedAt: new Date().toISOString(),
    pets: [], tasks: [], records: [],
    onboardingComplete: false,
  };
}

export function loadBundle(): ExportBundle {
  try {
    const raw = Taro.getStorageSync<string>(STORAGE_KEY);
    if (!raw) return emptyBundle();
    return exportBundleSchema.parse(JSON.parse(raw));
  } catch {
    return emptyBundle();
  }
}

export function saveBundle(bundle: ExportBundle) {
  const validated = exportBundleSchema.parse({ ...bundle, exportedAt: new Date().toISOString() });
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(validated));
  return validated;
}

export function createPet(name: string, species: Species) {
  const bundle = loadBundle();
  const now = new Date().toISOString();
  const pet: PetProfile = { id: id("pet"), name: name.trim(), species, defaultGlucoseUnit: "mg/dL", createdAt: now, updatedAt: now };
  return saveBundle({ ...bundle, pets: [...bundle.pets, pet], activePetId: pet.id, onboardingComplete: true });
}

export function activePet(bundle: ExportBundle) {
  return bundle.pets.find((pet) => pet.id === bundle.activePetId);
}

export function addRecord(record: Omit<CareRecord, "id" | "createdAt" | "updatedAt">) {
  const bundle = loadBundle();
  const now = new Date().toISOString();
  const complete = { ...record, id: id("record"), createdAt: now, updatedAt: now } as CareRecord;
  return saveBundle({ ...bundle, records: [...bundle.records, complete] });
}
