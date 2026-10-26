export type TourRect={left:number;top:number;right:number;bottom:number;width:number;height:number};
export const TOUR_STEPS=[
 {target:'/',title:'Início',description:'Veja seus atalhos e retome o que você estava fazendo.'},
 {target:'/simuladores',title:'Simuladores',description:'Pratique operações de importação e exportação.'},
 {target:'/ncm',title:'Consulta NCM',description:'Pesquise códigos e descrições de mercadorias.'},
 {target:'/estudos',title:'Trilha de estudos',description:'Aprenda com módulos, exemplos e exercícios.'},
 {target:'/noticias',title:'Comex News',description:'Acompanhe notícias e indicadores do comércio exterior.'},
 {target:'conta',title:'Conta e Ajuda',description:'Acesse sua conta, configurações, segurança e contato.'},
] as const;
export const tourStorageKey=(owner:string)=>`comexhub:welcome-tour:v1:${encodeURIComponent(owner)}`;
/** Keep a popover inside the visible viewport, preferring a side with enough room. */
export function tourPosition(target:TourRect,viewWidth:number,viewHeight:number,popWidth:number,popHeight:number){
 const margin=12,gap=14;
 const clamp=(value:number,min:number,max:number)=>Math.min(Math.max(value,min),Math.max(min,max));
 const maxLeft=Math.max(margin,viewWidth-popWidth-margin),maxTop=Math.max(margin,viewHeight-popHeight-margin);
 let left=clamp(target.right+gap,margin,maxLeft),top=clamp(target.top,margin,maxTop);
 if(target.right+gap+popWidth>viewWidth-margin){
  if(target.left-gap-popWidth>=margin){left=target.left-gap-popWidth;}
  else{
   left=clamp(target.left,margin,maxLeft);
   if(target.bottom+gap+popHeight<=viewHeight-margin)top=target.bottom+gap;
   else if(target.top-gap-popHeight>=margin)top=target.top-gap-popHeight;
   else top=clamp(viewHeight-popHeight-margin,margin,maxTop);
  }
 }
 return {left:clamp(left,margin,maxLeft),top:clamp(top,margin,maxTop)};
}
