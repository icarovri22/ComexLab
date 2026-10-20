/** Immutable display-only snapshot used for the printable educational simulation report. */
export type ReportLine={label:string;value:string};
export type ReportSection={title:string;lines:ReportLine[]};
export type ReportSource={name:string;url:string};
export type SimulationReport={
  serverId?:string;
  generatedAt:string;
  operation:string;
  route:string;
  product:string;
  summary:ReportLine[];
  sections:ReportSection[];
  total:string;
  status:'Completa para fins didáticos'|'Requer revisão';
  alerts:string[];
  checked:string[];
  unchecked:string[];
  sources:ReportSource[];
};

export type SimulationReportInput=Omit<SimulationReport,'generatedAt'|'status'|'alerts'> & {
  hasInternationalRoute:boolean;
  modeCompatible:boolean;
  taxCompleted:boolean;
  tradeEuInternal:boolean;
  positiveGoods:boolean;
  messages:string[];
};

/** Does not calculate fees or tax rates; the simulator supplies its already displayed values. */
export function createSimulationReport(input:SimulationReportInput,now:Date=new Date()):SimulationReport {
  const alerts=[...input.messages];
  if(!input.hasInternationalRoute)alerts.push('A rota deve incluir países diferentes para uma simulação de comércio exterior.');
  if(!input.modeCompatible)alerts.push('Modal incompatível com o Incoterm informado.');
  if(!input.positiveGoods)alerts.push('Quantidade e preço unitário devem gerar um valor de mercadorias positivo.');
  if(!input.taxCompleted)alerts.push('Tributação não apurada: informe todas as alíquotas aplicáveis, incluindo zero quando confirmado.');
  if(input.tradeEuInternal)alerts.push('Operação entre países da UE: o cálculo extracomunitário genérico exige revisão antes do uso.');
  const safeAlerts=Array.from(new Set(alerts));
  const complete=input.hasInternationalRoute&&input.modeCompatible&&input.taxCompleted&&!input.tradeEuInternal&&input.positiveGoods;
  return {
    generatedAt:new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Fortaleza'}).format(now),
    operation:input.operation,route:input.route,product:input.product,
    summary:input.summary.map(line=>({...line})),
    sections:input.sections.map(section=>({title:section.title,lines:section.lines.map(line=>({...line}))})),
    total:input.total,
    status:complete?'Completa para fins didáticos':'Requer revisão',
    alerts:safeAlerts,
    checked:[...input.checked],unchecked:[...input.unchecked],
    sources:input.sources.map(source=>({...source})),
  };
}
