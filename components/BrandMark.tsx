import Image from 'next/image';
/** ComexHub globe icon with original brand colors. */
export default function BrandMark({size=34,className=''}:{size?:number;className?:string}){
  return <Image className={className} src="/comexhub-globe.svg" width={size} height={size} alt="" aria-hidden="true" style={{objectFit:'contain'}}/>;
}
