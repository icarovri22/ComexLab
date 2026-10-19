import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {verifiedAccount} from '../../lib/admin-auth';
import AdminConsole from './AdminConsole';

export const dynamic='force-dynamic';
export default async function AdminPage(){
 const cookie=await cookies();
 const account=await verifiedAccount(cookie.get('comexlab_session')?.value);
 if(!account){redirect('/login?next=%2Fadmin');return null;}
 if(account.role!=='admin')return <div className="panel" style={{maxWidth:650,margin:'35px auto'}}><h1>Acesso restrito</h1><p>Esta página é exclusiva dos administradores autorizados do ComexHub.</p><p className="muted">Se você faz parte da equipe responsável, solicite a liberação da sua conta.</p></div>;
 return <AdminConsole username={account.username}/>;
}
