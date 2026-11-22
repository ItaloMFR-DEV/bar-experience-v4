import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Save, RefreshCw, Martini } from 'lucide-react'

const empty = { slug: '', name: '', category: 'social', description: '', image_url: '', base_price: '0', guest_price: '0', included_hours: '4', extra_hour_price: '0', drink_option_limit: '10', drink_choice_limit: '6', featured: false, active: true }
const categoryLabels = {social:'Eventos sociais',casamento:'Casamentos',corporativo:'Corporativo',premium:'Premium',autoral:'Autoral',personalizado:'Personalizado'}
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PlanManager() {
  const [plans, setPlans] = useState([])
  const [drinks, setDrinks] = useState([])
  const [selected, setSelected] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const [p, d] = await Promise.all([
      supabase.from('be_plans').select('*, be_plan_drinks(drink_id)').order('name'),
      supabase.from('be_drinks').select('id,name,category,active').order('name')
    ])
    if (p.error || d.error) setError('Falha ao carregar planos ou drinks: ' + (p.error || d.error).message)
    else {
      setPlans(p.data || [])
      setDrinks(d.data || [])
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function create() {
    setEditing(null); setForm(empty); setSelected([])
    setOpen(true); setError(''); setNotice('')
  }

  function edit(plan) {
    setEditing(plan.id)
    setForm(Object.fromEntries(Object.keys(empty).map(key => [key, plan[key] === null || plan[key] === undefined ? empty[key] : String(plan[key])])))
    setForm(current => ({ ...current, featured: Boolean(plan.featured), active: Boolean(plan.active) }))
    setSelected((plan.be_plan_drinks || []).map(row => row.drink_id))
    setOpen(true); setError(''); setNotice('')
  }

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  async function save(event) {
    event.preventDefault()
    if (Number(form.drink_choice_limit) > Number(form.drink_option_limit) && Number(form.drink_option_limit) > 0) {
      setError('O limite de escolhas não pode ser maior que a quantidade de opções disponíveis.')
      return
    }
    if (selected.length !== Number(form.drink_option_limit) && Number(form.drink_option_limit) > 0) {
      setError('Associe exatamente ' + form.drink_option_limit + ' drinks a este plano para definir a quantidade de opções disponíveis.')
      return
    }
    setSaving(true); setError('')
    const payload = {
      slug: form.slug.trim() || form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: form.name.trim(), category: form.category, description: form.description, image_url: form.image_url || null,
      base_price: Number(form.base_price || 0), guest_price: Number(form.guest_price || 0),
      included_hours: Number(form.included_hours || 4), extra_hour_price: Number(form.extra_hour_price || 0),
      drink_option_limit: Number(form.drink_option_limit || 0), drink_choice_limit: Number(form.drink_choice_limit || 0),
      featured: Boolean(form.featured), active: Boolean(form.active)
    }
    const result = editing
      ? await supabase.from('be_plans').update(payload).eq('id', editing).select('id').single()
      : await supabase.from('be_plans').insert(payload).select('id').single()
    if (result.error) { setError('Não foi possível salvar o plano: ' + result.error.message); setSaving(false); return }
    const planId = editing || result.data.id
    const { error: clearError } = await supabase.from('be_plan_drinks').delete().eq('plan_id', planId)
    if (clearError) { setError('Plano salvo, mas não foi possível atualizar a lista de drinks: ' + clearError.message); setSaving(false); return }
    if (selected.length) {
      const { error: linkError } = await supabase.from('be_plan_drinks').insert(selected.map((drink_id, index) => ({ plan_id: planId, drink_id, sort_order: index })))
      if (linkError) { setError('Plano salvo, mas houve erro ao associar drinks: ' + linkError.message); setSaving(false); return }
    }
    setNotice('Plano salvo com sucesso.'); setOpen(false); await load(); setSaving(false)
  }

  async function remove(plan) {
    if (!window.confirm('Excluir o plano ' + plan.name + '?')) return
    const { error } = await supabase.from('be_plans').delete().eq('id', plan.id)
    if (error) setError('Não foi possível excluir: ' + error.message)
    else { setNotice('Plano excluído.'); await load() }
  }

  const visiblePlans = plans.filter(plan => (categoryFilter === 'all' || plan.category === categoryFilter) && [plan.name,plan.description,plan.category].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))))
  const categories = [...new Set(plans.map(plan=>plan.category).filter(Boolean))].sort()

  return <div className="be-catalog">
    <div className="be-catalog-toolbar"><div><p>Defina os preços, duração incluída e quantos drinks ficam disponíveis para seleção em cada plano.</p><span>{visiblePlans.length} exibidos · {plans.length} cadastrados</span></div><div className="be-catalog-actions"><input className="be-catalog-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar plano..."/><select className="be-catalog-filter" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(x=><option key={x} value={x}>{categoryLabels[x]||x}</option>)}</select><button className="be-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Atualizar</button><button className="be-primary be-add" onClick={create}><Plus size={17}/> Novo plano</button></div></div>
    {error && <div className="be-error be-catalog-message">{error}</div>}{notice && <div className="be-success">{notice}</div>}
    {open && <form className="be-catalog-form" onSubmit={save}>
      <div className="be-form-heading"><h3>{editing ? 'Editar plano' : 'Novo plano'}</h3><button type="button" className="be-icon-button" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="be-form-grid">
        <label className="be-field">Nome do plano<input required value={form.name} onChange={e => update('name', e.target.value)}/></label>
        <label className="be-field">Categoria<select value={form.category} onChange={e=>update('category',e.target.value)}><option value="social">Eventos sociais</option><option value="casamento">Casamentos</option><option value="corporativo">Corporativo</option><option value="premium">Premium</option><option value="autoral">Autoral</option><option value="personalizado">Personalizado</option></select></label>
        <label className="be-field">Identificador (slug)<input value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="gerado pelo nome se vazio"/></label>
        <label className="be-field be-field-wide">Descrição<textarea rows="2" value={form.description} onChange={e => update('description', e.target.value)}/></label>
        <label className="be-field">URL da imagem<input type="url" value={form.image_url || ''} onChange={e => update('image_url', e.target.value)}/></label>
        <label className="be-field">Valor-base do plano (R$)<input type="number" min="0" step="0.01" value={form.base_price} onChange={e => update('base_price', e.target.value)}/></label>
        <label className="be-field">Valor por convidado (R$)<input type="number" min="0" step="0.01" value={form.guest_price} onChange={e => update('guest_price', e.target.value)}/></label>
        <label className="be-field">Horas incluídas<input type="number" min="1" step="1" value={form.included_hours} onChange={e => update('included_hours', e.target.value)}/></label>
        <label className="be-field">Valor por hora adicional (R$)<input type="number" min="0" step="0.01" value={form.extra_hour_price} onChange={e => update('extra_hour_price', e.target.value)}/></label>
        <label className="be-field">Drinks disponíveis no plano<input type="number" min="0" step="1" value={form.drink_option_limit} onChange={e => update('drink_option_limit', e.target.value)}/></label>
        <label className="be-field">Drinks que o cliente escolhe<input type="number" min="0" step="1" value={form.drink_choice_limit} onChange={e => update('drink_choice_limit', e.target.value)}/></label>
        <label className="be-field"><span>Destaque</span><span className="be-check-field"><input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)}/> Destacar este plano</span></label>
        <label className="be-field"><span>Disponibilidade</span><span className="be-check-field"><input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)}/> Disponível para clientes</span></label>
      </div>
      <div className="be-plan-drink-picker"><div><strong>Cardápio de opções deste plano</strong><small>Marque os drinks que o cliente poderá escolher. O número marcado precisa alcançar a quantidade de opções definida acima.</small></div>
        <div className="be-plan-drink-grid">{drinks.filter(d => d.active).map(drink => <label key={drink.id}><input type="checkbox" checked={selected.includes(drink.id)} onChange={e => setSelected(current => e.target.checked ? [...current, drink.id] : current.filter(id => id !== drink.id))}/><span>{drink.name}<small>{drink.category}</small></span></label>)}</div>
        <small>{selected.length} drinks selecionados para {form.drink_option_limit || 'todos'} opções disponíveis.</small>
      </div>
      <div className="be-form-actions"><button type="button" className="be-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="be-primary" type="submit" disabled={saving}><Save size={16}/>{saving ? 'Salvando...' : 'Salvar plano'}</button></div>
    </form>}
    {loading ? <div className="be-empty">Carregando planos...</div> : visiblePlans.length === 0 ? <div className="be-empty"><Martini size={24}/><p>Nenhum plano cadastrado.</p>Cadastre os planos para liberar a ferramenta de orçamento.</div> :
      <div className="be-plan-card-grid">{visiblePlans.map(plan => <article className="be-plan-card" key={plan.id}>
        {plan.image_url && <img src={plan.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none' }}/>}
        <div className="be-catalog-info"><div className="be-catalog-title-row"><h3>{plan.name}</h3><span className={plan.active ? 'be-status be-status-on' : 'be-status'}>{plan.active ? 'Ativo' : 'Inativo'}</span></div><span className="be-category-chip">{categoryLabels[plan.category] || plan.category || 'Eventos sociais'}</span><p>{plan.description}</p><div className="be-price-lines"><span>Base: {money(plan.base_price)}</span><span>Por convidado: {money(plan.guest_price)}</span><span>{plan.included_hours}h incluídas</span><span>{plan.extra_hour_price}/h adicional</span><span>{plan.be_plan_drinks?.length || 0} drinks associados · escolhe {plan.drink_choice_limit}</span></div></div>
        <div className="be-item-actions"><button onClick={() => edit(plan)} aria-label="Editar"><Pencil size={16}/></button><button onClick={() => remove(plan)} aria-label="Excluir"><Trash2 size={16}/></button></div>
      </article>)}</div>}
  </div>
}
