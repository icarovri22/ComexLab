/** Comex News: parsing and labels deliberately deterministic; no speculative AI summaries. */
export const NEWS_CATEGORIES={geral:'Comércio global',tarifas:'Tarifas e tributos',logistica:'Logística',acordos:'Acordos comerciais',economia:'Economia e câmbio',regulamentacao:'Regulamentação',riscos:'Riscos internacionais'} as const;
export type NewsCategory=keyof typeof NEWS_CATEGORIES;
export type NewsStatus='pending'|'published'|'hidden';
export type NewsArticle={id:string;title:string;summary:string;impact:string;category:NewsCategory;countries:string[];source_name:string;source_url:string;published_at:string|null;featured:boolean;status?:NewsStatus;is_manual?:boolean;created_at?:string;title_pt?:string|null;summary_pt?:string|null;translation_status?:'pending'|'ready';translation_provider?:string|null};
export const COUNTRY_LABELS:Record<string,string>={BR:'Brasil',CN:'China',US:'Estados Unidos',EU:'União Europeia',NL:'Países Baixos',DE:'Alemanha',FR:'França',GB:'Reino Unido',JP:'Japão',IN:'Índia',MX:'México',CA:'Canadá',AR:'Argentina',CL:'Chile',KR:'Coreia do Sul',RU:'Rússia',UA:'Ucrânia',TR:'Turquia',AU:'Austrália',VN:'Vietnã',ID:'Indonésia',PH:'Filipinas',ZA:'África do Sul',SA:'Arábia Saudita',SG:'Singapura',PT:'Portugal',ES:'Espanha',IT:'Itália',BE:'Bélgica',TH:'Tailândia',EG:'Egito',IL:'Israel',IR:'Irã',AE:'Emirados Árabes Unidos',GLOBAL:'Global'};
const countryExpressions:ReadonlyArray<[string,RegExp]>=[
 ['BR',/\b(brazil|brasil|brazilian|brasileir[oa]s?)\b/i],['CN',/\b(china|chinese|chin[êe]s(?:es|a|as)?)\b/i],
 ['US',/\b(united states|u\.?s\.?a\.?|u\.s\.|estados unidos|americano?s?|american)\b/i],
 ['EU',/\b(european union|european commission|eu trade|uni[aã]o europeia|uni[aã]o europ[ée]ia|comiss[aã]o europeia)\b/i],
 ['NL',/\b(netherlands|dutch|holanda|pa[íi]ses baixos)\b/i],['DE',/\b(germany|german|alemanha|alem[aã]o|alem[ãa]es)\b/i],
 ['FR',/\b(france|french|fran[çc]a|frances[ae]s?)\b/i],['GB',/\b(united kingdom|britain|british|reino unido)\b/i],
 ['JP',/\b(japan|japanese|jap[aã]o|japon[êe]s)\b/i],['IN',/\b(india|indian|[íi]ndia|indiano?s?)\b/i],
 ['MX',/\b(mexico|m[ée]xico|mexican)\b/i],['CA',/\b(canada|canad[aá]|canadian)\b/i],
 ['AR',/\b(argentina|argentinian)\b/i],['CL',/\b(chile|chilean|chileno?s?)\b/i],
 ['KR',/\b(south korea|republic of korea|coreia do sul|south korean)\b/i],
 ['RU',/\b(russia|r[úu]ssia|russian)\b/i],['UA',/\b(ukraine|ucr[âa]nia|ukrainian)\b/i],
 ['TR',/\b(turkey|t[üu]rkiye|turquia|turkish)\b/i],['AU',/\b(australia|austr[áa]lia|australian)\b/i],
 ['VN',/\b(vietnam|vietn[aã]|vietnamese)\b/i],['ID',/\b(indonesia|indon[ée]sia|indonesian)\b/i],
 ['PH',/\b(philippines|filipinas|filipino)\b/i],['ZA',/\b(south africa|[áa]frica do sul)\b/i],
 ['SA',/\b(saudi arabia|ar[áa]bia saudita)\b/i],['SG',/\b(singapore|cingapura)\b/i],
 ['PT',/\b(portugal|portuguese|portugu[êe]s)\b/i],['ES',/\b(spain|espanha|spanish)\b/i],
 ['IT',/\b(italy|it[áa]lia|italian)\b/i],['TH',/\b(thailand|tail[âa]ndia)\b/i],
 ['EG',/\b(egypt|egito|egyptian)\b/i],['IL',/\b(israel|israeli)\b/i],
 ['IR',/\b(iran|ir[aã]|iranian)\b/i],['AE',/\b(united arab emirates|emirados [áa]rabes unidos|uae)\b/i]
];
const categoryRules:ReadonlyArray<[NewsCategory,RegExp]>=[
 ['tarifas',/tariff|tarifa|duty|duties|imposto|anti.dump|antidumping|trade remedy|surcharge|sobretaxa/i],
 ['logistica',/shipping|\bports?\b|freight|container|logistic|maritime|navio|\bportos?\b|frete|logístic|canal de suez|red sea/i],
 ['acordos',/agreement|accord|negotiat|free.trade|treaty|acordo|negocia|parceria comercial|fta\b/i],
 ['regulamentacao',/regulation|regulament|compliance|customs|aduan|license|licen[çc]a|sanction|san[çc][ãa]o|drawback|export control/i],
 ['riscos',/disruption|conflict|war\b|crisis|crise|guerra|bloqueio|risco|embargo/i],
 ['economia',/economy|economic|exchange rate|currency|inflation|trade balance|balan[çc]a comercial|exporta[çc][ãa]o|importa[çc][ãa]o|estat[íi]stica|exports|imports|economic growth/i]
];
export const NEWS_IMPACT:Record<NewsCategory,string>={
 tarifas:'Mudanças tarifárias podem alterar o custo de importação, a competitividade e a formação de preços. Verifique a vigência e a classificação fiscal aplicável.',
 logistica:'Mudanças na logística podem afetar fretes, seguros, rotas e prazos de entrega. O efeito concreto depende do modal e da operação.',
 acordos:'Acordos comerciais podem modificar condições de acesso a mercados e preferências tarifárias, conforme sua entrada em vigor e regras de origem.',
 economia:'Indicadores econômicos e cambiais podem influenciar demanda, preços e planejamento de importações e exportações.',
 regulamentacao:'Alterações regulatórias podem exigir novas licenças, documentos ou procedimentos aduaneiros. Confira as normas oficialmente vigentes.',
 riscos:'Riscos internacionais podem gerar incerteza, interrupções de fornecimento ou custos adicionais. O efeito varia conforme país, produto e rota.',
 geral:'Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'
};
export function classifyNews(title:string,description:string,sourceSlug:string){
 const text=(title+' '+description).slice(0,1600);
 const category=sourceSlug==='ebc'||sourceSlug==='ecb'?'economia':categoryRules.find(([,rule])=>rule.test(text))?.[0]||'geral';
 const countries=countryExpressions.filter(([,rule])=>rule.test(text)).map(([code])=>code);
 // Identify the issuing jurisdiction, without pretending that the country is involved in every event.
 if((sourceSlug==='mdic'||sourceSlug==='ebc')&&!countries.includes('BR'))countries.unshift('BR');
 if((sourceSlug==='ec'||sourceSlug==='ecb')&&!countries.includes('EU'))countries.unshift('EU');
 if(!countries.length)countries.push('GLOBAL');
 return {category,countries:countries.slice(0,12),impact:NEWS_IMPACT[category]};
}
/** The MDIC feed also contains domestic industry news and institutional pages. */
export function isRelevantNews(title:string,description:string,sourceSlug:string){
 if(sourceSlug!=='mdic')return true;
 if(description.trim().length<18)return false;
 const text=(title+' '+description).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return /\b(?:comercio exterior|comercio internacional|comercio global|export\w*|import\w*|aduan\w*|siscomex|duimp|mercosul|tarifa\w*|antidumping|balanca comercial|corrente de comercio|barreira comercial|defesa comercial|acordo comercial|acordos comerciais|mercado externo|mercados externos|investimento estrangeiro|logistica internacional|frete internacional|porto de embarque)\b/.test(text);
}
function decodeEntities(input:string){
 return input.replace(/&#x([\da-f]+);/gi,(_,hex:string)=>String.fromCodePoint(Math.min(parseInt(hex,16),0x10ffff)))
 .replace(/&#(\d+);/g,(_,n:string)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
 .replace(/&(?:amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip);/g,(value)=>({
 '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&ndash;':'–','&mdash;':'—','&hellip;':'…'
 } as Record<string,string>)[value]||value);
}
export function plainText(html:string,max=700){
 return decodeEntities(html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/[\u0000-\u001f]+/g,' ')).replace(/\s+/g,' ').trim().slice(0,max);
}
const firstTag=(part:string,tag:string)=>new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i').exec(part)?.[1]||'';
export type FeedItem={title:string;description:string;url:string;publishedAt:string};
export function cleanArticleUrl(input:string,allowedHosts:ReadonlyArray<string>):string|null{
 try{const url=new URL(input.trim());
  if(url.protocol!=='https:'||url.username||url.password||url.port||!allowedHosts.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))return null;
  url.hash='';url.searchParams.delete('utm_source');url.searchParams.delete('utm_medium');url.searchParams.delete('utm_campaign');url.searchParams.delete('fbclid');
  return url.toString().slice(0,1200);
 }catch{return null}
}
export function parseOfficialFeed(xml:string,allowedHosts:ReadonlyArray<string>,now=new Date()):FeedItem[]{
 if(xml.length>900_000)throw Error('Feed muito grande');
 if(!/<(?:rss|feed|rdf:RDF)\b/i.test(xml))throw Error('Formato XML de feed inválido');
 const matches=[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0,60);
 const articles:FeedItem[]=[];
 for(const m of matches){const body=m[1];const title=plainText(firstTag(body,'title'),240);
  const rawLink=plainText(firstTag(body,'link'),1300)||(/<link\b[^>]*href=["']([^"']+)["']/i.exec(body)?.[1]||'');
  const link=decodeEntities(rawLink).replace(/^http:\/\//i,'https://');
  const url=cleanArticleUrl(link,allowedHosts);
  const description=plainText(firstTag(body,'description')||firstTag(body,'summary')||firstTag(body,'content:encoded'),540);
  const dateRaw=plainText(firstTag(body,'pubDate')||firstTag(body,'dc:date')||firstTag(body,'published')||firstTag(body,'updated'),100);
  const published=new Date(dateRaw);
  if(!url||title.length<8||title.length>240||!dateRaw||!Number.isFinite(published.getTime()))continue;
  const age=now.getTime()-published.getTime();
  if(age< -2*86_400_000||age>120*86_400_000)continue;
  articles.push({title,description,url,publishedAt:published.toISOString()});
  if(articles.length>=25)break;
 }
 return articles;
}
export function validateManualNews(input:unknown){
 if(!input||typeof input!=='object')return {error:'Dados da notícia inválidos.'} as const;
 const value=input as Record<string,unknown>;
 const title=typeof value.title==='string'?plainText(value.title,260):'';
 const summary=typeof value.summary==='string'?plainText(value.summary,750):'';
 const impact=typeof value.impact==='string'?plainText(value.impact,1050):'';
 if(title.length<8||title.length>240)return {error:'O título deve ter entre 8 e 240 caracteres.'} as const;
 if(summary.length<18||summary.length>700)return {error:'Escreva um resumo entre 18 e 700 caracteres.'} as const;
 if(impact.length>1000)return {error:'A análise de impacto excede 1.000 caracteres.'} as const;
 const sourceUrl=typeof value.source_url==='string'?value.source_url.trim():'';
 let safeUrl:URL;try{safeUrl=new URL(sourceUrl)}catch{return {error:'Informe um endereço HTTPS válido.'} as const;}
 if(safeUrl.protocol!=='https:'||safeUrl.username||safeUrl.password||safeUrl.port||!safeUrl.hostname.includes('.')||/^(?:localhost|127\.|0\.|10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|\[)/.test(safeUrl.hostname))return {error:'Informe um link público HTTPS de fonte confiável.'} as const;
 const sourceName=typeof value.source_name==='string'?plainText(value.source_name,95):'';
 if(sourceName.length<2||sourceName.length>90)return {error:'Informe o nome da fonte.'} as const;
 const category=value.category;
 if(typeof category!=='string'||!(category in NEWS_CATEGORIES))return {error:'Categoria inválida.'} as const;
 const countries=Array.isArray(value.countries)?Array.from(new Set(value.countries.map(v=>String(v).toUpperCase()))):[];
 if(countries.length>12||countries.some(v=>!(v in COUNTRY_LABELS)))return {error:'Selecione países válidos.'} as const;
 const status=value.status;
 if(status!=='published'&&status!=='pending')return {error:'Situação inválida.'} as const;
 return {value:{title,summary,impact,sourceUrl:safeUrl.toString(),sourceName,category:category as NewsCategory,countries:countries.length?countries:['GLOBAL'],status,featured:value.featured===true}} as const;
}
