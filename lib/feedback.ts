/** Validation shared by the feedback API and its tests. No identifying data is logged. */
export const MAX_FEEDBACK_LENGTH=1500;
export const MAX_FEEDBACK_PER_DAY=5;

export type SubmittedFeedback={rating:number|null;suggestion:string};
export function validateFeedback(body:unknown):{ok:true;value:SubmittedFeedback}|{ok:false;error:string}{
 if(!body||typeof body!=='object'||Array.isArray(body))return {ok:false,error:'Envie uma avaliação válida.'};
 const input=body as Record<string,unknown>;
 const rating=input.rating===null||input.rating===undefined?null:input.rating;
 if(rating!==null&&(!Number.isInteger(rating)||typeof rating!=='number'||rating<1||rating>5))return {ok:false,error:'Escolha uma nota de 1 a 5 estrelas.'};
 if(input.suggestion!==undefined&&typeof input.suggestion!=='string')return {ok:false,error:'A sugestão deve ser um texto.'};
 const suggestion=typeof input.suggestion==='string'?input.suggestion.trim():'';
 if(suggestion.length>MAX_FEEDBACK_LENGTH)return {ok:false,error:'O comentário deve ter no máximo 1.500 caracteres.'};
 if(rating===null&&!suggestion)return {ok:false,error:'Selecione uma nota ou escreva uma sugestão.'};
 return {ok:true,value:{rating,suggestion}};
}
