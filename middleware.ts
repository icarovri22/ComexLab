import {NextRequest,NextResponse} from 'next/server';
import {jwtVerify} from 'jose';
export async function middleware(req:NextRequest){
 if(process.env.AUTH_REQUIRED!=='true')return NextResponse.next();
 const path=req.nextUrl.pathname;
 if(path==='/login'||path==='/recuperar'||path==='/redefinir'||path.startsWith('/api/email-recovery')||path.startsWith('/api/auth')||path.startsWith('/api/recovery'))return NextResponse.next();
 const jwt=req.cookies.get('comexlab_session')?.value;
 if(jwt&&process.env.AUTH_SECRET){
  try{await jwtVerify(jwt,new TextEncoder().encode(process.env.AUTH_SECRET),{algorithms:['HS256']});return NextResponse.next()}catch{}
 }
 if(path.startsWith('/api/'))return NextResponse.json({error:'Autenticação necessária.'},{status:401});
 const destination=new URL('/login',req.url);
 destination.searchParams.set('next',path+req.nextUrl.search);
 return NextResponse.redirect(destination);
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
