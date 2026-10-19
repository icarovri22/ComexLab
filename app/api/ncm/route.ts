import {NextRequest, NextResponse} from 'next/server';
import {BRASIL_API_URL, CLASSIF_DATA_URL, buildCatalog, digits, searchCatalog, type Catalog, type NcmRecord} from '../../../lib/ncm';

export const runtime = 'nodejs';
// A fonte oficial tem mais de dez mil códigos. Cache no servidor para não baixá-la a cada tecla.
let memory: { at: number; catalog: Catalog } | null = null;
let backupMemory: { at: number; catalog: Catalog } | null = null;
const hours = 6 * 60 * 60 * 1000;

async function getJson(url: string, revalidate: number): Promise<unknown> {
  const response = await fetch(url, {headers: {'Accept': 'application/json'}, next: {revalidate}, signal: AbortSignal.timeout(12000)});
  if (!response.ok) throw Error(`Falha na fonte (${response.status})`);
  return await response.json();
}

async function getOfficial(): Promise<Catalog> {
  if (memory && Date.now() - memory.at < hours) return memory.catalog;
  const payload = await getJson(CLASSIF_DATA_URL, 6 * 60 * 60);
  const catalog = buildCatalog(payload, 'Classif');
  memory = {at: Date.now(), catalog};
  return catalog;
}

async function getBackupCatalog(): Promise<Catalog> {
  if (backupMemory && Date.now() - backupMemory.at < hours) return backupMemory.catalog;
  const payload = await getJson(BRASIL_API_URL, 6 * 60 * 60);
  const catalog = buildCatalog(payload, 'BrasilAPI');
  backupMemory = {at: Date.now(), catalog};
  return catalog;
}

function headers() { return {'Cache-Control': 'private, no-store', 'Content-Type': 'application/json; charset=utf-8'}; }
function respond(data: unknown, status=200) { return NextResponse.json(data, {status, headers: headers()}); }
function status(catalog: Catalog) { return {source: catalog.source, complete: catalog.complete, updatedAt: catalog.updatedAt, consultedAt: new Date().toISOString()}; }

async function brasilApi(query: string, code: string, chapter: string, offset: number, limit: number) {
  // Fallback com identificação explícita: a BrasilAPI não substitui o download oficial.
  if (code) {
    const raw = await getJson(`${BRASIL_API_URL}/${encodeURIComponent(code)}`, 3600);
    const catalog = buildCatalog(Array.isArray(raw) ? raw : [raw], 'BrasilAPI');
    const found = catalog.rows.find(x => digits(x.code) === code);
    return respond({ok: true, ...status(catalog), results: found ? [found] : [], total: found ? 1 : 0, chapters: []});
  }
  if (!query && !chapter) throw Error('Catálogo por capítulos indisponível na fonte alternativa');
  const search = query || chapter;
  const raw = await getJson(`${BRASIL_API_URL}?search=${encodeURIComponent(search)}`, 3600);
  const catalog = buildCatalog(raw, 'BrasilAPI');
  const found = searchCatalog(catalog, query, chapter || null, offset, limit);
  return respond({ok: true, ...status(catalog), ...found, chapters: []});
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('mode') || 'search';
  const code = digits(params.get('code') || '').slice(0, 8);
  const chapter = digits(params.get('chapter') || '').slice(0, 2);
  const query = (params.get('q') || '').trim().slice(0, 90);
  const offset = Math.min(5000, Math.max(0, Number.parseInt(params.get('offset') || '0', 10) || 0));
  const limit = Math.min(40, Math.max(1, Number.parseInt(params.get('limit') || '24', 10) || 24));
  if (code && code.length !== 8) return respond({ok: false, message: 'Informe um código NCM com oito algarismos.'}, 400);
  if (chapter && chapter.length !== 2) return respond({ok: false, message: 'Capítulo inválido.'}, 400);
  if (!code && mode !== 'chapters' && !chapter && query.length < 2) return respond({ok: false, message: 'Digite ao menos dois caracteres para pesquisar.'}, 400);
  try {
    const catalog = await getOfficial();
    if (mode === 'chapters') return respond({ok: true, ...status(catalog), chapters: catalog.chapters, total: catalog.rows.length});
    if (code) {
      const found: NcmRecord | undefined = catalog.rows.find(x => digits(x.code) === code);
      return respond({ok: true, ...status(catalog), results: found ? [found] : [], total: found ? 1 : 0});
    }
    const found = searchCatalog(catalog, query, chapter || null, offset, limit);
    return respond({ok: true, ...status(catalog), ...found});
  } catch (originalError) {
    console.warn('Classif unavailable; trying BrasilAPI:', originalError instanceof Error ? originalError.message : 'unknown');
    try {
      const backup = await getBackupCatalog();
      if (mode === 'chapters') return respond({ok: true, ...status(backup), chapters: backup.chapters, total: backup.rows.length});
      if (code) {
        const found = backup.rows.find(x => digits(x.code) === code);
        return respond({ok: true, ...status(backup), results: found ? [found] : [], total: found ? 1 : 0});
      }
      return respond({ok: true, ...status(backup), ...searchCatalog(backup, query, chapter || null, offset, limit)});
    } catch (fallbackError) {
      console.warn('BrasilAPI full listing unavailable:', fallbackError instanceof Error ? fallbackError.message : 'unknown');
      try {return await brasilApi(query, code, chapter, offset, limit);} catch (error) {
        console.warn('Both NCM providers unavailable:', error instanceof Error ? error.message : 'unknown');
        return respond({ok: false, message: 'Os serviços de consulta NCM estão temporariamente indisponíveis. Consulte o Classif oficial.'}, 503);
      }
    }
  }
}
