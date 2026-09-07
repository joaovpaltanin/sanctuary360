import { describe, expect, it } from "vitest";
import { tourSteps } from "../content/sanctuary";
import { createExplorationStore } from "./exploration-store";

describe("navegação e sincronização da exploração", () => {
  it("inicia em exploração livre com interior visível", () => {
    const state = createExplorationStore().getState();
    expect(state.selectedId).toBeNull();
    expect(state.tourIndex).toBeNull();
    expect(state.roofVisible).toBe(false);
    expect(state.wallsVisible).toBe(false);
    expect(state.view).toBe("3d");
  });

  it("inicia, avança e volta sincronizando o elemento", () => {
    const store = createExplorationStore();
    store.getState().startTour();
    expect(store.getState().selectedId).toBe(tourSteps[0]);
    store.getState().nextStep();
    expect(store.getState().tourIndex).toBe(1);
    expect(store.getState().selectedId).toBe(tourSteps[1]);
    store.getState().previousStep();
    store.getState().previousStep();
    expect(store.getState().tourIndex).toBe(0);
  });

  it("não avança além da síntese e permite concluir", () => {
    const store = createExplorationStore();
    store.getState().startTour();
    for (let i = 0; i < tourSteps.length + 2; i++) store.getState().nextStep();
    expect(store.getState().tourIndex).toBe(tourSteps.length - 1);
    expect(store.getState().selectedId).toBe("christ");
    store.getState().exitTour();
    expect(store.getState().tourIndex).toBeNull();
    expect(store.getState().selectedId).toBe("christ");
  });

  it("revela o interior ao selecionar um móvel interno", () => {
    const store = createExplorationStore();
    store.getState().toggleRoof();
    store.getState().toggleWalls();
    store.getState().selectElement("ark");
    expect(store.getState().roofVisible).toBe(false);
    expect(store.getState().wallsVisible).toBe(false);
  });

  it("mostra o véu ao estudá-lo e reabre o interior para a arca", () => {
    const store = createExplorationStore();
    store.getState().selectElement("veil");
    expect(store.getState().roofVisible).toBe(false);
    expect(store.getState().wallsVisible).toBe(true);
    store.getState().selectElement("ark");
    expect(store.getState().wallsVisible).toBe(false);
  });

  it("seleção livre encerra o tour e reenquadra inclusive o mesmo item", () => {
    const store = createExplorationStore();
    store.getState().startTour();
    store.getState().selectElement("basin");
    const version = store.getState().cameraVersion;
    store.getState().selectElement("basin");
    expect(store.getState().tourIndex).toBeNull();
    expect(store.getState().selectedId).toBe("basin");
    expect(store.getState().cameraVersion).toBe(version + 1);
  });

  it("fechar o painel e retornar à vista geral encerra o tour", () => {
    const store = createExplorationStore();
    store.getState().startTour();
    store.getState().resetOverview();
    expect(store.getState().selectedId).toBeNull();
    expect(store.getState().tourIndex).toBeNull();
  });

  it("preserva o estudo ao alternar a leitura e o 3D", () => {
    const store = createExplorationStore();
    store.getState().startTour();
    store.getState().nextStep();
    store.getState().setView("reading");
    expect(store.getState().view).toBe("reading");
    expect(store.getState().selectedId).toBe("altar");
    store.getState().setView("3d");
    expect(store.getState().tourIndex).toBe(1);
  });

  it("ignora avançar e voltar sem tour ativo", () => {
    const store = createExplorationStore();
    store.getState().nextStep();
    store.getState().previousStep();
    expect(store.getState().tourIndex).toBeNull();
    expect(store.getState().selectedId).toBeNull();
  });
});
