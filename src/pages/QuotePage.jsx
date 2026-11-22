import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Minus, Plus, ShoppingBag, Martini, Package, UserRound, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const categoryLabels = {classico:'Clássicos',autoral:'Autorais',refrescante:'Refrescantes',sem_alcool:'Sem álcool',especial:'Especiais',social:'Eventos sociais',casamento:'Casamentos',corporativo:'Corporativo',premium:'Premium',personalizado:'Personalizado',bar:'Bar e coquetelaria',atendimento:'Atendimento',consultoria:'Consultoria',workshop:'Workshops',coffee_break:'Coffee break',operacional:'Operação',balcoes:'Balcões e bares',mobiliario:'Mobiliário',iluminacao:'Iluminação',equipamentos:'Equipamentos',decoracao:'Decoração',efeitos:'Efeitos especiais',lazer:'Lazer e entretenimento',bartender:'Bartenders',chefe_bar:'Chefes de bar',garcom:'Garçons',barback:'Barbacks',coordenacao:'Coordenação',recepcao:'Recepção',sazonal:'Campanhas sazonais',combo:'Combos',fidelidade:'Relacionamento',geral:'Geral'}
const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const serviceCost = (x, h, g) => x.pricing_model === 'hourly' ? Number(x.hourly_price || 0) * h : x.pricing_model === 'per_guest' ? Number(x.guest_price || 0) * g : x.pricing_model === 'hour_guest' ? Number(x.hourly_price || 0) * h + Number(x.guest_price || 0) * g : Number(x.base_price || 0)
const structureCost = (x, h) => x.pricing_model === 'hourly' ? Number(x.hourly_price || 0) * h : Number(x.base_price || 0)
const professionalCost = (x, h) => Number(x.base_price || 0) + Number(x.hourly_price || 0) * h

function ChoiceCard({ item, selected, onClick, meta }) {
  return <button type="button" className={'be-choice-card' + (selected ? ' selected' : '')} onClick={onClick}>
    {item.image_url ? <img src={item.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none' }}/> : <span className="be-choice-placeholder"><Martini size={22}/></span>}
    <i>{selected ? <Check size={15}/> : <Plus size={15}/>}</i><span className="be-choice-card-copy"><strong>{item.name}</strong>{meta && <span className="be-choice-card-meta">{meta}</span>}{item.description && <small>{item.description}</small>}</span>
  </button>
}


function ChoicePicker({items,selectedIds,onToggle,metaFor}) {
  const [category,setCategory]=useState('all')
  const [search,setSearch]=useState('')
  const categories=[...new Set(items.map(x=>x.category).filter(Boolean))].sort()
  const visible=items.filter(x=>(category==='all'||x.category===category)&&[x.name,x.description,x.category,x.profession].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))))
  return <div className="be-picker">
    <div className="be-picker-tools"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar item..." aria-label="Buscar item"/><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filtrar por categoria"><option value="all">Todas as categorias</option>{categories.map(x=><option key={x} value={x}>{categoryLabels[x]||x}</option>)}</select></div>
    {visible.length?<div className="be-quote-choice-grid">{visible.map(x=><ChoiceCard key={x.id} item={x} selected={selectedIds.includes(x.id)} onClick={()=>onToggle(x.id)} meta={<>{x.category&&<span className="be-category-chip">{categoryLabels[x.category]||x.category}</span>} {metaFor(x)}</>}/>)}</div>:<div className="be-quote-empty">Nenhum item corresponde a esse filtro.</div>}
  </div>
}

export default function QuotePage() {
  const [plans,setPlans] = useState([]), [services,setServices] = useState([]), [structures,setStructures] = useState([]), [professionals,setProfessionals] = useState([])
  const [planId,setPlanId] = useState(''), [drinkIds,setDrinkIds] = useState([]), [serviceIds,setServiceIds] = useState([]), [structureIds,setStructureIds] = useState([]), [professionalIds,setProfessionalIds] = useState([])
  const [hours,setHours] = useState(4), [guests,setGuests] = useState(50), [step,setStep] = useState(1), [cartOpen,setCartOpen] = useState(false)
  const [loading,setLoading] = useState(true), [sending,setSending] = useState(false), [error,setError] = useState(''), [success,setSuccess] = useState('')
  const [customer,setCustomer] = useState({name:'',phone:'',email:'',event_date:'',event_location:'',notes:''})

  useEffect(() => {
    let alive = true
    async function load() {
      const results = await Promise.all([
        supabase.from('be_plans').select('*, be_plan_drinks(drink:be_drinks(id,name,description,category,image_url,alcohol,ingredients))').eq('active',true).order('name'),
        supabase.from('be_services').select('*').eq('active',true).order('name'),
        supabase.from('be_structures').select('*').eq('active',true).order('name'),
        supabase.from('be_professionals').select('*').eq('active',true).order('name')
      ])
      if (!alive) return
      const failed = results.find(x => x.error)
      if (failed) setError('Não foi possível carregar o catálogo: ' + failed.error.message)
      else { setPlans(results[0].data || []); setServices(results[1].data || []); setStructures(results[2].data || []); setProfessionals(results[3].data || []) }
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const plan = plans.find(x => x.id === planId) || null
  const drinks = useMemo(() => (plan?.be_plan_drinks || []).map(x => x.drink).filter(Boolean), [plan])
  const choiceLimit = Number(plan?.drink_choice_limit || 0)
  const selectedServices = services.filter(x => serviceIds.includes(x.id))
  const selectedStructures = structures.filter(x => structureIds.includes(x.id))
  const selectedProfessionals = professionals.filter(x => professionalIds.includes(x.id))
  const extraHours = Math.max(0, hours - Number(plan?.included_hours || 0))
  const planCost = plan ? Number(plan.base_price || 0) + Number(plan.guest_price || 0) * guests + Number(plan.extra_hour_price || 0) * extraHours : 0
  const serviceTotal = selectedServices.reduce((s,x) => s + serviceCost(x,hours,guests),0)
  const structureTotal = selectedStructures.reduce((s,x) => s + structureCost(x,hours),0)
  const professionalTotal = selectedProfessionals.reduce((s,x) => s + professionalCost(x,hours),0)
  const total = planCost + serviceTotal + structureTotal + professionalTotal
  const drinkComplete = !choiceLimit || drinkIds.length === choiceLimit
  const count = (plan ? 1 : 0) + serviceIds.length + structureIds.length + professionalIds.length
  const updateCustomer = (key,value) => setCustomer(x => ({...x,[key]:value}))
  const toggle = (setter,id) => setter(old => old.includes(id) ? old.filter(v => v !== id) : [...old,id])

  function selectPlan(x) { setPlanId(x.id); setDrinkIds([]); setHours(Math.max(1,Number(x.included_hours || 4))) }
  function selectDrink(id) { setDrinkIds(old => old.includes(id) ? old.filter(x => x !== id) : choiceLimit && old.length >= choiceLimit ? old : [...old,id]) }

  async function submit(event) {
    event.preventDefault(); setSending(true); setError('')
    if (!plan || !drinkComplete) { setError('Selecione o plano e complete a escolha dos drinks.'); setSending(false); return }
    const snapshot = {
      plan:{id:plan.id,name:plan.name,category:plan.category,base_price:plan.base_price,guest_price:plan.guest_price,included_hours:plan.included_hours,extra_hour_price:plan.extra_hour_price},
      drinks:drinks.filter(x => drinkIds.includes(x.id)).map(({id,name,category}) => ({id,name,category})),
      services:selectedServices.map(x => ({id:x.id,name:x.name,category:x.category,estimated_price:serviceCost(x,hours,guests)})),
      structures:selectedStructures.map(x => ({id:x.id,name:x.name,category:x.category,estimated_price:structureCost(x,hours)})),
      professionals:selectedProfessionals.map(x => ({id:x.id,name:x.name,category:x.category,profession:x.profession,estimated_price:professionalCost(x,hours)})),
      guests,hours,calculation:{plan:planCost,services:serviceTotal,structures:structureTotal,professionals:professionalTotal}
    }
    const {error} = await supabase.from('be_quotes').insert({
      customer_name:customer.name.trim(),customer_phone:customer.phone.trim(),customer_email:customer.email.trim() || null,
      event_date:customer.event_date || null,event_location:customer.event_location.trim() || null,
      guest_count:guests,hours,items:snapshot,estimated_total:Number(total.toFixed(2)),
      notes:customer.notes.trim() || null,status:'pending'
    })
    if (error) setError('Não foi possível enviar: ' + error.message)
    else { setSuccess('Solicitação enviada! Nossa equipe analisará a disponibilidade e entrará em contato para confirmar a proposta.'); setCartOpen(false) }
    setSending(false)
  }

  if (loading) return <main className="be-quote-app"><div className="be-quote-loading">Preparando seu orçamento...</div></main>

  const itemLines = [
    ...selectedServices.map(x => ({id:x.id,name:x.name,sub:'Serviço adicional',price:serviceCost(x,hours,guests)})),
    ...selectedStructures.map(x => ({id:x.id,name:x.name,sub:'Estrutura',price:structureCost(x,hours)})),
    ...selectedProfessionals.map(x => ({id:x.id,name:x.name,sub:x.profession,price:professionalCost(x,hours)}))
  ]

  return <main className="be-quote-app">
    <header className="be-quote-topbar">
      <a href="/" className="be-quote-back"><ArrowLeft size={18}/> Portfólio</a>
      <a href="/" className="be-quote-brand"><span><Martini size={20}/></span><b>BAR EXPERIENCE<small>MONTE SEU EVENTO</small></b></a>
      <button className="be-quote-cart-trigger" onClick={() => setCartOpen(true)}><ShoppingBag size={18}/> Carrinho <b>{count}</b></button>
    </header>
    <div className="be-quote-shell">
      <section className="be-quote-heading"><div><span className="be-quote-eyebrow">ORÇAMENTO PERSONALIZADO</span><h1>Monte seu <em>bar.</em></h1><p>Escolha o cardápio, os serviços e a estrutura para seu evento. O valor é estimado e a contratação depende da confirmação da equipe.</p></div><div className="be-quote-heading-note"><Clock3 size={19}/><span><b>Você escolhe o tempo</b><small>Defina a duração do atendimento</small></span></div></section>
      {error && <div className="be-quote-alert">{error}</div>}
      {success && <div className="be-quote-success"><Check size={20}/><div><b>Solicitação recebida</b><p>{success}</p><a href="/">Voltar ao portfólio</a></div></div>}
      {!success && <div className="be-quote-workspace">
        <div className="be-quote-main">
          <nav className="be-quote-steps">{['Plano','Complementos','Evento'].map((label,i) => <button key={label} className={step === i+1 ? 'active' : step > i+1 ? 'done' : ''} onClick={() => {if(i===0 || (plan && drinkComplete && i<step+1)) setStep(i+1)}}><span>{step>i+1 ? <Check size={14}/> : i+1}</span>{label}</button>)}</nav>
          {step === 1 && <section className="be-quote-section">
            <div className="be-quote-section-title"><div><span>ETAPA 01</span><h2>Escolha seu plano</h2><p>Selecione uma proposta para começar a personalizar o cardápio.</p></div></div>
            {!plans.length ? <div className="be-quote-empty">Os planos ainda não estão disponíveis. Entre em contato com nossa equipe.</div> : <div className="be-quote-plan-grid">{plans.map(x => <button key={x.id} className={'be-quote-plan-card'+(planId===x.id?' selected':'')} onClick={() => selectPlan(x)}>
              {x.image_url && <img src={x.image_url} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}<i>{planId===x.id?<Check size={15}/>:<Plus size={15}/>}</i><span><small>{x.featured?'DESTAQUE':'BAR EXPERIENCE'}</small>{x.category&&<span className="be-category-chip">{categoryLabels[x.category]||x.category}</span>}<b>{x.name}</b><span>{x.description}</span><strong>{money(x.base_price)} <small>valor-base</small></strong><em>{(x.be_plan_drinks||[]).length} drinks disponíveis · escolha {x.drink_choice_limit}</em></span>
            </button>)}</div>}
            {plan && <div className="be-quote-plan-config"><div className="be-quote-section-title"><div><span>PERSONALIZE O CARDÁPIO</span><h2>Escolha seus drinks</h2><p>Selecione {choiceLimit || 'quantos desejar'} entre as {drinks.length} opções disponíveis.</p></div><b className={drinkComplete?'be-quote-count complete':'be-quote-count'}>{drinkIds.length}/{choiceLimit||'∞'}</b></div>
              <ChoicePicker items={drinks} selectedIds={drinkIds} onToggle={selectDrink} metaFor={x=>(x.alcohol?'18+':'Sem álcool')}/>
              {!drinks.length && <div className="be-quote-empty">Este plano ainda não possui drinks associados. Configure o cardápio no painel administrativo.</div>}
              <div className="be-quote-next-row"><span>{drinkComplete?'Cardápio selecionado.':'Escolha mais '+(choiceLimit-drinkIds.length)+' drink(s).'}</span><button className="be-quote-primary" disabled={!drinkComplete||!drinks.length} onClick={()=>setStep(2)}>Continuar <ArrowRight size={16}/></button></div>
            </div>}
          </section>}
          {step === 2 && <section className="be-quote-section">
            <div className="be-quote-section-title"><div><span>ETAPA 02</span><h2>Complete sua experiência</h2><p>Adicione horas, serviços, estruturas e profissionais ao orçamento.</p></div></div>
            <div className="be-quote-control-card"><div><b>Duração do serviço</b><small>{plan?.included_hours||4} horas incluídas · hora adicional {money(plan?.extra_hour_price)}</small></div><div className="be-quote-stepper"><button onClick={()=>setHours(x=>Math.max(1,x-1))}><Minus size={15}/></button><b>{hours}h</b><button onClick={()=>setHours(x=>Math.min(24,x+1))}><Plus size={15}/></button></div></div>
            <div className="be-quote-control-card"><div><b>Quantidade de convidados</b><small>Estimativa para calcular o orçamento.</small></div><div className="be-quote-stepper"><button onClick={()=>setGuests(x=>Math.max(1,x-5))}><Minus size={15}/></button><b>{guests}</b><button onClick={()=>setGuests(x=>Math.min(5000,x+5))}><Plus size={15}/></button></div></div>
            <div className="be-quote-catalog-group"><div className="be-quote-section-title"><div><span><Martini size={14}/> SERVIÇOS</span><h2>Serviços adicionais</h2></div></div><ChoicePicker items={services} selectedIds={serviceIds} onToggle={id=>toggle(setServiceIds,id)} metaFor={x=>money(serviceCost(x,hours,guests))}/>{!services.length&&<div className="be-quote-empty">Nenhum serviço adicional disponível.</div>}</div>
            <div className="be-quote-catalog-group"><div className="be-quote-section-title"><div><span><Package size={14}/> ESTRUTURAS</span><h2>Estruturas para o evento</h2></div></div><ChoicePicker items={structures} selectedIds={structureIds} onToggle={id=>toggle(setStructureIds,id)} metaFor={x=>money(structureCost(x,hours))}/>{!structures.length&&<div className="be-quote-empty">Nenhuma estrutura disponível.</div>}</div>
            <div className="be-quote-catalog-group"><div className="be-quote-section-title"><div><span><UserRound size={14}/> EQUIPE</span><h2>Profissionais</h2></div></div><ChoicePicker items={professionals} selectedIds={professionalIds} onToggle={id=>toggle(setProfessionalIds,id)} metaFor={x=>(x.profession||'Profissional')+' · '+money(professionalCost(x,hours))}/>{!professionals.length&&<div className="be-quote-empty">Nenhum profissional adicional disponível.</div>}</div>
            <div className="be-quote-next-row"><button className="be-quote-secondary" onClick={()=>setStep(1)}>Voltar</button><button className="be-quote-primary" onClick={()=>setStep(3)}>Continuar <ArrowRight size={16}/></button></div>
          </section>}
          {step === 3 && <section className="be-quote-section"><div className="be-quote-section-title"><div><span>ETAPA 03</span><h2>Dados do evento</h2><p>Informe como podemos entrar em contato para revisar sua proposta.</p></div></div>
            <form className="be-quote-customer-form" onSubmit={submit}>
              <label>Nome completo<input required value={customer.name} onChange={e=>updateCustomer('name',e.target.value)} placeholder="Seu nome"/></label>
              <label>WhatsApp / telefone<input required value={customer.phone} onChange={e=>updateCustomer('phone',e.target.value)} placeholder="(00) 00000-0000"/></label>
              <label>E-mail (opcional)<input type="email" value={customer.email} onChange={e=>updateCustomer('email',e.target.value)} placeholder="voce@email.com"/></label>
              <label>Data do evento<input type="date" min={new Date().toISOString().slice(0,10)} value={customer.event_date} onChange={e=>updateCustomer('event_date',e.target.value)}/></label>
              <label className="wide">Local do evento<input value={customer.event_location} onChange={e=>updateCustomer('event_location',e.target.value)} placeholder="Cidade, espaço ou endereço"/></label>
              <label className="wide">Observações<textarea rows="3" value={customer.notes} onChange={e=>updateCustomer('notes',e.target.value)} placeholder="Detalhes importantes sobre o evento."/></label>
              <div className="be-quote-submit-note"><Check size={16}/> O envio não confirma a contratação. A equipe analisará a disponibilidade e retornará com a proposta final.</div>
              <div className="be-quote-next-row"><button type="button" className="be-quote-secondary" onClick={()=>setStep(2)}>Voltar</button><button className="be-quote-primary" type="submit" disabled={sending}>{sending?'Enviando...':'Enviar para análise'} <Send size={16}/></button></div>
            </form>
          </section>}
        </div>
        <aside className="be-quote-summary"><div className="be-quote-summary-head"><span>RESUMO DO ORÇAMENTO</span><ShoppingBag size={18}/></div>
          {plan?<div className="be-quote-summary-block"><b>{plan.name}</b><small>{drinkIds.length} drinks · {guests} convidados · {hours} horas</small><div><span>Plano e duração</span><b>{money(planCost)}</b></div></div>:<p>Escolha um plano para iniciar.</p>}
          {itemLines.map(x=><div className="be-quote-summary-block" key={x.id}><div><span>{x.name}</span><b>{money(x.price)}</b></div></div>)}
          <div className="be-quote-summary-total"><span>Estimativa</span><strong>{money(total)}</strong></div><small className="be-quote-summary-foot">Valor sujeito à confirmação de disponibilidade e aprovação da equipe.</small>
          <button className="be-quote-primary be-summary-button" disabled={!plan||!drinkComplete} onClick={()=>setStep(3)}>Continuar <ArrowRight size={16}/></button>
        </aside>
      </div>}
    </div>
    <button className="be-quote-floating-cart" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/><span>Ver carrinho</span><b>{money(total)}</b></button>
    {cartOpen&&<div className="be-cart-overlay" onClick={()=>setCartOpen(false)}><section className="be-cart-drawer" onClick={e=>e.stopPropagation()}>
      <header><div><small>SEU EVENTO</small><h2>Meu carrinho</h2></div><button onClick={()=>setCartOpen(false)}><X size={20}/></button></header>
      <div className="be-cart-content">{plan&&<div className="be-cart-line"><span><b>Plano {plan.name}</b><small>{drinkIds.length} drinks · {guests} convidados · {hours}h</small></span><strong>{money(planCost)}</strong></div>}{itemLines.map(x=><div className="be-cart-line" key={x.id}><span><b>{x.name}</b><small>{x.sub}</small></span><strong>{money(x.price)}</strong></div>)}{!plan&&!itemLines.length&&<p>Seu carrinho está vazio.</p>}</div>
      <footer><div><span>Valor estimado</span><b>{money(total)}</b></div><button className="be-quote-primary" onClick={()=>{setCartOpen(false);setStep(plan?3:1)}}>Finalizar orçamento <ArrowRight size={16}/></button></footer>
    </section></div>}
  </main>
}
