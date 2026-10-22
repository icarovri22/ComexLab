import {NextRequest,NextResponse} from 'next/server';
import {ACCOUNT_COOKIE_PREFIX,validAccountSlot,selectedSession} from './lib/account-session';
import {jwtVerify} from 'jose';
import {isPublicAuthPage} from './lib/auth-pages';
import {isNewsCronRequest} from './lib/news-cron';
export async function middleware(req:NextRequest){
 if(process.env.AUTH_REQUIRED!=='true')return NextResponse.next();
 const path=req.nextUrl.pathname;
 // Public brand artwork must remain visible on sign-in and recovery pages.
 if(/^\/comexhub-globe(?:-(?:blue|green|violet|petrol))?\.svg$/.test(path))return NextResponse.next();
 if(isNewsCronRequest(req.method,path))return NextResponse.next();
 if(isPublicAuthPage(path)||path.startsWith('/api/email-recovery')||path.startsWith('/api/auth')||path.startsWith('/api/recovery'))return NextResponse.next();
 // Pages contain the public shell; account data is authorized by the selected API session.
 // Top-level navigation has no tab header, so accept an existing signed account cookie here.
 const tokens=path.startsWith('/api/')?[selectedSession(req)]:[
  req.cookies.get('comexlab_session')?.value,
  ...req.cookies.getAll().filter(c=>c.name.startsWith(ACCOUNT_COOKIE_PREFIX)&&validAccountSlot(c.name.slice(ACCOUNT_COOKIE_PREFIX.length))).map(c=>c.value)
 ];
 if(process.env.AUTH_SECRET){
  for(const token of tokens){if(!token)continue;
   try{const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.AUTH_SECRET),{algorithms:['HS256']});
    if(!payload.purpose&&typeof payload.sub==='string'&&/^\d+$/.test(payload.sub))return NextResponse.next();
   }catch{}
  }
 }
 if(path.startsWith('/api/'))return NextResponse.json({error:'Autenticação necessária.'},{status:401});
 const destination=new URL('/login',req.url);
 destination.searchParams.set('next',path+req.nextUrl.search);
 return NextResponse.redirect(destination);
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
