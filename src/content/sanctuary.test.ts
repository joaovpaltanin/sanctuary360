import { describe, expect, it } from 'vitest';
import {
  confessionalSource,
  editorialNotice,
  elementIds,
  elements,
  getElement,
  tourSteps,
  type ElementId,
} from './sanctuary';

const expectedIds = [
  'gate',
  'altar',
  'basin',
  'table',
  'lampstand',
  'incense',
  'veil',
  'ark',
  'christ',
];

const documentedDimensions: Record<ElementId, number[]> = {
  gate: [20, 5],
  altar: [5, 5, 3],
  basin: [],
  table: [2, 1, 1.5],
  lampstand: [],
  incense: [1, 1, 2],
  veil: [],
  ark: [2.5, 1.5, 1.5],
  christ: [],
};

const zones = ['Pátio', 'Lugar Santo', 'Lugar Santíssimo', 'Síntese'];
const certainties = ['Medidas bíblicas', 'Reconstrução aproximada', 'Síntese teológica'];

describe('conteúdo do Tabernáculo', () => {
  it('preserva os nove identificadores estáveis, únicos e na ordem editorial', () => {
    expect(elementIds).toEqual(expectedIds);
    expect(elements.map(({ id }) => id)).toEqual(expectedIds);
    expect(new Set(elementIds).size).toBe(expectedIds.length);
    expect(new Set(elements.map(({ id }) => id)).size).toBe(expectedIds.length);
    expect(new Set(elements.map(({ number }) => number)).size).toBe(expectedIds.length);
  });

  it('mantém o tour correspondente a todos os elementos, sem repetições', () => {
    expect(tourSteps).toBe(elementIds);
    expect(tourSteps).toEqual(elements.map(({ id }) => id));
    expect(new Set(tourSteps).size).toBe(elements.length);
  });

  it.each(elementIds)('resolve %s sem recorrer a outro elemento', (id) => {
    expect(getElement(id)).toBe(elements.find((element) => element.id === id));
    expect(getElement(id).id).toBe(id);
  });

  it('rejeita um identificador inválido em tempo de execução', () => {
    expect(() => getElement('unknown' as ElementId)).toThrow(
      'Elemento do santuário não encontrado: unknown',
    );
  });

  it.each(elementIds)('mantém os campos editoriais de %s preenchidos e separados', (id) => {
    const element = getElement(id);

    for (const field of [
      element.number,
      element.name,
      element.subtitle,
      element.description,
      element.theology,
      element.reconstruction,
    ]) {
      expect(field.trim().length).toBeGreaterThan(0);
    }

    expect(zones).toContain(element.zone);
    expect(certainties).toContain(element.certainty);
    expect(element.description).not.toBe(element.theology);
    expect(element.description).not.toBe(element.reconstruction);
    expect(element.theology).not.toBe(element.reconstruction);

    if (id !== 'christ') {
      expect(element.materials.length).toBeGreaterThan(0);
    }

    for (const material of element.materials) {
      expect(material.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(elementIds)('oferece referências não vazias e resumos autorais explícitos em %s', (id) => {
    const element = getElement(id);

    expect(element.references.length).toBeGreaterThan(0);
    expect(element.theologyRefs.length).toBeGreaterThan(0);

    for (const reference of element.references) {
      expect(reference.passage.trim().length).toBeGreaterThan(0);
      expect(reference.summary).toMatch(/^Resumo autoral: \S/);
    }

    for (const reference of element.theologyRefs) {
      expect(reference.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(elementIds)('registra somente as dimensões documentadas em côvados de %s', (id) => {
    const { dimensions } = getElement(id);

    expect(dimensions.map(({ cubits }) => cubits)).toEqual(documentedDimensions[id]);
    expect(new Set(dimensions.map(({ label }) => label)).size).toBe(dimensions.length);

    for (const dimension of dimensions) {
      expect(dimension.label.trim().length).toBeGreaterThan(0);
      expect(Number.isFinite(dimension.cubits)).toBe(true);
      expect(dimension.cubits).toBeGreaterThan(0);
    }
  });

  it('não atribui medidas bíblicas à bacia, ao candelabro ou ao véu', () => {
    for (const id of ['basin', 'lampstand', 'veil'] as const) {
      expect(getElement(id).dimensions).toEqual([]);
      expect(getElement(id).certainty).toBe('Reconstrução aproximada');
      expect(getElement(id).reconstruction).toMatch(/aproximad|conjectura|inferida/);
    }
  });

  it('documenta a altura da entrada sem confundi-la com uma medida inventada', () => {
    const gate = getElement('gate');

    expect(gate.dimensions[1]).toEqual({
      label: 'Altura da cortina, como as cortinas do pátio',
      cubits: 5,
    });
    expect(gate.references.some(({ passage }) => passage.includes('38:18'))).toBe(true);
    expect(gate.reconstruction).toContain('27:18');
  });

  it('identifica o rascunho, a revisão pendente e a fonte confessional oficial', () => {
    expect(editorialNotice).toMatch(/rascunho/i);
    expect(editorialNotice).toMatch(/revisão teológica humana/i);
    expect(editorialNotice).toMatch(/resumos autorais/i);
    expect(editorialNotice).toMatch(/restrições de acesso/i);
    expect(confessionalSource.label).toMatch(/adventista.*24/i);
    expect(confessionalSource.url).toBe('https://www.adventist.org/beliefs/');
  });

  it('apresenta Cristo como síntese e 1844 como interpretação adventista', () => {
    const christ = getElement('christ');

    expect(christ.zone).toBe('Síntese');
    expect(christ.certainty).toBe('Síntese teológica');
    expect(christ.materials).toEqual([]);
    expect(christ.dimensions).toEqual([]);
    expect(christ.description).toContain('uma vez por todas');
    expect(christ.theology).toContain('interpretação adventista');
    expect(christ.theology).toContain('1844');
    expect(christ.theology).toContain('juízo investigativo');
    expect(christ.theology).toContain('Hebreus não afirma 1844');
    expect(christ.theologyRefs).toEqual(expect.arrayContaining([
      'Daniel 8:14',
      'Daniel 9:24–27',
      'Levítico 16',
      'Hebreus 9:11–28',
      confessionalSource.label,
    ]));
  });
});
