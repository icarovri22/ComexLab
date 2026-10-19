/** Calendar month in Fortaleza; boundaries are instants, not a rolling 30-day window. */
export function newsMonth(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit'}).formatToParts(now);
 const year=Number(parts.find(p=>p.type==='year')?.value);const month=Number(parts.find(p=>p.type==='month')?.value);
 const start=new Date(Date.UTC(year,month-1,1,3));const end=new Date(Date.UTC(year,month,1,3));
 return {key:`${year}-${String(month).padStart(2,'0')}`,start:start.toISOString(),end:end.toISOString(),label:start.toLocaleDateString('pt-BR',{timeZone:'America/Fortaleza',month:'long',year:'numeric'})};
}
