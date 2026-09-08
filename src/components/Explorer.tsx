"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useStore } from "zustand";
import { elements, getElement, tourSteps, type ElementId } from "../content/sanctuary";
import { createExplorationStore } from "../lib/exploration-store";
import { Icon } from "./Icon";
import { InfoPanel } from "./InfoPanel";
import { SceneErrorBoundary } from "./scene/SceneErrorBoundary";
import { useReducedMotion, type GraphicQuality } from "../lib/scene-preferences";

const SanctuaryScene = dynamic(() => import("./scene/SanctuaryScene"), {
  ssr: false,
  loading: () => <div className="scene-loading" role="status">
    <span className="loading-mark"><Icon name="sanctuary" size={40} /></span>
    <strong>Preparando sua visita</strong><span>Carregando a reconstrução 3D…</span>
    <a href="/estudo">Prefere continuar em texto?</a>
  </div>,
});

export function Explorer() {
  const [store] = useState(createExplorationStore);
  const state = useStore(store);
  const [unavailable, setUnavailable] = useState(false);
  const [texturesEnabled, setTexturesEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [quality, setQuality] = useState<GraphicQuality>("medium");
  const [horizonView, setHorizonView] = useState(false);
  const reducedMotion = useReducedMotion();
  const selected = state.selectedId ? getElement(state.selectedId) : null;
  const inTour = state.tourIndex !== null;
  const lastStep = state.tourIndex === tourSteps.length - 1;
  const onUnavailable = useCallback(() => {
    setUnavailable(true);
    store.getState().setView("reading");
    document.querySelector<HTMLButtonElement>('[aria-label="Modo de visualização"] button:last-child')?.focus();
  }, [store]);

  function closePanel() {
    const id = state.selectedId;
    setHorizonView(false);
    state.resetOverview();
    if (id) document.querySelector<HTMLButtonElement>(`[data-element-id="${id}"]`)?.focus();
  }

  const select = (id: ElementId) => state.selectElement(id);

  return <div className="explorer-page">
    <section className="intro" aria-labelledby="page-title">
      <div>
        <p className="eyebrow"><span className="little-line" /> O TABERNÁCULO DO DESERTO</p>
        <h1 id="page-title">Um espaço sagrado.<br /><em>Uma história para descobrir.</em></h1>
        <p className="intro-copy">Explore o santuário, conheça seus elementos e descubra<br className="desktop-break" /> as conexões bíblicas que apontam para Cristo.</p>
      </div>
      <div className="intro-action">
        <button className="button primary" onClick={state.startTour}>
          <Icon name="play" size={17} />{inTour ? "Reiniciar tour" : "Iniciar tour guiado"}<Icon name="arrow" size={18} />
        </button>
        <span>9 etapas · no seu ritmo</span>
      </div>
    </section>

    <section className="exploration-shell" aria-label="Exploração do Tabernáculo">
      <div className="workspace-bar">
        <div className="workspace-title"><Icon name="compass" size={19} /><span>{inTour ? "Tour guiado" : "Exploração livre"}</span><span className="live-badge">INTERATIVO</span></div>
        <div className="view-switch" aria-label="Modo de visualização">
          <button aria-pressed={state.view === "3d"} onClick={() => { setUnavailable(false); state.setView("3d"); }}><Icon name="cube" size={16} />Modelo 3D</button>
          <button aria-pressed={state.view === "reading"} onClick={() => state.setView("reading")}><Icon name="book" size={16} />Modo leitura</button>
        </div>
      </div>
      <div className={`workspace ${selected ? "has-panel" : ""}`}>
        <nav className="element-nav" aria-label="Elementos do santuário">
          <div className="element-nav-heading"><span className="eyebrow">SEU PERCURSO</span><span>01 — 09</span></div>
          <ol>{elements.map((element, index) => <li key={element.id}>
            <button data-element-id={element.id} aria-current={state.selectedId === element.id ? "step" : undefined} onClick={() => select(element.id)}>
              <span className="element-number">{inTour && index < (state.tourIndex ?? 0) ? <Icon name="check" size={13} /> : element.number}</span>
              <span><strong>{element.name}</strong><small>{element.zone}</small></span>
              <span className="item-arrow"><Icon name="arrow" size={14} /></span>
            </button>
          </li>)}</ol>
          <div className="nav-footnote"><Icon name="book" size={18} /><p>Do texto bíblico<br />à compreensão do espaço.</p></div>
        </nav>
        <div className="stage-column">
          {state.view === "3d" && <div className="graphics-settings" role="group" aria-label="Aparência do ambiente">
            <div className="graphics-controls">
              <button onClick={() => { setHorizonView(true); state.resetOverview(); }}>Ver horizonte</button>
              <button aria-pressed={texturesEnabled} onClick={() => setTexturesEnabled((value) => !value)} aria-describedby="surface-mode">Texturas</button>
              <button aria-pressed={animationsEnabled && !reducedMotion} disabled={reducedMotion} onClick={() => setAnimationsEnabled((value) => !value)} aria-describedby="motion-mode">Animações do ambiente</button>
              <label>Qualidade gráfica<select value={quality} onChange={(event) => setQuality(event.target.value as GraphicQuality)}>
                <option value="low">Econômica</option><option value="medium">Equilibrada</option><option value="high">Detalhada</option>
              </select></label>
            </div>
            <div className="graphics-description">
              <span id="surface-mode">{texturesEnabled ? "Materiais com texturas" : "Cores lisas · sem texturas"}</span>
              <span id="motion-mode">{reducedMotion ? "Movimento reduzido: ambiente estático." : animationsEnabled ? "Animações ativas quando a cena está visível." : "Animações pausadas."}</span>
            </div>
          </div>}
          {state.view === "3d" ? <div className="scene-stage" data-testid="scene-stage">
            <div className="scene-top-label"><span className="status-dot" />{selected ? selected.zone.toUpperCase() : horizonView ? "HORIZONTE" : "VISTA GERAL"}<small>Reconstrução ilustrativa</small></div>
            <SceneErrorBoundary onUnavailable={onUnavailable}>
              <SanctuaryScene
                selectedId={state.selectedId}
                roofVisible={state.roofVisible}
                wallsVisible={state.wallsVisible}
                cameraVersion={state.cameraVersion}
                texturesEnabled={texturesEnabled}
                animationsEnabled={animationsEnabled}
                quality={quality}
                horizonView={horizonView}
                onSelect={select}
                onUnavailable={onUnavailable}
              />
            </SceneErrorBoundary>
            <div className="scene-tools">
              <button aria-label="Voltar à vista geral" title="Voltar à vista geral" onClick={closePanel}><Icon name="reset" size={18} /></button><span />
              <button aria-pressed={state.roofVisible} onClick={state.toggleRoof} title="Mostrar ou ocultar as coberturas"><Icon name="layers" size={17} />Coberturas</button>
              <button aria-pressed={state.wallsVisible} onClick={state.toggleWalls} title="Mostrar ou ocultar paredes e véu"><Icon name="cube" size={17} />Paredes e véu</button>
            </div>
            <div className="scene-compass" aria-hidden="true"><Icon name="compass" size={26} /><span>Leste: entrada</span></div>
            <div className="scene-hint"><span className="mouse-symbol" />Arraste para girar<span>·</span>Role ou pince para aproximar</div>
          </div> : <div className="reading-stage">
            <div className="reading-heading">
              <Icon name="book" size={27} /><h2>O mesmo percurso.<br /><em>Outro modo de aprender.</em></h2>
              <p>{unavailable ? "A renderização 3D ficou indisponível. O conteúdo continua acessível abaixo." : "Selecione um elemento para consultar descrições, referências e interpretação teológica."}</p>
            </div>
            <div className="reading-cards">{elements.map((element) => <button key={element.id} onClick={() => select(element.id)} aria-label={`Ler sobre ${element.name}`}>
              <span>{element.number}</span><div><h3>{element.name}</h3><p>{element.subtitle}</p></div><Icon name="arrow" size={17} />
            </button>)}</div>
            <Link href="/estudo" className="text-link">Ler todos os textos em uma página <Icon name="arrow" size={16} /></Link>
          </div>}
          {inTour ? <div className="tour-bar">
            <div className="tour-progress">
              <span>ETAPA {(state.tourIndex ?? 0) + 1} DE {tourSteps.length}</span><strong>{selected?.name}</strong>
              <progress value={(state.tourIndex ?? 0) + 1} max={tourSteps.length} aria-label="Progresso do tour" />
            </div>
            <div className="tour-controls">
              <button className="icon-button" aria-label="Etapa anterior" disabled={state.tourIndex === 0} onClick={state.previousStep}><Icon name="back" /></button>
              <button className="button primary compact" onClick={lastStep ? state.exitTour : state.nextStep}>{lastStep ? "Concluir tour" : "Próxima etapa"}<Icon name={lastStep ? "check" : "arrow"} size={17} /></button>
              <button className="text-button" onClick={state.exitTour}>Sair do tour</button>
            </div>
          </div> : <div className="stage-caption">
            <span><Icon name="info" size={16} />Selecione um marcador ou um elemento da lista para estudar.</span><span>1 unidade = 1 côvado</span>
          </div>}
        </div>
        {selected && <InfoPanel key={selected.id} element={selected} onClose={closePanel} />}
      </div>
      <div className="workspace-footer"><span><span className="status-dot" />Perspectiva adventista do sétimo dia</span><span>Representação didática · não é uma reprodução histórica comprovada</span></div>
      <p className="environment-notice">Paisagem, vegetação, aves, texturas e efeitos de fogo e fumaça são ilustrativos, não uma reconstituição de local, espécies ou ritual específicos. A luz solar não representa a presença divina.</p>
    </section>
    <div className="sr-only" role="status" aria-live="polite">{inTour ? `Etapa ${(state.tourIndex ?? 0) + 1} de ${tourSteps.length}: ${selected?.name}` : selected ? `Explorando ${selected.name}` : "Exploração livre"}</div>
    <noscript><div className="editorial-banner">A exploração interativa requer JavaScript. <a href="/estudo">Leia todo o conteúdo no guia de estudo, sem JavaScript ou 3D.</a></div></noscript>
    <section className="learning-notes" aria-label="Como estudar">
      <article><span className="feature-icon"><Icon name="compass" /></span><div><h2>Explore com propósito</h2><p>Um percurso do pátio ao Santíssimo, respeitando o contexto de cada espaço.</p></div></article>
      <article><span className="feature-icon"><Icon name="book" /></span><div><h2>Comece pelo texto</h2><p>Referências bíblicas e resumos autorais, separados das aplicações teológicas.</p></div></article>
      <article><span className="feature-icon"><Icon name="layers" /></span><div><h2>Veja além das coberturas</h2><p>Abra o modelo em camadas e observe suas proporções e limites de reconstrução.</p></div></article>
    </section>
    <footer className="page-footer">
      <p><strong>Em construção, com responsabilidade.</strong> Conteúdo em rascunho, pendente de revisão teológica humana.</p>
      <Link href="/sobre">Fontes e critérios editoriais <Icon name="arrow" size={15} /></Link>
    </footer>
  </div>;
}
