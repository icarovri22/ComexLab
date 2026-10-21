import Link from 'next/link';
import {Wrench} from 'lucide-react';

export default function AiMaintenancePage(){
 return <section className="panel" style={{maxWidth:720,margin:'42px auto',padding:30,textAlign:'center'}}>
  <Wrench size={34} color="var(--primary)" aria-hidden="true"/>
  <h1 style={{marginTop:16}}>ComexHub IA em manutenção</h1>
  <p className="muted" style={{lineHeight:1.7,marginTop:12}}>O assistente está temporariamente indisponível enquanto corrigimos a integração. Nenhuma pergunta será enviada ou contabilizada durante este período.</p>
  <p className="muted">Os simuladores, a consulta NCM e a trilha de estudos continuam disponíveis normalmente.</p>
  <div style={{marginTop:22,display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
   <Link className="btn" href="/">Voltar à página inicial</Link>
   <Link className="btn secondary" href="/simuladores">Abrir simuladores</Link>
  </div>
 </section>;
}
