'use client';
import {useEffect} from 'react';

/** Recoverable panel-only boundary instead of a blank application screen. */
export default function AdminError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error('ComexHub administration error',error.message)},[error]);
 return <main className="panel" style={{maxWidth:680,margin:'48px auto'}} role="alert">
  <h1>Não foi possível carregar o painel administrativo</h1>
  <p>Ocorreu um problema ao abrir esta seção. Seus dados e avaliações não foram alterados.</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:20}}>
   <button type="button" className="btn" onClick={reset}>Tentar novamente</button>
   <a href="/admin" className="btn secondary">Voltar ao início do painel</a>
  </div>
 </main>;
}
