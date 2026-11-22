'use client';

import {useEffect,useRef} from 'react';
import Link from 'next/link';
import {ClipboardList} from 'lucide-react';
import './simulation-preparation.css';

const noticeKey='comexhub:simulation-preparation:v1';

export default function SimulationPreparationNotice(){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    try{if(window.sessionStorage.getItem(noticeKey)==='seen')return;}catch{/* Still show the notice if storage is unavailable. */}
    const element=dialog.current;
    if(element&&!element.open&&typeof element.showModal==='function')element.showModal();
  },[]);

  function rememberDismissal(){
    try{window.sessionStorage.setItem(noticeKey,'seen');}catch{/* Closing the notice does not depend on storage. */}
  }

  return <dialog ref={dialog} className="simulation-prep-dialog" aria-labelledby="simulation-prep-title" aria-describedby="simulation-prep-intro" onClose={rememberDismissal}>
    <p className="eyebrow"><ClipboardList size={16} aria-hidden="true"/> ANTES DE SIMULAR</p>
    <h2 id="simulation-prep-title">Separe os dados da operação</h2>
    <p id="simulation-prep-intro">Para montar a simulação, tenha em mãos:</p>
    <ul>
      <li><strong>Mercadoria:</strong> descrição, código NCM ou SH, quantidade e valor unitário.</li>
      <li><strong>Operação:</strong> origem, destino, modal de transporte e Incoterm.</li>
      <li><strong>Custos:</strong> cotação do frete, do seguro se houver e das demais despesas.</li>
      <li><strong>Tributos:</strong> alíquotas aplicáveis, consultadas em fontes oficiais.</li>
    </ul>
    <p>Não sabe o código da mercadoria? Use a <Link href="/ncm" className="reference-link" onClick={()=>{rememberDismissal();dialog.current?.close();}}>Consulta NCM</Link> do ComexHub.</p>
    <p className="help">Para praticar, você pode usar dados fictícios. Se não souber uma alíquota, deixe o campo em branco.</p>
    <form method="dialog"><button type="submit" className="btn">Entendi, continuar</button></form>
  </dialog>;
}
