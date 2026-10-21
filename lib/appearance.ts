export const palettes=[
 {id:'original',name:'Original · Terracota',colors:['#A34F37','#DB8265','#F2C8AA']},
 {id:'blue',name:'Azul',colors:['#2563EB','#93C5FD','#DBEAFE']},
 {id:'green',name:'Verde floresta',colors:['#047857','#6EE7B7','#D1FAE5']},
 {id:'violet',name:'Violeta',colors:['#7C3AED','#C4B5FD','#EDE9FE']},
 {id:'petrol',name:'Azul petróleo',colors:['#0E7490','#67E8F9','#CFFAFE']},
] as const;
export type Palette=typeof palettes[number]['id'];
export const validPalette=(value:unknown):value is Palette=>palettes.some(p=>p.id===value);
export const paletteKey=(owner:string)=>`comexhub:appearance:${owner}`;
export function readPalette(storage:Pick<Storage,'getItem'>,owner:string):Palette{
 try{const value=storage.getItem(paletteKey(owner));return validPalette(value)?value:'original'}catch{return 'original'}
}
