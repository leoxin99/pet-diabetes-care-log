import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from "react";
import type { CareRecord, CareTask, ExportBundle, PetProfile } from "../domain/schema";
import { emptyBundle, loadBundle, saveBundle, type StorageError } from "../storage/repository";

type Action =
  | { type: "replace"; bundle: ExportBundle }
  | { type: "completeOnboarding"; pet: PetProfile; tasks: CareTask[] }
  | { type: "setActivePet"; id: string }
  | { type: "savePet"; pet: PetProfile }
  | { type: "saveRecord"; record: CareRecord }
  | { type: "deleteRecord"; id: string }
  | { type: "restoreRecord"; record: CareRecord }
  | { type: "saveTask"; task: CareTask }
  | { type: "deleteTask"; id: string }
  | { type: "clear" };

function reducer(state: ExportBundle, action: Action): ExportBundle {
  switch (action.type) {
    case "replace": return action.bundle;
    case "completeOnboarding":
      return { ...state, onboardingComplete: true, activePetId: action.pet.id, pets: [action.pet], tasks: action.tasks };
    case "setActivePet": return { ...state, activePetId: action.id };
    case "savePet":
      return { ...state, activePetId: action.pet.id, pets: state.pets.some((p) => p.id === action.pet.id)
        ? state.pets.map((p) => p.id === action.pet.id ? action.pet : p)
        : [...state.pets, action.pet] };
    case "saveRecord":
      return { ...state, records: state.records.some((r) => r.id === action.record.id)
        ? state.records.map((r) => r.id === action.record.id ? action.record : r)
        : [...state.records, action.record] };
    case "deleteRecord": return { ...state, records: state.records.filter((r) => r.id !== action.id) };
    case "restoreRecord": return { ...state, records: [...state.records, action.record] };
    case "saveTask":
      return { ...state, tasks: state.tasks.some((t) => t.id === action.task.id)
        ? state.tasks.map((t) => t.id === action.task.id ? action.task : t)
        : [...state.tasks, action.task] };
    case "deleteTask": return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "clear": return emptyBundle();
  }
}

interface AppContextValue {
  state: ExportBundle;
  dispatch: (action: Action) => boolean;
  storageError: string | null;
  pet?: PetProfile;
  petRecords: CareRecord[];
  petTasks: CareTask[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [storageError, setStorageError] = useState<string | null>(null);
  const [state, reducerDispatch] = useReducer(reducer, undefined, () => {
    try { return loadBundle(); }
    catch (error) {
      setStorageError((error as StorageError).message);
      return emptyBundle();
    }
  });

  const dispatch = useCallback((action: Action) => {
    const next = reducer(state, action);
    try {
      saveBundle(next);
      setStorageError(null);
      reducerDispatch(action);
      return true;
    } catch (error) {
      setStorageError((error as StorageError).message);
      return false;
    }
  }, [state]);

  const value = useMemo(() => {
    const pet = state.pets.find((item) => item.id === state.activePetId) || state.pets[0];
    return {
      state,
      dispatch,
      storageError,
      pet,
      petRecords: pet ? state.records.filter((record) => record.petId === pet.id) : [],
      petTasks: pet ? state.tasks.filter((task) => task.petId === pet.id) : [],
    };
  }, [state, dispatch, storageError]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
