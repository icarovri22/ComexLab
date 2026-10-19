import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:['/','/estudos','/simuladores','/ncm','/noticias'],disallow:['/admin','/api/','/seguranca','/login','/recuperar','/redefinir','/ia']}],sitemap:'https://comexhub-app.vercel.app/sitemap.xml'}}
