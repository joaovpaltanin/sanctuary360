"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { confessionalSource, type SanctuaryElement } from "../content/sanctuary";
import { formatDimension, type MeasurementUnit } from "../lib/measurements";
import { Icon } from "./Icon";

const tabs = [
  { id: "overview", label: "Visão geral" },
  { id: "bible", label: "Na Bíblia" },
  { id: "theology", label: "Teologia" },
  { id: "model", label: "Modelo" },
] as const;
type TabId = typeof tabs[number]["id"];

export function InfoPanel({ element, onClose }: { element: SanctuaryElement; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [unit, setUnit] = useState<MeasurementUnit>("cubits");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: window.matchMedia("(min-width: 1051px)").matches });
  }, [element.id]);

  function tabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  }

  return <aside className="info-panel" aria-labelledby="element-heading" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <div className="panel-heading"><span className="eyebrow">ELEMENTO {element.number} · {element.zone}</span><button className="icon-button" onClick={onClose} aria-label="Fechar informações"><Icon name="close" /></button></div>
    <div className="panel-title"><span className="panel-illustration"><Icon name={element.id === "christ" ? "book" : "sanctuary"} size={32} /></span><p className="small-label">{element.subtitle}</p><h2 id="element-heading" tabIndex={-1} ref={heading}>{element.name}</h2></div>
    <div className="panel-tabs" role="tablist" aria-label="Informações do elemento">{tabs.map((item, index) => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="element-tabpanel" tabIndex={tab === item.id ? 0 : -1} onKeyDown={(event) => tabKeys(event, index)} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <div id="element-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="panel-content">
      {tab === "overview" && <>
        <span className="content-label">DESCRIÇÃO BÍBLICA · RESUMO AUTORAL</span><p>{element.description}</p>
        {element.materials.length > 0 && <><h3>Materiais</h3><div className="material-list">{element.materials.map((material) => <span key={material}>{material}</span>)}</div></>}
        {element.dimensions.length > 0 ? <><div className="dimensions-heading"><h3>Dimensões</h3><label><span className="sr-only">Unidade das dimensões</span><select value={unit} onChange={(event) => setUnit(event.target.value as MeasurementUnit)}><option value="cubits">Côvados</option><option value="meters">Metros</option><option value="feet">Pés</option></select></label></div><dl className="dimensions">{element.dimensions.map((dimension) => <div key={dimension.label}><dt>{dimension.label}</dt><dd>{formatDimension(dimension.cubits, unit)}</dd></div>)}</dl><p className="fine-print">Conversão aproximada: 1 côvado = 0,4572 m, convenção didática. O comprimento histórico do côvado varia.</p></> : <div className="note-box"><Icon name="info" /><p>{element.id === "christ" ? "Esta síntese não representa um objeto ou compartimento adicional." : "As passagens citadas não informam medidas próprias deste elemento. Sua escala no modelo é aproximada."}</p></div>}
        <p className="source-inline">Base: {element.references[0].passage}</p>
      </>}
      {tab === "bible" && <><span className="content-label">REFERÊNCIAS E CONTEXTO</span><p className="fine-print">Os textos abaixo são resumos autorais, não transcrições de uma tradução bíblica. Consulte as passagens em sua Bíblia.</p>{element.references.map((reference) => <section className="reference-card" key={reference.passage}><h3><Icon name="book" size={17} />{reference.passage}</h3><p>{reference.summary}</p></section>)}</>}
      {tab === "theology" && <><span className="content-label">PERSPECTIVA ADVENTISTA DO SÉTIMO DIA</span><p>{element.theology}</p><h3>Fundamentação</h3><ul className="reference-list">{element.theologyRefs.map((reference) => <li key={reference}>{reference}</li>)}</ul><a className="source-link" href={confessionalSource.url} target="_blank" rel="noreferrer">Crença Fundamental 24 <Icon name="arrow" size={16} /><span className="sr-only"> (abre em nova aba)</span></a></>}
      {tab === "model" && <><span className="content-label">{element.certainty.toUpperCase()}</span><p>{element.reconstruction}</p><div className="note-box"><Icon name="info" /><p>1 unidade da cena corresponde a 1 côvado. Pátio: 100 × 50 côvados (Êxodo 27:9–18). A tenda de 30 × 10 × 10 é uma reconstrução convencional a partir de Êxodo 26. Posição exata, espessuras, cores e detalhes são esquemáticos.</p></div><p className="fine-print">Ocultar coberturas e paredes é um recurso didático. Não elimina as restrições históricas de acesso ao santuário.</p></>}
    </div>
    <div className="draft-note"><span className="status-dot" /> Rascunho · revisão teológica pendente</div>
  </aside>;
}
