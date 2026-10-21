/** Original globe geometry; CSS follows the selected personal palette. */
export default function BrandLogo({className=''}:{className?:string}) {
  return <span className={`brand-logo ${className}`.trim()}>
    <span className="brand-logo-globe" aria-hidden="true" />
    <span className="brand-logo-copy">
      <strong className="brand-logo-name">Comex<span>Hub</span></strong>
      <small className="brand-logo-subtitle">Seu hub de aprendizados em comércio exterior</small>
    </span>
  </span>;
}
