import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Download, TrendingUp, Users, CalendarDays, Wallet, Target, ClipboardList } from 'lucide-react'

const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const statusNames = { pending:'Novos', contacted:'Em contato', negotiating:'Negociação', approved:'Aprovados', rejected:'Recusados', completed:'Concluídos' }
const dateLabel = value => new Date(value).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"'

function downloadCsv(rows) {
  const headers = ['Data do pedido','Cliente','Telefone','E-mail','Data do evento','Local','Convidados','Horas','Plano','Valor estimado','Status','Observações']
  const lines = rows.map(q => [q.created_at ? new Date(q.created_at).toLocaleString('pt-BR') : '',q.customer_name,q.customer_phone,q.customer_email,q.event_date,q.event_location,q.guest_count,q.hours,q.items?.plan?.name,q.estimated_total,statusNames[q.status] || q.status,q.notes].map(csvCell).join(';'))
  const blob = new Blob(['\ufeff' + [headers.map(csvCell).join(';'), ...lines].join('\n')], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href=url; a.download='bar-experience-relatorio-orcamentos.csv'; a.click(); URL.revokeObjectURL(url)
}


function downloadDetailedCsv(rows) {
  const headers=['ID do orçamento','Data do pedido','Cliente','Data do evento','Local','Status','Plano','Categoria do item','Tipo do item','Item','Valor estimado do item','Convidados','Horas']
  const output=[]
  rows.forEach(q=>{
    const common=[q.id,q.created_at?new Date(q.created_at).toLocaleString('pt-BR'):'',q.customer_name,q.event_date,q.event_location,statusNames[q.status]||q.status,q.items?.plan?.name]
    const items=[
      ...(q.items?.plan?[{type:'Plano',name:q.items.plan.name,category:q.items.plan.category,price:q.items?.calculation?.plan}]:[]),
      ...(q.items?.drinks||[]).map(x=>({type:'Drink',...x,price:''})),
      ...(q.items?.services||[]).map(x=>({type:'Serviço',...x,price:x.estimated_price})),
      ...(q.items?.structures||[]).map(x=>({type:'Estrutura',...x,price:x.estimated_price})),
      ...(q.items?.professionals||[]).map(x=>({type:'Profissional',...x,price:x.estimated_price}))
    ]
    items.forEach(item=>output.push([...common,item.category||'Sem categoria',item.type,item.name,item.price??'',q.guest_count,q.hours]))
  })
  const blob=new Blob(['\\ufeff'+[headers,...output].map(row=>row.map(csvCell).join(';')).join('\\n')],{type:'text/csv;charset=utf-8;'})
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bar-experience-relatorio-detalhado.csv';a.click();URL.revokeObjectURL(url)
}

export default function AnalyticsDashboard() {
  const [quotes,setQuotes]=useState([])
  const [drinkCosts,setDrinkCosts]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [period,setPeriod]=useState('all')
  const load=useCallback(async()=>{
    setLoading(true); setError('')
    const [q,costs]=await Promise.all([supabase.from('be_quotes').select('*').order('created_at',{ascending:false}),supabase.from('be_drink_costs').select('ingredient_cost,garnish_cost,packaging_cost,other_cost,reference_price,drink:be_drinks(id,name,category)')])
    if(q.error) setError('Não foi possível carregar os indicadores: '+q.error.message)
    else setQuotes(q.data||[])
    if(!costs.error) setDrinkCosts(costs.data||[])
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])

  const filtered=useMemo(()=>{
    if(period==='all') return quotes
    const days=Number(period), cutoff=Date.now()-days*86400000
    return quotes.filter(q=>new Date(q.created_at).getTime()>=cutoff)
  },[quotes,period])
  const stats=useMemo(()=>{
    const count=filtered.length
    const sum=key=>filtered.filter(q=>q.status===key).reduce((n,q)=>n+Number(q.estimated_total||0),0)
    const approved=filtered.filter(q=>['approved','completed'].includes(q.status))
    const open=filtered.filter(q=>['pending','contacted','negotiating'].includes(q.status))
    const total=filtered.reduce((n,q)=>n+Number(q.estimated_total||0),0)
    const avg=count?total/count:0
    const conversion=count?approved.length/count*100:0
    const guests=filtered.reduce((n,q)=>n+Number(q.guest_count||0),0)
    const hours=filtered.reduce((n,q)=>n+Number(q.hours||0),0)
    return {count,pending:filtered.filter(q=>q.status==='pending').length,approved:approved.length,rejected:filtered.filter(q=>q.status==='rejected').length,open:open.length,total,approvedValue:sum('approved')+sum('completed'),pipeline:open.reduce((n,q)=>n+Number(q.estimated_total||0),0),avg,conversion,guests,hours}
  },[filtered])
  const monthly=useMemo(()=>{
    const now=new Date()
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1)
      const next=new Date(d.getFullYear(),d.getMonth()+1,1)
      const items=filtered.filter(q=>{const t=new Date(q.created_at);return t>=d&&t<next})
      return {label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),count:items.length,value:items.reduce((s,q)=>s+Number(q.estimated_total||0),0)}
    })
  },[filtered])
  const plans=useMemo(()=>{
    const map={}
    filtered.forEach(q=>{const name=q.items?.plan?.name||'Sem plano identificado';map[name]=(map[name]||0)+1})
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6)
  },[filtered])
  const categoryMix=useMemo(()=>{const map={};filtered.forEach(q=>{const groups=[...(q.items?.drinks||[]),...(q.items?.services||[]),...(q.items?.structures||[]),...(q.items?.professionals||[])];groups.forEach(x=>{const key=x.category||'Sem categoria';map[key]=(map[key]||0)+1})});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8)},[filtered])
  const topItems=useMemo(()=>{const map={};filtered.forEach(q=>{const groups=[...(q.items?.drinks||[]),...(q.items?.services||[]),...(q.items?.structures||[]),...(q.items?.professionals||[])];groups.forEach(x=>{const key=x.name||'Item';map[key]=(map[key]||0)+1})});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8)},[filtered])
  const locations=useMemo(()=>{const map={};filtered.forEach(q=>{const key=String(q.event_location||'Local não informado').trim();map[key]=(map[key]||0)+1});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6)},[filtered])
  const drinkCostStats=useMemo(()=>{const rows=drinkCosts.map(x=>{const cost=Number(x.ingredient_cost||0)+Number(x.garnish_cost||0)+Number(x.packaging_cost||0)+Number(x.other_cost||0);const price=Number(x.reference_price||0);return {...x,cost,cmv:price>0?cost/price*100:null}});const valid=rows.filter(x=>x.cmv!==null);return {count:rows.length,avgCost:rows.length?rows.reduce((s,x)=>s+x.cost,0)/rows.length:0,avgCmv:valid.length?valid.reduce((s,x)=>s+x.cmv,0)/valid.length:null,high:valid.filter(x=>x.cmv>35).length}},[drinkCosts])
  const maxMonth=Math.max(1,...monthly.map(x=>x.count)), maxPlan=Math.max(1,...plans.map(x=>x[1]))
  const maxValue=Math.max(1,...monthly.map(x=>x.value))
  return <section className="be-analytics">
    <div className="be-analytics-toolbar"><div><p>Indicadores calculados a partir dos orçamentos registrados.</p><span>{filtered.length} registros no período selecionado</span></div><div className="be-analytics-actions"><select value={period} onChange={e=>setPeriod(e.target.value)} aria-label="Período"><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o período</option></select><button className="be-secondary" onClick={load} disabled={loading}><RefreshCw size={15}/> Atualizar</button><button className="be-primary" onClick={()=>downloadCsv(filtered)} disabled={!filtered.length}><Download size={15}/> Resumo CSV</button><button className="be-secondary" onClick={()=>downloadDetailedCsv(filtered)} disabled={!filtered.length}><Download size={15}/> Itens detalhados</button></div></div>
    {error&&<div className="be-error be-catalog-message">{error}</div>}
    {loading?<div className="be-empty">Calculando indicadores...</div>:<>
      <div className="be-metric-grid">
        <article className="be-metric"><span><ClipboardList/> Orçamentos recebidos</span><strong>{stats.count}</strong><small>{stats.pending} aguardando análise</small></article>
        <article className="be-metric"><span><Wallet/> Valor estimado total</span><strong>{money(stats.total)}</strong><small>Ticket médio: {money(stats.avg)}</small></article>
        <article className="be-metric"><span><TrendingUp/> Valor aprovado</span><strong>{money(stats.approvedValue)}</strong><small>{stats.approved} aprovados ou concluídos</small></article>
        <article className="be-metric"><span><Target/> Conversão</span><strong>{stats.conversion.toFixed(1).replace('.',',')}%</strong><small>Pedidos aprovados / recebidos</small></article>
        <article className="be-metric"><span><Users/> Público potencial</span><strong>{stats.guests.toLocaleString('pt-BR')}</strong><small>Convidados somados nos pedidos</small></article>
        <article className="be-metric"><span><CalendarDays/> Horas contratadas</span><strong>{stats.hours.toLocaleString('pt-BR')}h</strong><small>{stats.open} oportunidades em aberto</small></article>
        <article className="be-metric"><span><Wallet/> Custo médio por drink</span><strong>{money(drinkCostStats.avgCost)}</strong><small>{drinkCostStats.count} receitas com dados internos de custo</small></article>
        <article className="be-metric"><span><Target/> CMV médio cadastrado</span><strong>{drinkCostStats.avgCmv===null?'—':drinkCostStats.avgCmv.toFixed(1).replace('.',',')+'%'}</strong><small>{drinkCostStats.high} receitas acima de 35% de CMV</small></article>
      </div>
      <div className="be-analytics-grid">
        <article className="be-chart-card"><header><div><h3>Volume de orçamentos</h3><p>Quantidade de solicitações por mês</p></div><span>6 meses</span></header><div className="be-bar-chart">{monthly.map(m=><div className="be-bar-column" key={m.label}><b>{m.count}</b><div className="be-bar-track"><i style={{height:(m.count/maxMonth*100)+'%'}}/></div><small>{m.label}</small></div>)}</div></article>
        <article className="be-chart-card"><header><div><h3>Valor estimado por mês</h3><p>Soma dos valores enviados pelos clientes</p></div></header><div className="be-value-chart">{monthly.map(m=><div key={m.label}><span>{m.label}</span><i><b style={{width:(m.value/maxValue*100)+'%'}}/></i><strong>{money(m.value)}</strong></div>)}</div></article>
        <article className="be-chart-card"><header><div><h3>Funil comercial</h3><p>Distribuição dos pedidos por etapa</p></div></header><div className="be-funnel">{Object.entries(statusNames).map(([key,label])=>{const n=filtered.filter(q=>q.status===key).length;return <div key={key}><span>{label}</span><i><b style={{width:(n/Math.max(1,stats.count)*100)+'%'}}/></i><strong>{n}</strong></div>})}</div></article>
        <article className="be-chart-card"><header><div><h3>Planos mais procurados</h3><p>Preferência dos clientes no período</p></div></header>{plans.length?<div className="be-funnel">{plans.map(([name,n])=><div key={name}><span>{name}</span><i><b style={{width:(n/maxPlan*100)+'%'}}/></i><strong>{n}</strong></div>)}</div>:<div className="be-empty">Ainda não há dados suficientes.</div>}</article>
        <article className="be-chart-card"><header><div><h3>Mix de categorias contratadas</h3><p>Itens registrados nos pedidos do período</p></div></header>{categoryMix.length?<div className="be-funnel">{categoryMix.map(([name,n])=><div key={name}><span>{name}</span><i><b style={{width:(n/Math.max(1,categoryMix[0][1])*100)+'%'}}/></i><strong>{n}</strong></div>)}</div>:<div className="be-empty">As categorias aparecerão conforme novos pedidos forem enviados.</div>}</article>
        <article className="be-chart-card"><header><div><h3>Itens mais selecionados</h3><p>Popularidade nos orçamentos recebidos</p></div></header>{topItems.length?<div className="be-funnel">{topItems.map(([name,n])=><div key={name}><span>{name}</span><i><b style={{width:(n/Math.max(1,topItems[0][1])*100)+'%'}}/></i><strong>{n}</strong></div>)}</div>:<div className="be-empty">Ainda não há itens suficientes.</div>}</article>
        <article className="be-chart-card"><header><div><h3>Locais mais solicitados</h3><p>Origem dos eventos nos orçamentos</p></div></header>{locations.length?<div className="be-funnel">{locations.map(([name,n])=><div key={name}><span>{name}</span><i><b style={{width:(n/Math.max(1,locations[0][1])*100)+'%'}}/></i><strong>{n}</strong></div>)}</div>:<div className="be-empty">Os locais aparecerão conforme os pedidos forem recebidos.</div>}</article>
      </div>
      <div className="be-insight-strip"><b>Leitura comercial</b><span>{stats.count===0?'Ainda não existem orçamentos neste período. Divulgue a ferramenta para começar a coletar dados.':stats.open+' oportunidades estão em aberto, somando '+money(stats.pipeline)+'. '+(stats.rejected?'Há '+stats.rejected+' pedidos recusados que podem ajudar a identificar objeções.':'Acompanhe o andamento dos pedidos para medir a conversão.')+' CMV médio cadastrado: '+(drinkCostStats.avgCmv===null?'sem base de preço':drinkCostStats.avgCmv.toFixed(1)+'%')+'. Revise receitas acima de 35% para avaliar porções, fornecedores e preço de referência.'}</span></div>
    </>}
  </section>
}
