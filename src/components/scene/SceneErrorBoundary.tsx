"use client";

import { Component, type ReactNode } from "react";
import { Icon } from "../Icon";

export function SceneFallback({ onUnavailable }: { onUnavailable: () => void }) {
  return <div className="scene-fallback" role="status">
    <Icon name="book" size={36} />
    <h3>O estudo continua, mesmo sem 3D.</h3>
    <p>Não foi possível carregar a cena ou iniciar a renderização neste navegador. Todos os textos estão disponíveis no modo leitura.</p>
    <button className="button primary" onClick={onUnavailable}>Abrir modo leitura <Icon name="arrow" /></button>
    <a href="/estudo">Acessar o guia completo</a>
  </div>;
}

export class SceneErrorBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback onUnavailable={this.props.onUnavailable} /> : this.props.children; }
}
