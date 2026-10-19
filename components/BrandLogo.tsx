import Image from 'next/image';

/** ComexHub brand: approved minimalist globe and original project typography. */
export default function BrandLogo({className=''}:{className?:string}) {
  return <span className={`brand-logo ${className}`.trim()}>
    <Image className="brand-logo-globe" src="/comexhub-globe.svg" alt="" aria-hidden="true" width={52} height={52} priority />
    <span className="brand-logo-copy">
      <strong className="brand-logo-name">Comex<span>Hub</span></strong>
      <small className="brand-logo-subtitle">Seu hub de aprendizados em comércio exterior</small>
    </span>
  </span>;
}
