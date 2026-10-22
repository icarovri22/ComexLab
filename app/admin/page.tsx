'use client';
import {useEffect,useState} from 'react';
import {accountFetch} from '../../lib/account-fetch';
import AdminConsole from './AdminConsole';
export default function AdminPage(){
 const [account,setAccount]=useState<{username?:string;isAdmin?:boolean;loggedIn?:boolean}|null>(null);
 useEffect(()=>{let active=true;accountFetch('/api/auth',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(user=>{if(active){if(!user.loggedIn)window.location.replace('/login?next=%2Fadmin');else setAccount(user)}}).catch(()=>{if(active)setAccount({isAdmin:false})});return()=>{active=false}},[]);
 if(!account)return <p role="status">Verificando acesso...</p>;
 if(!account.isAdmin)return <div className="panel" style={{maxWidth:650,margin:'35px auto'}}><h1>Acesso restrito</h1><p>Esta página é exclusiva dos administradores autorizados do ComexHub.</p></div>;
 return <AdminConsole username={account.username||''}/>;
}
