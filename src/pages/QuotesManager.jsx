import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Search, Eye, X, Save, Download, GripVertical } from 'lucide-react'

const stages=[
  {id:'pending',label:'Novos pedidos'},
  {id:'contacted',label:'Em contato'},
  {id:'negotiating',label:'Negociação'},
  {id:'approved',label:'Aprovados'},
  {id:'completed',label:'Concluídos'},
  {id:'rejected',label:'Recusados'}
]
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const dateTime=v=>v?new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—'
const statusLabel=id=>stages.find(x=>x.id===id)?.label||id

export default function QuotesManager(){
  const [quotes,setQuotes]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
  const [search,setSearch]=useState(''),[selected,setSelected]=useState(null),[adminNotes,setAdminNotes]=useState(''),[saving,setSaving]=useState(false),[notice,setNotice]=useState('')
  const load=useCallback(async()=>{
    setLoading(true);setError('')
    const {data,error:err}=await supabase.from('be_quotes').select('*').order('created_at',{ascending:false})
    if(err)setError('Não foi possível carregar os orçamentos: '+err.message)
    else setQuotes(data||[])
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])
  const filtered=useMemo(()=>{
    const term=search.trim().toLocaleLowerCase('pt-BR')
    if(!term)return quotes
    return quotes.filter(q=>[q.customer_name,q.customer_phone,q.customer_email,q.event_location,q.items?.plan?.name].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(term)))
  },[quotes,search])
  function openDetails(q){setSelected(q);setAdminNotes(q.admin_notes||'');setNotice('')}
  async function changeStatus(q,status){
    setError('')
    const {data,error:err}=await supabase.from('be_quotes').update({status}).eq('id',q.id).select().single()
    if(err){setError('Não foi possível atualizar o status: '+err.message);return}
    setQuotes(old=>old.map(x=>x.id===q.id?data:x))
    if(selected?.id===q.id)setSelected(data)
  }
  async function saveNotes(){
    if(!selected)return
    setSaving(true);setError('');setNotice('')
    const {data,error:err}=await supabase.from('be_quotes').update({admin_notes:adminNotes}).eq('id',selected.id).select().single()
    if(err)setError('Não foi possível salvar as observações: '+err.message)
    else{setQuotes(old=>old.map(x=>x.id===selected.id?data:x));setSelected(data);setNotice('Observações administrativas salvas.')}
    setSaving(false)
  }
  function exportCsv(){
    const rows=[['Data','Cliente','Telefone','E-mail','Data evento','Local','Convidados','Horas','Plano','Valor','Status','Observações']]
    filtered.forEach(q=>rows.push([dateTime(q.created_at),q.customer_name,q.customer_phone,q.customer_email,q.event_date,q.event_location,q.guest_count,q.hours,q.items?.plan?.name,q.estimated_total,statusLabel(q.status),q.notes].map(v=>String(v??'').replace(/;/g,','))))
    const blob=new Blob(['\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n')],{type:'text/csv;charset=utf-8;'})
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='orcamentos-bar-experience.csv';a.click();URL.revokeObjectURL(url)
  }
  function card(q){
    const items=q.items||{}, names=[...(items.drinks||[]).map(x=>x.name),...(items.services||[]).map(x=>x.name),...(items.structures||[]).map(x=>x.name),...(items.professionals||[]).map(x=>x.name)]
    return <article className="be-kanban-card" key={q.id} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',q.id)} onClick={()=>openDetails(q)}>
      <div className="be-kanban-card-top"><small>#{q.id.slice(0,8)}</small><GripVertical size={15}/></div><b>{q.customer_name}</b><span>{q.items?.plan?.name||'Plano não informado'} · {q.guest_count} convidados</span><strong>{money(q.estimated_total)}</strong><small>{q.event_date?new Date(q.event_date+'T12:00:00').toLocaleDateString('pt-BR'):'Data não definida'} · {q.hours}h</small><small>{names.slice(0,3).join(', ')}{names.length>3?' +'+(names.length-3):''}</small><button type="button" onClick={e=>{e.stopPropagation();openDetails(q)}}><Eye size={14}/> Detalhes</button>
    </article>
  }
  return <section className="be-quotes-manager">
    <div className="be-quotes-toolbar"><div><p>Acompanhe cada solicitação desde a entrada até a conclusão.</p><span>{filtered.length} de {quotes.length} orçamentos</span></div><div className="be-quotes-tools"><label><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, telefone ou plano"/></label><button className="be-secondary" onClick={load} disabled={loading}><RefreshCw size={15}/> Atualizar</button><button className="be-primary" onClick={exportCsv} disabled={!filtered.length}><Download size={15}/> Exportar</button></div></div>
    {error&&<div className="be-error be-catalog-message">{error}</div>}{notice&&<div className="be-success">{notice}</div>}
    {loading?<div className="be-empty">Carregando orçamentos...</div>:!quotes.length?<div className="be-empty">Nenhum orçamento recebido ainda. Quando um cliente enviar uma solicitação, ela aparecerá aqui.</div>:<div className="be-kanban">{stages.map(stage=>{const list=filtered.filter(q=>(q.status||'pending')===stage.id);return <section className="be-kanban-column" key={stage.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain'),q=quotes.find(x=>x.id===id);if(q&&q.status!==stage.id)changeStatus(q,stage.id)}}><header><b>{stage.label}</b><span>{list.length}</span></header><div className="be-kanban-list">{list.map(card)}</div></section>})}</div>}
    {selected&&<div className="be-quote-detail-backdrop" onClick={()=>setSelected(null)}><section className="be-quote-detail" onClick={e=>e.stopPropagation()}><header><div><small>DETALHES DO ORÇAMENTO</small><h2>{selected.customer_name}</h2><span>Recebido em {dateTime(selected.created_at)}</span></div><button onClick={()=>setSelected(null)}><X/></button></header>
      <div className="be-quote-detail-content"><div className="be-quote-detail-grid"><div><small>Telefone</small><b>{selected.customer_phone}</b></div><div><small>E-mail</small><b>{selected.customer_email||'Não informado'}</b></div><div><small>Data do evento</small><b>{selected.event_date?new Date(selected.event_date+'T12:00:00').toLocaleDateString('pt-BR'):'Não definida'}</b></div><div><small>Local</small><b>{selected.event_location||'Não informado'}</b></div><div><small>Convidados</small><b>{selected.guest_count}</b></div><div><small>Duração</small><b>{selected.hours} horas</b></div></div>
      <div className="be-quote-detail-total"><span>Valor estimado</span><strong>{money(selected.estimated_total)}</strong></div>
      <h3>Itens escolhidos</h3><div className="be-quote-detail-items"><b>Plano: {selected.items?.plan?.name||'—'}</b>{(selected.items?.drinks||[]).map(x=><span key={x.id}>Drink · {x.name}</span>)}{(selected.items?.services||[]).map(x=><span key={x.id}>Serviço · {x.name} — {money(x.estimated_price)}</span>)}{(selected.items?.structures||[]).map(x=><span key={x.id}>Estrutura · {x.name} — {money(x.estimated_price)}</span>)}{(selected.items?.professionals||[]).map(x=><span key={x.id}>Profissional · {x.name} — {money(x.estimated_price)}</span>)}</div>
      {selected.notes&&<><h3>Observações do cliente</h3><p>{selected.notes}</p></>}
      <label className="be-admin-notes-label">Observações internas<textarea rows="3" value={adminNotes} onChange={e=>setAdminNotes(e.target.value)} placeholder="Anotações da equipe, negociação, disponibilidade..."/></label>
      <button className="be-primary be-save-notes" onClick={saveNotes} disabled={saving}><Save size={15}/>{saving?'Salvando...':'Salvar observações'}</button>
      <label className="be-admin-notes-label">Etapa do atendimento<select value={selected.status||'pending'} onChange={e=>changeStatus(selected,e.target.value)}>{stages.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
      </div></section></div>}
  </section>
}
