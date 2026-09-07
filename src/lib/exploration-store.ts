import { createStore } from "zustand/vanilla";
import { getElement, tourSteps, type ElementId } from "../content/sanctuary";

export interface ExplorationState {
  selectedId: ElementId | null;
  tourIndex: number | null;
  roofVisible: boolean;
  wallsVisible: boolean;
  view: "3d" | "reading";
  cameraVersion: number;
  selectElement: (id: ElementId) => void;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  exitTour: () => void;
  resetOverview: () => void;
  toggleRoof: () => void;
  toggleWalls: () => void;
  setView: (view: "3d" | "reading") => void;
}

function revealInterior(id: ElementId) {
  const zone = getElement(id).zone;
  if (id === "veil") return { roofVisible: false, wallsVisible: true };
  return zone === "Lugar Santo" || zone === "Lugar Santíssimo"
    ? { roofVisible: false, wallsVisible: false }
    : {};
}

export const createExplorationStore = () => createStore<ExplorationState>()((set, get) => {
  const moveStep = (delta: number) => {
    const state = get();
    if (state.tourIndex === null) return;
    const index = Math.max(0, Math.min(tourSteps.length - 1, state.tourIndex + delta));
    const id = tourSteps[index];
    set({ tourIndex: index, selectedId: id, cameraVersion: state.cameraVersion + 1, ...revealInterior(id) });
  };

  return {
    selectedId: null,
    tourIndex: null,
    roofVisible: false,
    wallsVisible: false,
    view: "3d",
    cameraVersion: 0,
    selectElement: (id) => set((state) => ({
      selectedId: id, tourIndex: null, cameraVersion: state.cameraVersion + 1, ...revealInterior(id),
    })),
    startTour: () => set((state) => ({ selectedId: tourSteps[0], tourIndex: 0, cameraVersion: state.cameraVersion + 1 })),
    nextStep: () => moveStep(1),
    previousStep: () => moveStep(-1),
    exitTour: () => set({ tourIndex: null }),
    resetOverview: () => set((state) => ({ selectedId: null, tourIndex: null, cameraVersion: state.cameraVersion + 1 })),
    toggleRoof: () => set((state) => ({ roofVisible: !state.roofVisible })),
    toggleWalls: () => set((state) => ({ wallsVisible: !state.wallsVisible })),
    setView: (view) => set((state) => ({ view, cameraVersion: state.cameraVersion + 1 })),
  };
});
