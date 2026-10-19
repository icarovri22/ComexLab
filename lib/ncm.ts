/**
 * Consulta NCM: dados oficiais do Classif, com fallback identificável à BrasilAPI.
 * A busca não define classificação fiscal nem apura tributos automaticamente.
 */
export const CLASSIF_DATA_URL = 'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json';
export const CLASSIF_URL = 'https://portalunico.siscomex.gov.br/classif/';
export const BRASIL_API_URL = 'https://brasilapi.com.br/api/ncm/v1';
export const BUSCADOR_URL = 'https://buscadorncm.com.br';

export interface NcmRecord {
  code: string;
  description: string;
  chapter: string;
  chapterDescription: string;
  heading: string;
  headingDescription: string;
  subheading: string;
  subheadingDescription: string;
  startDate: string | null;
  endDate: string | null;
  legalAct: string | null;
  source: 'Classif' | 'BrasilAPI';
}

interface RawRecord {
  code: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  legalAct: string | null;
}

export interface Catalog {
  rows: NcmRecord[];
  chapters: { code: string; description: string; count: number }[];
  source: 'Classif' | 'BrasilAPI';
  updatedAt: string | null;
  complete: boolean;
}

const extract = (object: Record<string, unknown>, ...names: string[]): unknown => {
  for (const name of names) {
    if (object[name] !== undefined && object[name] !== null) return object[name];
  }
  return undefined;
};
const str = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
const optional = (value: unknown): string | null => str(value) || null;
export const digits = (value: string): string => value.replace(/\D/g, '');
export const formatNcm = (value: string): string => {
  const code = digits(value);
  return code.length === 8 ? `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6)}` : code;
};

// O catálogo educacional não oferece pesquisa ou fichas de itens estritamente
// controlados (armamentos, nicotina, bebidas alcoólicas e explosivos).
export function isRestrictedForStudy(code: string): boolean {
  return code.startsWith('93') || code.startsWith('24') ||
    (/^220[3-8]/.test(code)) || /^360[1-4]/.test(code);
}

export const plain = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function normalizeRaw(row: unknown): RawRecord | null {
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;
  const code = digits(str(extract(value, 'Codigo', 'codigo', 'codigoNcm', 'ncm')));
  const description = str(extract(value, 'Descricao', 'descricao', 'descricaoNcm'));
  if (code.length < 2 || code.length > 8 || !description) return null;
  const type = str(extract(value, 'TipoOrgaoAtoIni', 'tipoOrgaoAtoIni', 'tipo_ato', 'tipoAto'));
  const number = str(extract(value, 'NumeroAtoIni', 'numeroAtoIni', 'numero_ato'));
  const year = str(extract(value, 'AnoAtoIni', 'anoAtoIni', 'ano_ato'));
  const legalAct = [type, number, year].filter(Boolean).join(' · ');
  return {
    code,
    description: description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    startDate: optional(extract(value, 'DataInicio', 'dataInicio', 'data_inicio')),
    endDate: optional(extract(value, 'DataFim', 'dataFim', 'data_fim')),
    legalAct: legalAct || null,
  };
}

function findRows(payload: unknown): { rows: unknown[]; updatedAt: string | null } {
  if (Array.isArray(payload)) return { rows: payload, updatedAt: null };
  if (!payload || typeof payload !== 'object') throw Error('Resposta da tabela NCM não reconhecida');
  const object = payload as Record<string, unknown>;
  const candidates = ['Nomenclaturas', 'nomenclaturas', 'data', 'items', 'registros', 'NCMs'];
  for (const name of candidates) {
    if (Array.isArray(object[name])) {
      return { rows: object[name] as unknown[], updatedAt: optional(extract(object, 'DataUltimaAlteracao', 'dataUltimaAlteracao')) };
    }
  }
  throw Error('O formato da base NCM mudou');
}

export function buildCatalog(payload: unknown, source: 'Classif' | 'BrasilAPI'): Catalog {
  const parsed = findRows(payload);
  const raw = parsed.rows.map(normalizeRaw).filter((x): x is RawRecord => x !== null);
  if (raw.length === 0) throw Error('Fonte NCM sem registros reconhecíveis');
  const lookup = new Map<string, RawRecord>();
  // Termos de contexto para buscas em fontes alternativas sem níveis hierárquicos.
  // A descrição do item não é alterada nem substituída por estes termos.
  const helperHeading: Record<string, string> = {
    '6109': 'Camisetas de malha e artigos semelhantes',
    '0901': 'Café, mesmo torrado ou descafeinado',
    '0804': 'Tâmaras, figos, abacaxis, abacates, goiabas, mangas',
    '8471': 'Computadores e máquinas automáticas para processamento de dados',
    '8517': 'Aparelhos de telefonia e comunicação',
  };
  raw.forEach(entry => lookup.set(entry.code, entry));
  const rows = raw.filter(entry => entry.code.length === 8 && !isRestrictedForStudy(entry.code)).map(entry => {
    const chapter = entry.code.slice(0, 2);
    const heading = entry.code.slice(0, 4);
    const subheading = entry.code.slice(0, 6);
    // As subposições do Classif podem ter níveis de 5 ou 6 algarismos.
    const sub = lookup.get(subheading) || lookup.get(entry.code.slice(0, 5));
    return {
      code: formatNcm(entry.code),
      description: entry.description,
      chapter,
      chapterDescription: lookup.get(chapter)?.description || '',
      heading: `${heading.slice(0, 2)}.${heading.slice(2)}`,
      headingDescription: lookup.get(heading)?.description || (source === 'BrasilAPI' ? helperHeading[heading] || '' : ''),
      subheading,
      subheadingDescription: sub?.description || '',
      startDate: entry.startDate,
      endDate: entry.endDate,
      legalAct: entry.legalAct,
      source,
    };
  });
  if (source === 'Classif' && rows.length < 5000) throw Error('Tabela Classif incompleta; atualização não aplicada');
  const counts = new Map<string, number>();
  rows.forEach(entry => counts.set(entry.chapter, (counts.get(entry.chapter) || 0) + 1));
  const chapters = Array.from(counts.entries()).map(([code, count]) => ({
    code,
    description: lookup.get(code)?.description || `Capítulo ${code}`,
    count,
  })).sort((a, b) => a.code.localeCompare(b.code));
  return { rows, chapters, source, updatedAt: parsed.updatedAt, complete: source === 'Classif' };
}

export function searchCatalog(catalog: Catalog, query: string, chapter: string | null, offset = 0, limit = 30) {
  const trimmed = query.trim();
  const numeric = /^\d[\d.\s-]*$/.test(trimmed);
  const q = numeric ? digits(trimmed) : plain(trimmed);
  const tokens = q.split(' ').filter(x => x.length > 1);
  const matched = catalog.rows.filter(entry => {
    if (chapter && entry.chapter !== chapter) return false;
    if (!trimmed) return !!chapter;
    const code = digits(entry.code);
    if (numeric) return code.startsWith(q);
    const haystack = plain([entry.description, entry.headingDescription, entry.subheadingDescription, entry.chapterDescription].join(' '));
    return tokens.length > 0 && tokens.every(token => haystack.includes(token));
  });
  if (trimmed) {
    matched.sort((a, b) => {
      const codeA = digits(a.code), codeB = digits(b.code);
      const pa = plain(a.description).includes(q) ? 0 : 1;
      const pb = plain(b.description).includes(q) ? 0 : 1;
      return pa - pb || codeA.localeCompare(codeB);
    });
    // Codes and exact description matches before non-exact suggestions.
    if (numeric) matched.sort((a, b) => Number(digits(b.code) === q) - Number(digits(a.code) === q) || a.code.localeCompare(b.code));
  }
  return { results: matched.slice(offset, offset + limit), total: matched.length };
}

export function statusFromDates(row: NcmRecord): string {
  const now = new Date().toISOString().slice(0, 10);
  if (row.startDate && row.startDate.slice(0, 10) > now) return 'Vigência futura';
  if (row.endDate && row.endDate.slice(0, 10) < now && !row.endDate.startsWith('9999')) return 'Vigência encerrada';
  return 'Consulte a vigência oficial';
}
