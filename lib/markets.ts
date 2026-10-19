/** Organização de mercados para a interface. Base de códigos/continentes fornecida pela countries-list. */
export type ContinentCode = 'AF'|'NA'|'SA'|'AN'|'AS'|'EU'|'OC'|'OTHER';
export type Country = {code:string; name:string; continent:string};
export const CONTINENTS:ReadonlyArray<{code:ContinentCode;name:string}> = [
  {code:'AF',name:'África'},
  {code:'NA',name:'América do Norte, Central e Caribe'},
  {code:'SA',name:'América do Sul'},
  {code:'AN',name:'Antártida'},
  {code:'AS',name:'Ásia'},
  {code:'EU',name:'Europa'},
  {code:'OC',name:'Oceania'},
  {code:'OTHER',name:'Outros territórios'},
];
export const normalizeContinent=(code:string):ContinentCode => CONTINENTS.some(x=>x.code===code)?code as ContinentCode:'OTHER';
const fold=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function groupCountries(all:ReadonlyArray<Country>,continent='ALL',term=''){
  const search=fold(term.trim());
  const filtered=all.filter(c=>(continent==='ALL'||c.continent===continent)&&(!search||fold(c.name+' '+c.code).includes(search)));
  return CONTINENTS.map(group=>({code:group.code,name:group.name,countries:filtered.filter(x=>normalizeContinent(x.continent)===group.code).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))})).filter(group=>group.countries.length>0);
}
/** Busca simples por nome em português ou sigla, ignorando acentos. */
export function findCountries(all:ReadonlyArray<Country>,term:string,limit=8):Country[]{
  const search=fold(term.trim());
  return all.filter(country=>!search||fold(`${country.name} ${country.code}`).includes(search)).slice(0,Math.max(0,limit));
}

/** Emoji de bandeira com base no código ISO alfa-2 do país/território. */
export function flagForCountryCode(code:string):string{
  const upper=code.toUpperCase();
  if(!/^[A-Z]{2}$/.test(upper))return '🌐';
  return String.fromCodePoint(...Array.from(upper,ch=>0x1F1E6+ch.charCodeAt(0)-65));
}

export const taxRegimeFor=(destinationCode:string)=>destinationCode==='BR'?'brasil':'internacional';
export const isCrossBorder=(origin:string,destination:string)=>Boolean(origin&&destination&&origin!==destination);
export const EU_MARKETS=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' '));
export const isIntraEU=(originCode:string,destinationCode:string)=>originCode!==destinationCode&&EU_MARKETS.has(originCode)&&EU_MARKETS.has(destinationCode);
export type TariffReference = {name:string;url:string};
/** Links para consulta, não alíquotas automáticas. País de origem influencia as preferências comerciais. */
export function tariffReferences(originCode:string,destinationCode:string):TariffReference[]{
  const wto={name:'OMC — perfis e bases tarifárias internacionais',url:'https://ttd.wto.org/en'};
  if(destinationCode==='BR')return [
    {name:'Receita Federal — simulador de tratamento tributário',url:'https://www4.receita.fazenda.gov.br/simulador/'},
    {name:'Portal Único — Classif (NCM)',url:'https://portalunico.siscomex.gov.br/classif/'},wto
  ];
  if(EU_MARKETS.has(destinationCode))return [
    {name:'Comissão Europeia — Access2Markets (origem e destino)',url:'https://trade.ec.europa.eu/access-to-markets/en/my-trade-assistant'},wto
  ];
  if(destinationCode==='US')return [{name:'USITC — tarifa de importação dos Estados Unidos',url:'https://hts.usitc.gov/'},wto];
  if(destinationCode==='GB')return [{name:'Reino Unido — UK Trade Tariff',url:'https://www.trade-tariff.service.gov.uk/'},wto];
  if(destinationCode==='CA')return [{name:'Canadá — CBSA (tabela tarifária)',url:'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html'},wto];
  if(originCode==='BR')return [wto,{name:'Siscomex — informações sobre a exportação brasileira',url:'https://www.gov.br/siscomex/pt-br'}];
  return [wto];
}
