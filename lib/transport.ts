export const TRANSPORT_MODES=['Marítimo','Aéreo','Rodoviário','Ferroviário','Fluvial','Dutoviário'] as const;
export const COMMERCIAL_UNITS=[{code:'un',label:'Unidade',symbol:'un.'},{code:'kg',label:'Quilograma',symbol:'kg'},{code:'g',label:'Grama',symbol:'g'},{code:'t',label:'Tonelada',symbol:'t'},{code:'l',label:'Litro',symbol:'L'},{code:'m',label:'Metro',symbol:'m'},{code:'m2',label:'Metro quadrado',symbol:'m²'},{code:'m3',label:'Metro cúbico',symbol:'m³'},{code:'pair',label:'Par',symbol:'par'},{code:'dozen',label:'Dúzia',symbol:'dz.'},{code:'thousand',label:'Milheiro',symbol:'mil'},{code:'carat',label:'Quilate',symbol:'ct'},{code:'box',label:'Caixa',symbol:'cx.'},{code:'bag',label:'Saco',symbol:'saco'},{code:'roll',label:'Rolo',symbol:'rolo'},{code:'other',label:'Outra',symbol:'outra'}] as const;
export const restoreModes=(value:unknown):string[]=>Array.isArray(value)?Array.from(new Set(value.filter((x):x is string=>typeof x==='string'&&TRANSPORT_MODES.some(mode=>mode===x)))):[];
export const hasWaterLeg=(modal:string,modes:readonly string[])=>modal==='Marítimo'||modal==='Fluvial'||modal==='Multimodal'&&modes.some(m=>m==='Marítimo'||m==='Fluvial');
export const transportLabel=(modal:string,modes:readonly string[])=>modal==='Multimodal'?`Combinação: ${modes.join(' + ')||'a definir'}`:modal;
export const commercialUnitLabel=(code:string,other:string)=>code==='other'?(other.trim()||'Unidade a informar'):(COMMERCIAL_UNITS.find(u=>u.code===code)?.label||'Unidade');
export function connectPort(modal:string,modes:readonly string[],endpointCountry:string,portCountry:string){
 if(endpointCountry===portCountry)return {modal,modes:[...modes]};
 const next=restoreModes(modal==='Multimodal'?modes:[modal]);
 if(!next.some(m=>m==='Marítimo'||m==='Fluvial'))next.push('Marítimo');
 if(!next.includes('Rodoviário'))next.push('Rodoviário');
 return {modal:'Multimodal',modes:next};
}
export function portConnectionNeeded(origin:string,destination:string,loadingCountry?:string,dischargeCountry?:string){return Boolean(loadingCountry&&loadingCountry!==origin||dischargeCountry&&dischargeCountry!==destination)}
