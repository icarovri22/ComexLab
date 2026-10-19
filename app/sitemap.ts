import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{const origin='https://comexhub-app.vercel.app';return ['','/simuladores','/estudos','/ncm','/noticias'].map(path=>({url:origin+path,changeFrequency:'weekly',priority:path?0.7:1}))}
