import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Save, RefreshCw, GlassWater } from 'lucide-react'

const blank = {name:'',description:'',category:'classico',ingredients:'',method:'',image_url:'',alcohol:true,serving_size_ml:'400',ingredient_cost:'0',garnish_cost:'0',packaging_cost:'0',other_cost:'0',reference_price:'0',active:true}
const categoryLabels = {classico:'Clássicos',autoral:'Autorais',refrescante:'Refrescantes',sem_alcool:'Sem álcool',especial:'Especiais'}
const money = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const cost = x => ['ingredient_cost','garnish_cost','packaging_cost','other_cost'].reduce((s,k)=>s+Number(x[k]||0),0)

export default function DrinkManager() {
  const [items,setItems]=useState([]),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[open,setOpen]=useState(false)
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[search,setSearch]=useState(''),[categoryFilter,setCategoryFilter]=useState('all')
  const load=useCallback(async()=>{
    setLoading(true)
    const [d,c]=await Promise.all([supabase.from('be_drinks').select('*').order('name'),supabase.from('be_drink_costs').select('*')])
    if(d.error||c.error)setError('Não foi possível carregar drinks e custos: '+(d.error||c.error).message)
    else {const costs=Object.fromEntries((c.data||[]).map(x=>[x.drink_id,x]));setItems((d.data||[]).map(x=>({...x,...(costs[x.id]||{})})));setError('')}
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])
  function edit(x){setEditing(x.id);setForm({...blank,...x,ingredients:Array.isArray(x.ingredients)?x.ingredients.join(', '):'',serving_size_ml:String(x.serving_size_ml??400),ingredient_cost:String(x.ingredient_cost??0),garnish_cost:String(x.garnish_cost??0),packaging_cost:String(x.packaging_cost??0),other_cost:String(x.other_cost??0),reference_price:String(x.reference_price??0)});setOpen(true);setError('');setNotice('')}
  function create(){setEditing(null);setForm(blank);setOpen(true);setError('');setNotice('')}
  const update=(k,v)=>setForm(x=>({...x,[k]:v}))
  async function save(e){
    e.preventDefault();setSaving(true);setError('')
    const publicData={name:form.name.trim(),description:form.description||null,category:form.category,ingredients:form.ingredients.split(',').map(x=>x.trim()).filter(Boolean),method:form.method||null,image_url:form.image_url||null,alcohol:Boolean(form.alcohol),serving_size_ml:Number(form.serving_size_ml||400),active:Boolean(form.active)}
    const costData={ingredient_cost:Number(form.ingredient_cost||0),garnish_cost:Number(form.garnish_cost||0),packaging_cost:Number(form.packaging_cost||0),other_cost:Number(form.other_cost||0),reference_price:Number(form.reference_price||0)}
    let id=editing
    if(editing){const {error}=await supabase.from('be_drinks').update(publicData).eq('id',editing);if(error){setError('Falha ao salvar drink: '+error.message);setSaving(false);return}}
    else {const {data,error}=await supabase.from('be_drinks').insert(publicData).select('id').single();if(error){setError('Falha ao criar drink: '+error.message);setSaving(false);return}id=data.id}
    const {error:costError}=await supabase.from('be_drink_costs').upsert({drink_id:id,...costData},{onConflict:'drink_id'})
    if(costError)setError('Drink salvo, mas houve falha ao salvar custos: '+costError.message)
    else {setNotice('Drink salvo com sucesso.');setOpen(false);await load()}
    setSaving(false)
  }
  async function remove(x){if(!window.confirm('Excluir o drink "'+x.name+'"?'))return;const {error}=await supabase.from('be_drinks').delete().eq('id',x.id);if(error)setError('Falha ao excluir: '+error.message);else{setNotice('Drink excluído.');await load()}}
  const preview=cost(form),cmv=Number(form.reference_price)>0?preview/Number(form.reference_price)*100:null
  const visibleItems=items.filter(x=>(categoryFilter==='all'||x.category===categoryFilter)&&[x.name,x.description,x.ingredients,x.category].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))))
  const categories=[...new Set(items.map(x=>x.category).filter(Boolean))].sort()
  return <div className="be-catalog">
    <div className="be-catalog-toolbar"><div><p>Cadastre receitas e custos internos. Custo e CMV ficam em uma tabela administrativa, sem acesso público.</p><span>{visibleItems.length} exibidos · {items.length} cadastrados</span></div><div className="be-catalog-actions"><input className="be-catalog-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar drink..."/><select className="be-catalog-filter" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(x=><option key={x} value={x}>{categoryLabels[x]||x}</option>)}</select><button className="be-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Atualizar</button><button className="be-primary be-add" onClick={create}><Plus size={17}/> Novo drink</button></div></div>
    {error&&<div className="be-error be-catalog-message">{error}</div>}{notice&&<div className="be-success">{notice}</div>}
    {open&&<form className="be-catalog-form" onSubmit={save}>
      <div className="be-form-heading"><h3>{editing?'Editar drink':'Cadastrar drink'}</h3><button type="button" className="be-icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
      <div className="be-form-grid">
        <label className="be-field">Nome<input required value={form.name} onChange={e=>update('name',e.target.value)}/></label>
        <label className="be-field">Categoria<select value={form.category} onChange={e=>update('category',e.target.value)}><option value="classico">Clássico</option><option value="autoral">Autoral</option><option value="refrescante">Refrescante</option><option value="sem_alcool">Sem álcool</option><option value="especial">Especial</option></select></label>
        <label className="be-field be-field-wide">Descrição<textarea rows="2" value={form.description||''} onChange={e=>update('description',e.target.value)}/></label>
        <label className="be-field be-field-wide">Ingredientes (separe por vírgula)<input value={form.ingredients} onChange={e=>update('ingredients',e.target.value)} placeholder="vodka, limão, açúcar, gelo"/></label>
        <label className="be-field be-field-wide">Modo de preparo<textarea rows="2" value={form.method||''} onChange={e=>update('method',e.target.value)}/></label>
        <label className="be-field">URL da imagem<input type="url" value={form.image_url||''} onChange={e=>update('image_url',e.target.value)}/></label>
        <label className="be-field">Volume servido (ml)<input type="number" min="1" value={form.serving_size_ml} onChange={e=>update('serving_size_ml',e.target.value)}/></label>
        <label className="be-field">Custo dos ingredientes (R$)<input type="number" min="0" step="0.01" value={form.ingredient_cost} onChange={e=>update('ingredient_cost',e.target.value)}/></label>
        <label className="be-field">Custo de guarnição (R$)<input type="number" min="0" step="0.01" value={form.garnish_cost} onChange={e=>update('garnish_cost',e.target.value)}/></label>
        <label className="be-field">Copo / embalagem (R$)<input type="number" min="0" step="0.01" value={form.packaging_cost} onChange={e=>update('packaging_cost',e.target.value)}/></label>
        <label className="be-field">Outros custos (R$)<input type="number" min="0" step="0.01" value={form.other_cost} onChange={e=>update('other_cost',e.target.value)}/></label>
        <label className="be-field">Preço de referência (R$)<input type="number" min="0" step="0.01" value={form.reference_price} onChange={e=>update('reference_price',e.target.value)}/></label>
        <label className="be-field"><span>Disponibilidade</span><span className="be-check-field"><input type="checkbox" checked={Boolean(form.active)} onChange={e=>update('active',e.target.checked)}/> Disponível para clientes</span></label>
        <label className="be-field"><span>Teor alcoólico</span><span className="be-check-field"><input type="checkbox" checked={Boolean(form.alcohol)} onChange={e=>update('alcohol',e.target.checked)}/> Contém álcool (18+)</span></label>
      </div>
      <div className="be-drink-cost-preview"><span>Custo total por drink <strong>{money(preview)}</strong></span><span>CMV <strong>{cmv===null?'Informe preço de referência':cmv.toFixed(1)+'%'}</strong></span><small>CMV = custo total da receita ÷ preço de referência.</small></div>
      <div className="be-form-actions"><button type="button" className="be-secondary" onClick={()=>setOpen(false)}>Cancelar</button><button className="be-primary" type="submit" disabled={saving}><Save size={16}/>{saving?'Salvando...':'Salvar drink'}</button></div>
    </form>}
    {loading?<div className="be-empty">Carregando drinks...</div>:!visibleItems.length?<div className="be-empty"><GlassWater size={24}/><p>Nenhum drink cadastrado.</p>Cadastre receitas para montar os cardápios dos planos.</div>:<div className="be-drink-card-grid">{visibleItems.map(x=>{const c=cost(x),m=Number(x.reference_price)>0?c/Number(x.reference_price)*100:null;return <article className="be-drink-card" key={x.id}>{x.image_url&&<img src={x.image_url} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}<div className="be-catalog-info"><div className="be-catalog-title-row"><h3>{x.name}</h3><span className={x.active?'be-status be-status-on':'be-status'}>{x.active?'Ativo':'Inativo'}</span></div><div className="be-drink-card-meta"><span className="be-category-chip"}>{categoryLabels[x.category]||x.category}</span><small>{x.serving_size_ml} ml · {x.alcohol?'Alcoólico':'Sem álcool'}</small></div>{x.description&&<p>{x.description}</p>}<div className="be-price-lines"><span>Custo: {money(c)}</span><span>Referência: {money(x.reference_price)}</span><span>CMV: {m===null?'—':m.toFixed(1)+'%'}</span></div></div><div className="be-item-actions"><button onClick={()=>edit(x)} aria-label="Editar"><Pencil size={16}/></button><button onClick={()=>remove(x)} aria-label="Excluir"><Trash2 size={16}/></button></div></article>})}</div>}
  </div>
}
