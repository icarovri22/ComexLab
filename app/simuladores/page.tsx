'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {countries} from 'countries-list';
import {Ship,Truck,Plane,Info,ExternalLink,ShieldAlert,BookOpen,ArrowLeftRight,CheckCheck,RefreshCcw,Globe2,FileText,Search,X} from 'lucide-react';
import {INCOTERMS,allocate,getIncoterm,isCompatible} from '../../lib/incoterms';
import {calculateBrazilImport,calculateDestinationTax,formatBrl,formatUsd,numberFrom,hasRate} from '../../lib/calc';
import SimulationReportView from './SimulationReportView';
import SimulationHistory from './SimulationHistory';
import {chooseSimulationDraft,readStoredJson,mergeSimulationHistory} from '../../lib/simulation-storage';
import {createSimulationReport,type SimulationReport,type ReportSection} from '../../lib/simulation-report';
import {findCountries,flagForCountryCode,isCrossBorder,isIntraEU,normalizeContinent,tariffReferences,taxRegimeFor,type Country} from '../../lib/markets';

type Operation='import'|'export';
const regionNames=new Intl.DisplayNames(['pt-BR'],{type:'region'});
const MARKETS:Country[]=Object.entries(countries).map(([code,c])=>({
  code,
  name:regionNames.of(code)||c.name,
  continent:normalizeContinent(c.continent)
})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
const MARKET_BY_CODE=new Map(MARKETS.map(country=>[country.code,country]));

function CountryPicker({id,label,value,onChange}:{id:string;label:string;value:string;onChange:(next:string)=>void}){
  const selected=MARKET_BY_CODE.get(value);
  const [query,setQuery]=useState(selected?.name??'');
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);
  const options=useMemo(()=>findCountries(MARKETS,query,8),[query]);

  // Sincroniza a exibição quando a rota é invertida ou um exemplo é escolhido.
  useEffect(()=>{setQuery(selected?.name??'');setActive(0);},[value,selected?.name]);

  function choose(code:string){
    const country=MARKET_BY_CODE.get(code);
    if(!country)return;
    onChange(country.code);
    setQuery(country.name);
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(event:React.KeyboardEvent<HTMLInputElement>){
    if(event.key==='ArrowDown'){
      event.preventDefault();
      setOpen(true);
      setActive(index=>Math.min(index+1,Math.max(options.length-1,0)));
    }else if(event.key==='ArrowUp'){
      event.preventDefault();
      setOpen(true);
      setActive(index=>Math.max(index-1,0));
    }else if(event.key==='Enter'&&open&&options.length){
      event.preventDefault();
      choose(options[Math.min(active,options.length-1)].code);
      inputRef.current?.blur();
    }else if(event.key==='Escape'){
      setOpen(false);
      setQuery(selected?.name??'');
      inputRef.current?.blur();
    }
  }

  return <div className="market-picker market-picker-simple">
    <label htmlFor={`${id}-country`} className="label">{label}</label>
    <div className="market-country-combobox">
      <span className="market-country-flag" aria-hidden="true">{flagForCountryCode(value)}</span>
      <input
        ref={inputRef}
        id={`${id}-country`}
        role="combobox"
        type="search"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open&&options.length?`${id}-option-${options[Math.min(active,options.length-1)].code}`:undefined}
        aria-describedby={`${id}-help`}
        className="market-country-input"
        placeholder="Pesquisar país ou sigla"
        value={query}
        onFocus={event=>{setOpen(true);setActive(0);event.currentTarget.select();}}
        onChange={event=>{setQuery(event.target.value);setOpen(true);setActive(0);}}
        onBlur={()=>{setOpen(false);setQuery(selected?.name??'');}}
        onKeyDown={onKeyDown}
      />
      <button type="button" className="market-country-search-button" aria-label="Pesquisar outro país" onMouseDown={event=>event.preventDefault()} onClick={()=>{setQuery('');setOpen(true);setActive(0);inputRef.current?.focus();}}>
        {open&&query?<X size={16}/>:<Search size={17}/>}
      </button>
    </div>
    {open&&<div id={`${id}-options`} role="listbox" aria-label={`Sugestões de ${label.toLowerCase()}`} className="market-country-options">
      {options.map((country,index)=><button
        key={country.code}
        id={`${id}-option-${country.code}`}
        role="option"
        aria-selected={index===active}
        type="button"
        className={`market-country-option ${index===active?'highlighted':''}`}
        onMouseDown={event=>event.preventDefault()}
        onClick={()=>choose(country.code)}
      ><span aria-hidden="true">{flagForCountryCode(country.code)}</span><span>{country.name}</span><small>{country.code}</small></button>)}
      {!options.length&&<p className="market-country-no-results" role="status">Nenhum país encontrado. Confira o nome ou a sigla.</p>}
    </div>}
    <p className="market-caption" id={`${id}-help`}>Digite o nome ou a sigla e selecione uma sugestão.</p>
  </div>;
}

type NumericKind='currency'|'percent'|'quantity'|'exchange';
function Num({name,value,set,desc,kind='currency'}:{name:string;value:string;set:(x:string)=>void;desc?:string;kind?:NumericKind}){
  const unit=kind==='currency'?'US$':kind==='percent'?'%':kind==='quantity'?'un.':'R$/US$';
  const unitDescription=kind==='currency'?'valor em dólares americanos':kind==='percent'?'alíquota em porcentagem':kind==='quantity'?'quantidade de unidades':'cotação em reais por dólar';
  return <label className="field">
    <span className="label">{name}</span>
    <span className={`sim-number-field ${kind==='currency'?'prefix':'suffix'} kind-${kind}`}>
      <span className="sim-number-unit" aria-hidden="true">{unit}</span>
      <input className="input sim-number-input" inputMode={kind==='quantity'?'numeric':'decimal'} aria-label={`${name} — ${unitDescription}`} value={value} onChange={e=>set(e.target.value)}/>
    </span>
    {desc&&<small className="help">{desc}</small>}
  </label>;
}

export default function Simuladores(){
  const [op,setOp]=useState<Operation>('import');
  const [originCode,setOriginCode]=useState('CN');
  const [destinationCode,setDestinationCode]=useState('BR');
  const [product,setProduct]=useState('Camisetas de malha');
  const [ncm,setNcm]=useState('6109.90.00');
  const [modal,setModal]=useState('Marítimo');
  const [term,setTerm]=useState('FCA');
  const [qty,setQty]=useState('500');
  const [unit,setUnit]=useState('12');
  const [fx,setFx]=useState('5,30');
  const [origin,setOrigin]=useState('150');
  const [loading,setLoading]=useState('100');
  const [freight,setFreight]=useState('900');
  const [insurance,setInsurance]=useState('80');
  const [lastMile,setLastMile]=useState('160');
  const [unloading,setUnloading]=useState('45');
  const [fees,setFees]=useState('90');
  const [destDuty,setDestDuty]=useState('');
  const [vat,setVat]=useState('');
  const [ii,setIi]=useState('');
  const [ipi,setIpi]=useState('');
  const [pis,setPis]=useState('');
  const [cofins,setCofins]=useState('');
  const [icms,setIcms]=useState('');
  const [checked,setChecked]=useState<string[]>([]);
  const [report,setReport]=useState<{data:SimulationReport;signature:string}|null>(null);
  const [step,setStep]=useState(0);
  const wasWizardInitialized=useRef(false);
  const [storageOwner,setStorageOwner]=useState<string|null>(null);
  const [storageReady,setStorageReady]=useState(false);
  const [history,setHistory]=useState<SimulationReport[]>([]);
  const [storageNotice,setStorageNotice]=useState('');
  useEffect(()=>{
    let active=true;
    fetch('/api/auth',{cache:'no-store'}).then(r=>r.json()).then(async user=>{
      if(!active)return;
      const username=user?.loggedIn&&typeof user.username==='string'?user.username:null;
      if(!username){setStorageOwner(null);setStorageReady(true);return;}
      setStorageOwner(username);
      try{
        const remote=await fetch('/api/simulations',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
        if(!active)return;
        const saved=chooseSimulationDraft(readStoredJson(`comexhub:sim:draft:${username}`),remote?.draft);
        if(saved&&typeof saved==='object'){
          if(saved.op==='import'||saved.op==='export')setOp(saved.op);
          if(typeof saved.originCode==='string')setOriginCode(saved.originCode);
          if(typeof saved.destinationCode==='string')setDestinationCode(saved.destinationCode);
          if(typeof saved.product==='string')setProduct(saved.product);
          if(typeof saved.ncm==='string')setNcm(saved.ncm);
          if(typeof saved.modal==='string')setModal(saved.modal);
          if(typeof saved.term==='string')setTerm(saved.term);
          if(typeof saved.qty==='string')setQty(saved.qty);
          if(typeof saved.unit==='string')setUnit(saved.unit);
          if(typeof saved.fx==='string')setFx(saved.fx);
          if(typeof saved.origin==='string')setOrigin(saved.origin);
          if(typeof saved.loading==='string')setLoading(saved.loading);
          if(typeof saved.freight==='string')setFreight(saved.freight);
          if(typeof saved.insurance==='string')setInsurance(saved.insurance);
          if(typeof saved.lastMile==='string')setLastMile(saved.lastMile);
          if(typeof saved.unloading==='string')setUnloading(saved.unloading);
          if(typeof saved.fees==='string')setFees(saved.fees);
          if(typeof saved.destDuty==='string')setDestDuty(saved.destDuty);
          if(typeof saved.vat==='string')setVat(saved.vat);
          if(typeof saved.ii==='string')setIi(saved.ii);
          if(typeof saved.ipi==='string')setIpi(saved.ipi);
          if(typeof saved.pis==='string')setPis(saved.pis);
          if(typeof saved.cofins==='string')setCofins(saved.cofins);
          if(typeof saved.icms==='string')setIcms(saved.icms);
          if(Array.isArray(saved.checked))setChecked(saved.checked.filter((value):value is string=>typeof value==='string'));
          if(typeof saved.step==='number'&&Number.isInteger(saved.step)&&saved.step>=0&&saved.step<=5)setStep(saved.step);
        }
        const restored=mergeSimulationHistory(remote?.history,readStoredJson(`comexhub:sim:history:${username}`));
        setHistory(restored);
        try{localStorage.setItem(`comexhub:sim:history:${username}`,JSON.stringify(restored))}catch{}
        if(!remote)setStorageNotice('Servidor de simulações indisponível. Usando os dados deste navegador.');
      }catch{ /* Ignore damaged browser storage. */ }
      if(active)setStorageReady(true);
    }).catch(()=>{if(active)setStorageReady(true)});
    return ()=>{active=false};
  },[]);
  useEffect(()=>{
    if(!storageOwner||!storageReady)return;
    try{localStorage.setItem(`comexhub:sim:draft:${storageOwner}`,JSON.stringify({op,originCode,destinationCode,product,ncm,modal,term,qty,unit,fx,origin,loading,freight,insurance,lastMile,unloading,fees,destDuty,vat,ii,ipi,pis,cofins,icms,checked,step}));}catch{/* Storage may be disabled or full. */}
    const timer=setTimeout(()=>{fetch('/api/simulations',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,originCode,destinationCode,product,ncm,modal,term,qty,unit,fx,origin,loading,freight,insurance,lastMile,unloading,fees,destDuty,vat,ii,ipi,pis,cofins,icms,checked,step})}).catch(()=>{})},900);return ()=>clearTimeout(timer);
  },[storageOwner,storageReady,op,originCode,destinationCode,product,ncm,modal,term,qty,unit,fx,origin,loading,freight,insurance,lastMile,unloading,fees,destDuty,vat,ii,ipi,pis,cofins,icms,checked,step]);
  async function saveSimulation(data:SimulationReport){
    if(!storageOwner)return;
    setStorageNotice('Salvando relatório…');
    let saved:SimulationReport=data;
    try{
      const response=await fetch('/api/simulations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(!response.ok)throw Error('Não foi possível salvar no servidor.');
      const result=await response.json();if(typeof result.id!=='string')throw Error('Resposta inválida.');
      saved={...data,serverId:result.id};setStorageNotice('Relatório salvo na sua conta.');
    }catch{setStorageNotice('Relatório salvo somente neste navegador. A gravação no servidor falhou.');}
    setHistory(previous=>{
      const next=[saved,...previous].slice(0,30);
      try{localStorage.setItem(`comexhub:sim:history:${storageOwner}`,JSON.stringify(next));}catch{}
      return next;
    });
  }
  async function deleteSimulation(index:number){
    if(!storageOwner)return;
    const row=history[index];if(!row)return;
    try{
      if(row.serverId){
        const response=await fetch('/api/simulations?id='+encodeURIComponent(row.serverId),{method:'DELETE'});
        if(!response.ok)throw Error('Falha ao excluir.');
      }
      setHistory(previous=>{const next=previous.filter(item=>item!==row);try{localStorage.setItem(`comexhub:sim:history:${storageOwner}`,JSON.stringify(next))}catch{}return next;});
      setStorageNotice('Relatório excluído do histórico.');
    }catch{setStorageNotice('Não foi possível excluir o relatório. Tente novamente.');throw Error('Falha ao excluir relatório.');}
  }


  useEffect(()=>{
    if(!storageReady)return;
    const params=new URLSearchParams(window.location.search);
    const kind=params.get('tipo');
    if(kind==='exportacao') {setOp('export');setOriginCode('BR');setDestinationCode('NL');}
    if(kind==='importacao') {setOp('import');setOriginCode('CN');setDestinationCode('BR');}
    const code=params.get('ncm');
    if(code&&/^\d{8}$/.test(code))setNcm(code.replace(/^(\d{4})(\d{2})(\d{2})$/,'$1.$2.$3'));
    const name=params.get('produto');
    if(name)setProduct(name.slice(0,160));
    if(code&&/^\d{8}$/.test(code))setStep(0);
  },[storageReady]);

  useEffect(()=>{
    if(!wasWizardInitialized.current){
      wasWizardInitialized.current=true;
      return;
    }
    document.getElementById('simulator-wizard-top')?.scrollIntoView({behavior:'smooth',block:'start'});
  },[step]);

  const originMarket=MARKET_BY_CODE.get(originCode);
  const destinationMarket=MARKET_BY_CODE.get(destinationCode);
  const international=isCrossBorder(originCode,destinationCode);
  const euInternal=isIntraEU(originCode,destinationCode);
  const brazilTax=taxRegimeFor(destinationCode)==='brasil';
  const incoterm=getIncoterm(term);
  const compatible=isCompatible(term,modal);
  const countryLinks=useMemo(()=>tariffReferences(originCode,destinationCode),[originCode,destinationCode]);
  const prices=useMemo(()=>({
    goods:numberFrom(qty)*numberFrom(unit),
    origin:numberFrom(origin),
    loading:numberFrom(loading),
    freight:numberFrom(freight),
    insurance:numberFrom(insurance),
    lastMile:numberFrom(lastMile),
    unloading:numberFrom(unloading),
    fees:numberFrom(fees)
  }),[qty,unit,origin,loading,freight,insurance,lastMile,unloading,fees]);
  const customsBase=prices.goods+prices.freight+prices.insurance;
  const taxBrazil=calculateBrazilImport(customsBase,{ii,ipi,pis,cofins,icms},prices.fees);
  const taxWorld=calculateDestinationTax(customsBase,destDuty,vat);
  const taxCompleted=brazilTax?taxBrazil.complete:taxWorld.complete;
  const tax=international?(brazilTax?taxBrazil.total:taxWorld.total):null;
  const landedBeforeTaxes=prices.goods+prices.origin+prices.loading+prices.freight+prices.insurance+prices.lastMile+prices.unloading+prices.fees;
  const total=tax!==null?landedBeforeTaxes+tax:null;
  const allocation=allocate(incoterm,{origin:prices.origin,loading:prices.loading,freight:prices.freight,insurance:prices.insurance,lastMile:prices.lastMile,unloading:prices.unloading,tax:tax??0});
  const sellerCost=!international||(tax===null&&term==='DDP')?null:allocation.seller;
  const buyerCost=!international||tax===null?null:allocation.buyer+prices.fees;
  const showBrl=originCode==='BR'||destinationCode==='BR';

  const warnings=[
    !international?'Origem e destino devem ser países ou territórios diferentes para esta simulação de comércio exterior.':null,
    !compatible?'O Incoterm selecionado é incompatível com este modal. FAS, FOB, CFR e CIF são exclusivos de transporte por água.':null,
    term==='EXW'?'Em EXW, o comprador teria de viabilizar o despacho de exportação no país de origem. Confira as regras locais.':null,
    term==='DDP'?'Em DDP, o vendedor precisa poder realizar a importação e pagar tributos no país de destino. Confirme exigências legais.':null,
    euInternal?'Entre países da UE, operações com mercadorias em livre circulação geralmente não seguem a importação aduaneira extracomunitária. Verifique IVA intracomunitário e regimes específicos; o modelo genérico abaixo pode não ser adequado.':null,
    prices.goods===0?'Informe quantidade e valor unitário positivos.':null,
  ].filter((x):x is string=>Boolean(x));

  function clearDestinationRates(){
    setDestDuty('');
    setVat('');
    setIi('');
    setIpi('');
    setPis('');
    setCofins('');
    setIcms('');
    setChecked([]);
  }

  function changeOrigin(code:string){
    if(code!==originCode){
      setOriginCode(code);
      clearDestinationRates();
    }
  }

  function changeDestination(code:string){
    if(code!==destinationCode){
      setDestinationCode(code);
      clearDestinationRates();
    }
  }

  function swapMarkets(){
    setOriginCode(destinationCode);
    setDestinationCode(originCode);
    clearDestinationRates();
  }

  function useRoute(from:string,to:string){
    setOriginCode(from);
    setDestinationCode(to);
    clearDestinationRates();
  }

  function changeOperation(next:Operation){
    setOp(next);
    setChecked([]);
  }

  const currentSignature=JSON.stringify([
    op,originCode,destinationCode,product,ncm,modal,term,qty,unit,fx,
    origin,loading,freight,insurance,lastMile,unloading,fees,
    destDuty,vat,ii,ipi,pis,cofins,icms,...checked.slice().sort()
  ]);

  const checklist=[
    'Origem e destino definidos e elegibilidade comercial verificada',
    'Código HS e código tarifário do destino conferidos',
    'Requisitos, licenças e controles administrativos dos dois países verificados',
    'Tratamento tarifário, regras de origem e preferências comprovados',
    'Incoterm® 2020 com local de entrega nomeado no contrato',
    'Modal, frete, seguro, embalagem e prazos cotados',
    'Invoice, packing list, documento de transporte e outros certificados conferidos',
    'Pagamento internacional, câmbio, riscos e sanções avaliados',
  ];

  function generateReport(){
    const unitCost=(label:string,amount:number):{label:string;value:string}=>({label,value:formatUsd(amount)});
    const moneyOrPending=(value:number|null)=>value===null?'Pendente':formatUsd(value);
    const taxValues:{label:string;value:string}[]=brazilTax?[
      {label:`II · ${hasRate(ii)?ii+'%':'não informado'}`,value:hasRate(ii)?formatUsd(taxBrazil.ii):'Pendente'},
      {label:`IPI · ${hasRate(ipi)?ipi+'%':'não informado'}`,value:hasRate(ipi)?formatUsd(taxBrazil.ipi):'Pendente'},
      {label:`PIS-Importação · ${hasRate(pis)?pis+'%':'não informado'}`,value:hasRate(pis)?formatUsd(taxBrazil.pis):'Pendente'},
      {label:`Cofins-Importação · ${hasRate(cofins)?cofins+'%':'não informado'}`,value:hasRate(cofins)?formatUsd(taxBrazil.cofins):'Pendente'},
      {label:`ICMS · ${hasRate(icms)?icms+'%':'não informado'}`,value:hasRate(icms)&&taxBrazil.complete&&taxBrazil.icms!==null?formatUsd(taxBrazil.icms):'Pendente'},
    ]:[
      {label:`Tarifa aduaneira · ${hasRate(destDuty)?destDuty+'%':'não informado'}`,value:moneyOrPending(taxWorld.duty)},
      {label:`IVA / VAT / GST · ${hasRate(vat)?vat+'%':'não informado'}`,value:moneyOrPending(taxWorld.indirect)},
    ];
    const costSections:ReportSection[]=[
      {title:'Composição do custo logístico (USD)',lines:[
        unitCost('Mercadoria, sem logística',prices.goods),
        unitCost('Despacho e entrega na origem',prices.origin),
        unitCost('Carregamento e movimentação',prices.loading),
        unitCost('Frete internacional',prices.freight),
        unitCost('Seguro internacional',prices.insurance),
        unitCost('Transporte no destino',prices.lastMile),
        unitCost('Descarga no destino',prices.unloading),
        unitCost('Taxas locais e administrativas',prices.fees),
        unitCost('Frete + seguro',prices.freight+prices.insurance),
        unitCost('Base CIF aproximada',customsBase),
        unitCost('Custo da cadeia antes dos tributos',landedBeforeTaxes),
      ]},
      {title:`Tributação ilustrativa — ${destinationMarket?.name??destinationCode}`,lines:[
        ...taxValues,
        {label:'Total estimado de tributos',value:moneyOrPending(tax)},
      ]},
      {title:'Distribuição simplificada de despesas por Incoterm',lines:[
        {label:'Despesas do vendedor (sem mercadoria/margem)',value:moneyOrPending(sellerCost)},
        {label:'Despesas do comprador (sem mercadoria/margem)',value:moneyOrPending(buyerCost)},
        {label:'Transferência de risco',value:incoterm.risk},
        {label:'Despacho de exportação',value:incoterm.exportClearance==='seller'?'Vendedor':'Comprador'},
        {label:'Despacho de importação',value:incoterm.importClearance==='seller'?'Vendedor':'Comprador'},
      ]},
    ];
    if(showBrl)costSections.push({title:'Conversão didática para reais',lines:[
      {label:'Câmbio informado (BRL/USD)',value:fx},
      {label:'Total convertido (BRL)',value:total===null?'Pendente':formatBrl(total*numberFrom(fx))},
    ]});
    const data=createSimulationReport({
      operation:op==='import'?'Importação':'Exportação',
      route:`${originMarket?.name??originCode} (${originCode}) → ${destinationMarket?.name??destinationCode} (${destinationCode})`,
      product:product.trim(),
      summary:[
        {label:'Código NCM/HS informado',value:ncm.trim()||'Não informado'},
        {label:'Quantidade',value:qty},
        {label:'Preço unitário (USD)',value:formatUsd(numberFrom(unit))},
        {label:'Modal principal',value:modal},
        {label:'Incoterm® 2020',value:incoterm.name},
        {label:'Valor da mercadoria (USD)',value:formatUsd(prices.goods)},
        {label:'Base CIF estimada (USD)',value:formatUsd(customsBase)},
        {label:'Tributos estimados (USD)',value:moneyOrPending(tax)},
      ],
      sections:costSections,
      total:moneyOrPending(total),
      hasInternationalRoute:international,
      modeCompatible:compatible,
      taxCompleted,
      tradeEuInternal:euInternal,
      positiveGoods:prices.goods>0,
      messages:warnings,
      checked,
      unchecked:checklist.filter(item=>!checked.includes(item)),
      sources:[
        {name:'ICC — Incoterms® 2020',url:'https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/'},
        ...countryLinks.map(x=>({name:x.name,url:x.url})),
        ...(showBrl?[{name:'Portal Siscomex',url:'https://www.gov.br/siscomex/pt-br'}]:[]),
      ],
    });
    setReport({data,signature:currentSignature});
    saveSimulation(data);
    window.setTimeout(()=>document.getElementById('simulation-report-section')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
  }

  const steps=[
    {id:'route',short:'Rota',title:'Origem, destino e produto'},
    {id:'terms',short:'Condições',title:'Modal e Incoterm® 2020'},
    {id:'costs',short:'Custos',title:'Custos logísticos estimados'},
    {id:'taxes',short:'Tributos',title:`Tributação em ${destinationMarket?.name??destinationCode}`},
    {id:'checklist',short:'Conferência',title:'Conferências internacionais'},
    {id:'result',short:'Resultado',title:'Resultado final e relatório'},
  ] as const;
  const currentStep=steps[step];
  const progress=((step+1)/steps.length)*100;

  function goToStep(index:number){
    setStep(Math.min(Math.max(index,0),steps.length-1));
  }

  function nextStep(){
    goToStep(step+1);
  }

  function previousStep(){
    goToStep(step-1);
  }

  function renderStep(){
    if(currentStep.id==='route')return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 01</span><h2>Origem, destino e produto</h2>
      <p className="page-lead">Defina a rota da operação, a mercadoria e os valores básicos da venda antes de seguir para as demais configurações.</p>
      <p className="help sim-units-note"><strong>Unidades:</strong> quantidade de produtos. <strong>US$:</strong> dinheiro em dólares. <strong>R$/US$:</strong> cotação do dólar em reais. Digite somente números.</p>
      <div className="market-pair">
        <CountryPicker id="origem" label="País ou território de origem" value={originCode} onChange={changeOrigin}/>
        <CountryPicker id="destino" label="País ou território de destino" value={destinationCode} onChange={changeDestination}/>
      </div>
      <div className="market-route-actions">
        <button type="button" className="btn secondary swap-route" onClick={swapMarkets}><RefreshCcw size={16}/> Inverter países</button>
        <div className="market-route-summary" aria-live="polite"><span>ROTA SELECIONADA</span><strong>{flagForCountryCode(originCode)} {originMarket?.name??originCode} <ArrowLeftRight size={14}/> {flagForCountryCode(destinationCode)} {destinationMarket?.name??destinationCode}</strong></div>
      </div>
      <details className="market-examples"><summary>Ver exemplos de rotas</summary><div className="route-actions"><button type="button" onClick={()=>useRoute('CN','US')}>China → EUA</button><button type="button" onClick={()=>useRoute('DE','FR')}>Alemanha → França</button><button type="button" onClick={()=>useRoute('JP','AU')}>Japão → Austrália</button></div></details>
      <div className="grid-2"><label className="field"><span className="label">Mercadoria</span><input className="input" value={product} onChange={e=>setProduct(e.target.value)}/></label>
        <label className="field"><span className="label">{showBrl?'NCM brasileiro / código HS para conferência':'Código HS / classificação local no destino'}</span><input className="input" value={ncm} onChange={e=>setNcm(e.target.value)}/></label></div>
      <div className="grid-2"><Num name="Quantidade" value={qty} set={setQty} kind="quantity"/><Num name="Preço por unidade sem logística (USD)" value={unit} set={setUnit}/></div>
      {showBrl&&<Num name="Câmbio didático (reais por dólar)" value={fx} set={setFx} kind="exchange"/>} 
      <p className="help">Pesquise diretamente pelo nome ou sigla, com bandeiras para identificar os países e territórios. Os preços são simulados em USD, inclusive entre países fora do Brasil. O código HS é harmonizado até seis dígitos; o país importador pode exigir detalhamento próprio.</p>
    </section>;

    if(currentStep.id==='terms')return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 02</span><h2>Modal e Incoterm® 2020</h2>
      <p className="page-lead">Escolha como a mercadoria será transportada e defina a regra Incoterm que distribui custos, riscos e responsabilidades.</p>
      <div className="grid-2"><label className="field"><span className="label">Modal principal</span><select className="select" value={modal} onChange={e=>setModal(e.target.value)}>{['Marítimo','Aéreo','Rodoviário','Ferroviário','Multimodal'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span className="label">Incoterm® 2020</span><select className="select" value={term} onChange={e=>setTerm(e.target.value)}>{INCOTERMS.map(x=><option key={x.code} value={x.code}>{x.code} — {x.name.split(' — ')[1]}</option>)}</select></label></div>
      <div className="flex-head"><span className="mini-tag">{INCOTERMS.length} regras</span><span className="mini-tag">{incoterm.modes==='sea'?'Apenas transporte por água':'Todos os modais'}</span></div>
      <div className="info"><strong>{incoterm.name}</strong><p style={{margin:'7px 0'}}>{incoterm.description}</p><strong>Transferência de risco:</strong> {incoterm.risk}
        <p className="small-top" style={{marginBottom:0}}><strong>Despacho de exportação:</strong> {incoterm.exportClearance==='seller'?'vendedor':'comprador'} · <strong>Despacho de importação:</strong> {incoterm.importClearance==='seller'?'vendedor':'comprador'}</p></div>
      {warnings.map((message,i)=><div key={i} className="alert" role="status"><ShieldAlert size={15} style={{verticalAlign:'middle',marginRight:6}}/>{message}</div>)}
      <p className="help">A responsabilidade por custos e riscos depende do Incoterm, do ponto nomeado e do contrato. O simulador não substitui essas condições.</p>
    </section>;

    if(currentStep.id==='costs')return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 03</span><h2>Custos logísticos estimados (USD)</h2>
      <p className="page-lead">Informe os custos da cadeia logística para montar a base CIF e estimar a distribuição de despesas entre vendedor e comprador.</p>
      <p className="help sim-units-note"><strong>Valores monetários:</strong> todos os campos desta etapa são em <strong>US$ (dólares)</strong>, não em porcentagem. Digite apenas o número.</p>
      <div className="grid-2"><Num name="Despacho e entrega na origem" value={origin} set={setOrigin}/><Num name="Carregamento a bordo / movimentação" value={loading} set={setLoading}/><Num name="Frete internacional" value={freight} set={setFreight}/><Num name="Seguro internacional (se contratado)" value={insurance} set={setInsurance}/><Num name="Transporte até o local nomeado" value={lastMile} set={setLastMile}/><Num name="Descarga no destino" value={unloading} set={setUnloading}/><Num name="Taxas locais e administrativas" value={fees} set={setFees}/></div>
      <p className="help">Categorias de custo ilustrativas, sem incluir todos os encargos e regimes de cada país. O preço unitário informado deve excluir despesas listadas separadamente para evitar dupla contagem.</p>
    </section>;

    if(currentStep.id==='taxes')return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 04</span><h2>Tributação na entrada em {destinationMarket?.name??destinationCode}</h2>
      <p className="page-lead">O país importador define as regras tributárias. Tarifas também dependem do <strong>produto, país de origem, acordos comerciais, preferências e data</strong>. Informe as taxas verificadas nas fontes oficiais; campo vazio significa não apurado (zero deve ser preenchido explicitamente).</p>
      <p className="help sim-units-note"><strong>Alíquotas (%):</strong> os campos abaixo são porcentagens, não valores em dinheiro. Por exemplo, digite <strong>12</strong> para indicar <strong>12%</strong>. Informe <strong>0</strong> quando a alíquota verificada for zero.</p>
      {brazilTax?<div className="grid-2"><Num name="II — Imposto de Importação (%)" value={ii} set={setIi} kind="percent"/><Num name="IPI (%)" value={ipi} set={setIpi} kind="percent"/><Num name="PIS-Importação (%)" value={pis} set={setPis} kind="percent"/><Num name="Cofins-Importação (%)" value={cofins} set={setCofins} kind="percent"/><Num name="ICMS (%)" value={icms} set={setIcms} kind="percent"/></div>
        :<div className="grid-2"><Num name="Tarifa aduaneira estimada no destino (%)" value={destDuty} set={setDestDuty} kind="percent"/><Num name="Imposto indireto no destino — IVA/VAT/GST (%)" value={vat} set={setVat} kind="percent"/></div>}
      {euInternal&&<div className="alert"><strong>Comércio intracomunitário da UE:</strong> verifique circulação livre de bens, IVA sobre operações intracomunitárias e requisitos específicos. O cálculo extracomunitário simplificado abaixo não deve ser utilizado automaticamente nessa rota.</div>}
      <div className="info"><Info size={17} style={{verticalAlign:'middle',marginRight:7}}/>{brazilTax?'Modelo ilustrativo do Brasil: II sobre CIF estimado; IPI sobre CIF+II; PIS/Cofins sobre CIF; ICMS por dentro segundo as rubricas informadas. Bases efetivas dependem da legislação.':'Modelo genérico ilustrativo: tarifa sobre CIF estimado e IVA/VAT/GST sobre CIF mais tarifa. Cada país possui bases, exceções e cobranças próprias, não cobertas integralmente.'}</div>
      <div className="flex-head"><b style={{fontSize:13}}>Fontes referentes ao destino:</b></div>
      {countryLinks.map(x=><p key={x.name} style={{margin:'8px 0'}}><a href={x.url} target="_blank" rel="noopener noreferrer" className="reference-link">{x.name} <ExternalLink size={14}/></a></p>)}
      <p className="help">Confirme a classificação tarifária local, regras de origem, acordos preferenciais, medidas antidumping, cotas, licenças, tributos seletivos e sanções. Não há alíquota universal por país.</p>
    </section>;

    if(currentStep.id==='checklist')return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 05</span><h2>Checklist internacional</h2>
      <p className="page-lead">Marque somente os itens já conferidos para essa operação. Ao trocar a origem ou o destino, as verificações e as alíquotas anteriores são limpas automaticamente.</p>
      {checklist.map(label=><label key={label} className="checkrow"><input type="checkbox" checked={checked.includes(label)} onChange={e=>setChecked(old=>e.target.checked?[...old,label]:old.filter(item=>item!==label))}/><span>{label}</span></label>)}
      <span className="mini-tag"><CheckCheck size={15}/>{checked.length} de {checklist.length} verificações feitas</span>
    </section>;

    return <section className="panel wizard-panel"><span className="eyebrow">ETAPA 06</span><h2>Resultado final e relatório</h2>
      <p className="page-lead">Confira o resumo da operação e gere um relatório com rota, mercadoria, Incoterm, custos, impostos estimados e checklist. Depois, use os botões separados para imprimir ou baixar um arquivo PDF.</p>
      <div className="grid-2 wizard-final-grid">
        <div className="info"><strong>Rota e configuração</strong><p style={{margin:'8px 0 0'}}>{originMarket?.name??originCode} ({originCode}) → {destinationMarket?.name??destinationCode} ({destinationCode})<br/>{modal} · {incoterm.name}<br/>Mercadoria: {product}</p></div>
        <div className="info"><strong>Situação da simulação</strong><p style={{margin:'8px 0 0'}}>Tributos: {taxCompleted?'completos':'pendentes'}<br/>Checklist: {checked.length} de {checklist.length} itens marcados<br/>Rota internacional: {international?'sim':'não'}</p></div>
      </div>
      <div className="subline"><span>Valor da mercadoria</span><strong>{formatUsd(prices.goods)}</strong></div>
      <div className="subline"><span>Base CIF aproximada</span><strong>{formatUsd(customsBase)}</strong></div>
      <div className="subline"><span>Tributos estimados no destino</span><strong>{tax===null?'Pendente':formatUsd(tax)}</strong></div>
      <div className="subline total"><span>Total ilustrativo da cadeia</span><strong>{total===null?'Pendente':formatUsd(total)}</strong></div>
      {showBrl&&total!==null&&<p className="help">Conversão didática: {formatBrl(total*numberFrom(fx))}</p>}
    </section>;
  }

  return <>
    <div className="flex-head"><div><span className="eyebrow">LABORATÓRIO DE OPERAÇÕES INTERNACIONAIS</span><h1>Simuladores de Operações</h1>
      <p className="page-lead">Agora o simulador funciona em formato guiado: você avança uma etapa por vez, sem precisar preencher tudo de uma só vez.</p></div>
      <span className="mini-tag"><Globe2 size={15}/>{MARKETS.length} países e territórios</span>
    </div>
    <div className="segmented" role="tablist" aria-label="Perspectiva da operação">
      <button role="tab" aria-selected={op==='import'} className={op==='import'?'selected':''} onClick={()=>changeOperation('import')}>Visão de importação</button>
      <button role="tab" aria-selected={op==='export'} className={op==='export'?'selected':''} onClick={()=>changeOperation('export')}>Visão de exportação</button>
    </div>
    <p className="help operation-hint">{op==='import'?'Perspectiva de quem compra e recebe a mercadoria no país de destino.':'Perspectiva de quem vende e despacha a mercadoria no país de origem.'} Você pode escolher qualquer par de países; alterar a perspectiva não muda a rota selecionada.</p>

    <section className="wizard-header" id="simulator-wizard-top" aria-label="Etapas da simulação">
      <div className="flex-head">
        <div>
          <span className="eyebrow">PREENCHIMENTO GUIADO</span>
          <h2>Preencha uma etapa por vez</h2>
          <p className="page-lead">Clique nas etapas para revisar o que quiser ou use os botões de navegação para seguir em ordem.</p>
        </div>
        <span className="mini-tag">Etapa {step+1} de {steps.length}</span>
      </div>
      <div className="wizard-progress" aria-hidden="true"><span style={{width:`${progress}%`}}/></div>
      <div className="wizard-steps" role="tablist" aria-label="Etapas do simulador">
        {steps.map((item,index)=><button key={item.id} type="button" role="tab" aria-selected={index===step} className={`wizard-step ${index===step?'current':''} ${index<step?'done':''}`} onClick={()=>goToStep(index)}>
          <span className="wizard-step-index">{String(index+1).padStart(2,'0')}</span>
          <strong>{item.short}</strong>
          <small>{item.title}</small>
        </button>)}
      </div>
    </section>

    <div className="grid-2 sim-layout" style={{gridTemplateColumns:'minmax(0,1.15fr) minmax(290px,.85fr)',alignItems:'start',marginTop:19}}>
      <div>
        {renderStep()}
        <div className="wizard-nav">
          <button type="button" className="btn secondary" onClick={previousStep} disabled={step===0}>Etapa anterior</button>
          <div className="wizard-nav-copy"><strong>{currentStep.title}</strong><span>Siga no seu ritmo. Você pode voltar e revisar qualquer etapa antes de gerar o relatório.</span></div>
          {step<steps.length-1?<button type="button" className="btn" onClick={nextStep}>Próxima etapa</button>:<button type="button" className="btn" onClick={generateReport}><FileText size={18}/>{report?'Atualizar relatório':'Gerar relatório'}</button>}
        </div>
      </div>
      <aside><div className="panel sticky"><span className="eyebrow">PAINEL DA SIMULAÇÃO</span><h2 className="trade-route">{originMarket?.name??originCode} <ArrowLeftRight size={20}/> {destinationMarket?.name??destinationCode}</h2>
        <div className="flex-head"><span className="mini-tag">{modal==='Marítimo'?<Ship size={14}/>:modal==='Aéreo'?<Plane size={14}/>:<Truck size={14}/>} {modal}</span><span className="mini-tag">{term}</span></div>
        <p className="help">{op==='import'?'Visão do importador:':'Visão do exportador:'} simulação em USD, sem cálculo de taxas oficiais.</p>
        <p className="help sim-units-legend">Valores com <strong>US$</strong> são montantes em dinheiro; alíquotas são informadas em <strong>%</strong> na etapa Tributos.</p>
        <div className="subline"><span>Mercadoria sem logística</span><strong>{formatUsd(prices.goods)}</strong></div>
        <div className="subline"><span>Frete + seguro</span><strong>{formatUsd(prices.freight+prices.insurance)}</strong></div>
        <div className="subline"><span>Base CIF aproximada</span><strong>{formatUsd(customsBase)}</strong></div>
        <div className="subline"><span>Demais custos informados</span><strong>{formatUsd(prices.origin+prices.loading+prices.lastMile+prices.unloading+prices.fees)}</strong></div>
        <div className="subline"><span>Tributos estimados no destino</span><strong>{tax===null?'Pendente':formatUsd(tax)}</strong></div>
        <div className="subline total"><span>Total ilustrativo da cadeia</span><strong>{total===null?'Pendente':formatUsd(total)}</strong></div>
        {showBrl&&total!==null&&<p className="help">Conversão didática: {formatBrl(total*numberFrom(fx))}</p>}
        <h3 style={{marginTop:22}}>Distribuição de custos</h3>
        <div className="subline"><span>Vendedor · despesas da cadeia</span><strong>{sellerCost===null?'Pendente':formatUsd(sellerCost)}</strong></div>
        <div className="subline"><span>Comprador · despesas da cadeia</span><strong>{buyerCost===null?'Pendente':formatUsd(buyerCost)}</strong></div>
        <p className="help">Não inclui o preço do produto nem margem na divisão por Incoterm. Taxas locais adicionais foram atribuídas ao comprador apenas como hipótese.</p>
        <div className="wizard-side-status">
          <div className="mini-tag"><CheckCheck size={14}/>{checked.length}/{checklist.length} itens conferidos</div>
          <div className="mini-tag"><FileText size={14}/>{taxCompleted?'Tributos informados':'Tributos pendentes'}</div>
        </div>
        {!international&&<div className="alert">A rota selecionada não é internacional. Escolha países diferentes.</div>}
        {!taxCompleted&&international&&<div className="alert">Complete as alíquotas do país importador para calcular a tributação didática.</div>}
        {!compatible&&<div className="alert">Revise o modal ou o Incoterm selecionado.</div>}
        <h3 style={{marginTop:23}}>Referências</h3>
        <a className="reference-link" href="https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/" target="_blank" rel="noopener noreferrer">ICC — Incoterms® 2020 <ExternalLink size={14}/></a>
        {showBrl&&<a className="reference-link" href="https://www.gov.br/siscomex/pt-br" target="_blank" rel="noopener noreferrer">Portal Siscomex <ExternalLink size={14}/></a>}
        <div className="info"><BookOpen size={17} style={{verticalAlign:'middle',marginRight:6}}/>Simulação educacional: o uso de dados corretos de classificação, tributação, origem e restrições de cada país é responsabilidade de quem realiza a operação.</div>
      </div></aside>
    </div>
    {storageNotice&&<p className="help" role="status" aria-live="polite">{storageNotice}</p>}
    <SimulationHistory reports={history} enabled={Boolean(storageOwner)} onDelete={deleteSimulation}/>
    {step===steps.length-1&&report&&<SimulationReportView report={report.data} stale={report.signature!==currentSignature} onRegenerate={generateReport}/>}
  </>;
}
