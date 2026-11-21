import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Save, RefreshCw, GlassWater } from 'lucide-react'

const blank = {
  name: '', description: '', category: 'classico', ingredients: '', method: '',
  image_url: '', alcohol: true, serving_size_ml: '400',
  ingredient_cost: '0', garnish_cost: '0', packaging_cost: '0', other_cost: '0',
  reference_price: '0', active: true
}

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const totalCost = item => ['ingredient_cost', 'garnish_cost', 'packaging_cost', 'other_cost'].reduce((sum, key) => sum + Number(item[key] || 0), 0)

export default function DrinkManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('be_drinks').select('*').order('name')
    if (error) setError('Não foi possível carregar os drinks: ' + error.message)
    else { setItems(data || []); setError('') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function edit(item) {
    setEditing(item.id)
    setForm({
      ...blank, ...item,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
      serving_size_ml: String(item.serving_size_ml ?? 400),
      ingredient_cost: String(item.ingredient_cost ?? 0),
      garnish_cost: String(item.garnish_cost ?? 0),
      packaging_cost: String(item.packaging_cost ?? 0),
      other_cost: String(item.other_cost ?? 0),
      reference_price: String(item.reference_price ?? 0)
    })
    setOpen(true); setError(''); setNotice('')
  }

  function create() { setEditing(null); setForm(blank); setOpen(true); setError(''); setNotice('') }

  async function save(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    const payload = {
      ...form,
      ingredients: form.ingredients.split(',').map(x => x.trim()).filter(Boolean),
      serving_size_ml: Number(form.serving_size_ml || 400),
      ingredient_cost: Number(form.ingredient_cost || 0),
      garnish_cost: Number(form.garnish_cost || 0),
      packaging_cost: Number(form.packaging_cost || 0),
      other_cost: Number(form.other_cost || 0),
      reference_price: Number(form.reference_price || 0)
    }
    delete payload.id
    delete payload.created_at
    const query = editing
      ? supabase.from('be_drinks').update(payload).eq('id', editing)
      : supabase.from('be_drinks').insert(payload)
    const { error } = await query
    if (error) setError('Falha ao salvar: ' + error.message)
    else { setNotice('Drink salvo.'); setOpen(false); await load() }
    setSaving(false)
  }

  async function remove(item) {
    if (!window.confirm('Excluir o drink "' + item.name + '"?')) return
    const { error } = await supabase.from('be_drinks').delete().eq('id', item.id)
    if (error) setError('Falha ao excluir: ' + error.message)
    else { setNotice('Drink excluído.'); await load() }
  }

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const previewCost = totalCost(form)
  const cmv = Number(form.reference_price) > 0 ? previewCost / Number(form.reference_price) * 100 : null

  return <div className="be-catalog">
    <div className="be-catalog-toolbar">
      <div><p>Cadastre receitas, ingredientes e custos internos. Os custos e o CMV ficam restritos à administração.</p><span>{items.length} drinks cadastrados</span></div>
      <div className="be-catalog-actions">
        <button className="be-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Atualizar</button>
        <button className="be-primary be-add" onClick={create}><Plus size={17}/> Novo drink</button>
      </div>
    </div>
    {error && <div className="be-error be-catalog-message">{error}</div>}
    {notice && <div className="be-success">{notice}</div>}
    {open && <form className="be-catalog-form" onSubmit={save}>
      <div className="be-form-heading"><h3>{editing ? 'Editar drink' : 'Cadastrar drink'}</h3><button type="button" className="be-icon-button" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="be-form-grid">
        <label className="be-field">Nome<input required value={form.name} onChange={e => update('name', e.target.value)}/></label>
        <label className="be-field">Categoria<select value={form.category} onChange={e => update('category', e.target.value)}><option value="classico">Clássico</option><option value="autoral">Autoral</option><option value="refrescante">Refrescante</option><option value="sem_alcool">Sem álcool</option><option value="especial">Especial</option></select></label>
        <label className="be-field be-field-wide">Descrição<textarea rows="2" value={form.description || ''} onChange={e => update('description', e.target.value)}/></label>
        <label className="be-field be-field-wide">Ingredientes (separe por vírgula)<input value={form.ingredients} onChange={e => update('ingredients', e.target.value)} placeholder="Ex.: vodka, limão, açúcar, gelo"/></label>
        <label className="be-field be-field-wide">Modo de preparo<textarea rows="2" value={form.method || ''} onChange={e => update('method', e.target.value)}/></label>
        <label className="be-field">URL da imagem<input type="url" value={form.image_url || ''} onChange={e => update('image_url', e.target.value)}/></label>
        <label className="be-field">Volume servido (ml)<input type="number" min="1" value={form.serving_size_ml} onChange={e => update('serving_size_ml', e.target.value)}/></label>
        <label className="be-field">Custo dos ingredientes (R$)<input type="number" min="0" step="0.01" value={form.ingredient_cost} onChange={e => update('ingredient_cost', e.target.value)}/></label>
        <label className="be-field">Custo de guarnição (R$)<input type="number" min="0" step="0.01" value={form.garnish_cost} onChange={e => update('garnish_cost', e.target.value)}/></label>
        <label className="be-field">Embalagem / copo (R$)<input type="number" min="0" step="0.01" value={form.packaging_cost} onChange={e => update('packaging_cost', e.target.value)}/></label>
        <label className="be-field">Outros custos (R$)<input type="number" min="0" step="0.01" value={form.other_cost} onChange={e => update('other_cost', e.target.value)}/></label>
        <label className="be-field">Preço de referência (R$)<input type="number" min="0" step="0.01" value={form.reference_price} onChange={e => update('reference_price', e.target.value)}/></label>
        <label className="be-field"><span>Disponibilidade</span><span className="be-check-field"><input type="checkbox" checked={Boolean(form.active)} onChange={e => update('active', e.target.checked)}/> Disponível para clientes</span></label>
        <label className="be-field"><span>Teor alcoólico</span><span className="be-check-field"><input type="checkbox" checked={Boolean(form.alcohol)} onChange={e => update('alcohol', e.target.checked)}/> Contém álcool (18+)</span></label>
      </div>
      <div className="be-drink-cost-preview"><span>Custo por drink <strong>{money(previewCost)}</strong></span><span>CMV <strong>{cmv === null ? 'Informe o preço de referência' : cmv.toFixed(1) + '%'}</strong></span><small>CMV = custo total da receita ÷ preço de referência. Valores internos não aparecem ao cliente.</small></div>
      <div className="be-form-actions"><button type="button" className="be-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="be-primary" type="submit" disabled={saving}><Save size={16}/>{saving ? 'Salvando...' : 'Salvar drink'}</button></div>
    </form>}
    {loading ? <div className="be-empty">Carregando drinks...</div> : items.length === 0 ? <div className="be-empty"><GlassWater size={24}/><p>Nenhum drink cadastrado.</p>Cadastre as receitas para montar os cardápios dos planos.</div> :
      <div className="be-catalog-list">{items.map(item => {
        const cost = totalCost(item)
        const cmvValue = Number(item.reference_price) > 0 ? cost / Number(item.reference_price) * 100 : null
        return <article className="be-catalog-item" key={item.id}>
          {item.image_url && <img src={item.image_url} alt="" onError={e => { e.currentTarget.style.display = 'none' }}/>}
          <div className="be-catalog-info"><div className="be-catalog-title-row"><h3>{item.name}</h3><span className={item.active ? 'be-status be-status-on' : 'be-status'}>{item.active ? 'Ativo' : 'Inativo'}</span></div>
            <small>{item.category} · {item.serving_size_ml} ml · {item.alcohol ? 'Alcoólico' : 'Sem álcool'}</small>
            {item.description && <p>{item.description}</p>}
            <div className="be-price-lines"><span>Custo: {money(cost)}</span><span>Referência: {money(item.reference_price)}</span><span>CMV: {cmvValue === null ? '—' : cmvValue.toFixed(1) + '%'}</span></div>
          </div>
          <div className="be-item-actions"><button onClick={() => edit(item)} aria-label="Editar"><Pencil size={16}/></button><button onClick={() => remove(item)} aria-label="Excluir"><Trash2 size={16}/></button></div>
        </article>
      })}</div>}
  </div>
}
