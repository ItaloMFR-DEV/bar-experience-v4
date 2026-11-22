import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, X, Save, RefreshCw } from 'lucide-react'

const catalogues = {
  services: {
    table: 'be_services',
    title: 'Serviços',
    singular: 'serviço',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'select', options: [['bar','Bar e coquetelaria'],['equipe','Equipe e operação'],['estrutura','Estrutura e montagem'],['experiencia','Experiências'],['logistica','Logística'],['corporativo','Corporativo'],['social','Eventos sociais'],['casamento','Casamentos'],['premium','Premium'],['geral','Geral']] },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'pricing_model', label: 'Modelo de cobrança', type: 'select', options: [['fixed', 'Valor fixo'], ['hourly', 'Por hora'], ['per_guest', 'Por convidado'], ['hour_guest', 'Hora + convidado']] },
      { name: 'base_price', label: 'Valor fixo / base (R$)', type: 'number' },
      { name: 'hourly_price', label: 'Valor por hora (R$)', type: 'number' },
      { name: 'guest_price', label: 'Valor por convidado (R$)', type: 'number' },
      { name: 'image_url', label: 'URL da imagem', type: 'url' },
      { name: 'active', label: 'Cadastro ativo', type: 'checkbox' }
    ]
  },
  structures: {
    table: 'be_structures',
    title: 'Estruturas',
    singular: 'estrutura',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'select', options: [['bar','Bar e coquetelaria'],['equipe','Equipe e operação'],['estrutura','Estrutura e montagem'],['experiencia','Experiências'],['logistica','Logística'],['corporativo','Corporativo'],['social','Eventos sociais'],['casamento','Casamentos'],['premium','Premium'],['geral','Geral']] },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'pricing_model', label: 'Modelo de cobrança', type: 'select', options: [['fixed', 'Valor fixo'], ['hourly', 'Por hora']] },
      { name: 'base_price', label: 'Valor fixo / base (R$)', type: 'number' },
      { name: 'hourly_price', label: 'Valor por hora (R$)', type: 'number' },
      { name: 'image_url', label: 'URL da imagem', type: 'url' },
      { name: 'active', label: 'Cadastro ativo', type: 'checkbox' }
    ]
  },
  professionals: {
    table: 'be_professionals',
    title: 'Profissionais',
    singular: 'profissional',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'select', options: [['bar','Bar e coquetelaria'],['equipe','Equipe e operação'],['estrutura','Estrutura e montagem'],['experiencia','Experiências'],['logistica','Logística'],['corporativo','Corporativo'],['social','Eventos sociais'],['casamento','Casamentos'],['premium','Premium'],['geral','Geral']] },
      { name: 'profession', label: 'Função / especialidade', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'skills', label: 'Habilidades (separe por vírgula)', type: 'text', array: true },
      { name: 'base_price', label: 'Valor-base (R$)', type: 'number' },
      { name: 'hourly_price', label: 'Valor por hora (R$)', type: 'number' },
      { name: 'image_url', label: 'URL da imagem', type: 'url' },
      { name: 'active', label: 'Cadastro ativo', type: 'checkbox' }
    ]
  },
  promotions: {
    table: 'be_promotions',
    title: 'Promoções',
    singular: 'promoção',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'select', options: [['bar','Bar e coquetelaria'],['equipe','Equipe e operação'],['estrutura','Estrutura e montagem'],['experiencia','Experiências'],['logistica','Logística'],['corporativo','Corporativo'],['social','Eventos sociais'],['casamento','Casamentos'],['premium','Premium'],['geral','Geral']] },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'discount_type', label: 'Tipo de desconto', type: 'select', options: [['percentage', 'Percentual (%)'], ['fixed', 'Valor fixo (R$)']] },
      { name: 'discount_value', label: 'Valor do desconto', type: 'number', required: true },
      { name: 'starts_at', label: 'Início da validade', type: 'datetime-local' },
      { name: 'ends_at', label: 'Fim da validade', type: 'datetime-local' },
      { name: 'active', label: 'Promoção ativa', type: 'checkbox' }
    ]
  }
}

const emptyValue = field => {
  if (field.type === 'checkbox') return true
  if (field.type === 'select') return field.options[0][0]
  if (field.type === 'number') return '0'
  return ''
}

function freshRecord(config) {
  return Object.fromEntries(config.fields.map(field => [field.name, emptyValue(field)]))
}

function dateForInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function normaliseRecord(record, config) {
  const result = { ...record }
  for (const field of config.fields) {
    const value = result[field.name]
    if (field.type === 'number') result[field.name] = Number(value || 0)
    if (field.array) result[field.name] = String(value || '').split(',').map(item => item.trim()).filter(Boolean)
    if (field.type === 'datetime-local') result[field.name] = value ? new Date(value).toISOString() : null
    if (field.type === 'checkbox') result[field.name] = Boolean(value)
  }
  return result
}

function recordForForm(record, config) {
  const result = freshRecord(config)
  for (const field of config.fields) {
    if (record[field.name] === undefined || record[field.name] === null) continue
    if (field.array) result[field.name] = record[field.name].join(', ')
    else if (field.type === 'datetime-local') result[field.name] = dateForInput(record[field.name])
    else result[field.name] = record[field.name]
  }
  return result
}

export default function CatalogManager({ section }) {
  const config = catalogues[section]
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(() => freshRecord(config))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: requestError } = await supabase
      .from(config.table)
      .select('*')
      .order('created_at', { ascending: false })
    if (requestError) setError('Não foi possível carregar os cadastros: ' + requestError.message)
    else setRecords(data || [])
    setLoading(false)
  }, [config.table])

  useEffect(() => { loadRecords() }, [loadRecords])

  function startNew() {
    setEditingId(null)
    setForm(freshRecord(config))
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm(recordForForm(record, config))
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function changeField(name, value) {
    setForm(current => ({ ...current, [name]: value }))
  }

  async function saveRecord(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = normaliseRecord(form, config)
    const request = editingId
      ? supabase.from(config.table).update(payload).eq('id', editingId)
      : supabase.from(config.table).insert(payload)
    const { error: saveError } = await request
    if (saveError) {
      setError('Não foi possível salvar: ' + saveError.message)
      setSaving(false)
      return
    }
    setNotice(editingId ? 'Cadastro atualizado.' : 'Cadastro criado.')
    setShowForm(false)
    setEditingId(null)
    await loadRecords()
    setSaving(false)
  }

  async function deleteRecord(record) {
    const confirmed = window.confirm('Excluir "' + record.name + '"? Esta ação não pode ser desfeita.')
    if (!confirmed) return
    setError('')
    const { error: deleteError } = await supabase.from(config.table).delete().eq('id', record.id)
    if (deleteError) setError('Não foi possível excluir: ' + deleteError.message)
    else {
      setNotice('Cadastro excluído.')
      await loadRecords()
    }
  }

  const visibleRecords = records.filter(record => (categoryFilter === 'all' || record.category === categoryFilter) && [record.name, record.description, record.profession, record.category].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))))
  const categories = [...new Set(records.map(record => record.category).filter(Boolean))].sort()

  return (
    <section className="be-catalog">
      <div className="be-catalog-toolbar">
        <div>
          <p>Cadastre, atualize e controle os itens disponíveis para contratação.</p>
          <span>{visibleRecords.length} exibidos · {records.length} no total</span>
        </div>
        <div className="be-catalog-actions"><input className="be-catalog-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cadastro..." aria-label="Buscar cadastro"/><select className="be-catalog-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
          <button type="button" className="be-secondary" onClick={loadRecords} disabled={loading}><RefreshCw size={16}/> Atualizar</button>
          <button type="button" className="be-primary be-add" onClick={startNew}><Plus size={17}/> Novo {config.singular}</button>
        </div>
      </div>

      {error && <div className="be-error be-catalog-message">{error}</div>}
      {notice && <div className="be-success be-catalog-message">{notice}</div>}

      {showForm && (
        <form className="be-catalog-form" onSubmit={saveRecord}>
          <div className="be-form-heading">
            <h3>{editingId ? 'Editar' : 'Novo'} {config.singular}</h3>
            <button type="button" className="be-icon-button" onClick={() => setShowForm(false)} aria-label="Fechar"><X size={19}/></button>
          </div>
          <div className="be-form-grid">
            {config.fields.map(field => (
              <label key={field.name} className={field.type === 'textarea' ? 'be-field be-field-wide' : 'be-field'}>
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea value={form[field.name] ?? ''} onChange={event => changeField(field.name, event.target.value)} rows={3}/>
                ) : field.type === 'select' ? (
                  <select value={form[field.name]} onChange={event => changeField(field.name, event.target.value)}>
                    {field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <span className="be-check-field"><input type="checkbox" checked={Boolean(form[field.name])} onChange={event => changeField(field.name, event.target.checked)}/> Sim, manter ativo</span>
                ) : (
                  <input
                    type={field.type}
                    value={form[field.name] ?? ''}
                    onChange={event => changeField(field.name, event.target.value)}
                    min={field.type === 'number' ? '0' : undefined}
                    step={field.type === 'number' ? '0.01' : undefined}
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="be-form-actions">
            <button type="button" className="be-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className="be-primary" disabled={saving}><Save size={16}/>{saving ? 'Salvando...' : 'Salvar cadastro'}</button>
          </div>
        </form>
      )}

      {loading ? <div className="be-empty">Carregando cadastros...</div> : visibleRecords.length === 0 ? (
        <div className="be-empty">Nenhum cadastro encontrado. Use “Novo {config.singular}” para começar.</div>
      ) : (
        <div className="be-catalog-list">
          {visibleRecords.map(record => (
            <article className="be-catalog-item" key={record.id}>
              {record.image_url && <img src={record.image_url} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }}/>}
              <div className="be-catalog-info">
                <div className="be-catalog-title-row">
                  <h3>{record.name}</h3>
                  <span className={record.active ? 'be-status be-status-on' : 'be-status'}>{record.active ? 'Ativo' : 'Inativo'}</span>
                </div>
                {record.category && <span className="be-category-chip">{record.category}</span>}{record.profession && <strong>{record.profession}</strong>}
                {record.description && <p>{record.description}</p>}
                {record.skills?.length > 0 && <small>Habilidades: {record.skills.join(', ')}</small>}
                {record.discount_type && <small>Desconto: {record.discount_type === 'percentage' ? record.discount_value + '%' : 'R$ ' + Number(record.discount_value).toFixed(2)}</small>}
                <div className="be-price-lines">
                  {record.base_price > 0 && <span>Base: R$ {Number(record.base_price).toFixed(2)}</span>}
                  {record.hourly_price > 0 && <span>Hora: R$ {Number(record.hourly_price).toFixed(2)}</span>}
                  {record.guest_price > 0 && <span>Convidado: R$ {Number(record.guest_price).toFixed(2)}</span>}
                  {record.pricing_model && <span>Modelo: {({ fixed: 'Fixo', hourly: 'Por hora', per_guest: 'Por convidado', hour_guest: 'Hora + convidado' })[record.pricing_model] || record.pricing_model}</span>}
                </div>
                <small className="be-created">Criado em {record.created_at ? new Date(record.created_at).toLocaleDateString('pt-BR') : '—'}</small>
              </div>
              <div className="be-item-actions">
                <button type="button" onClick={() => startEdit(record)} aria-label="Editar"><Pencil size={16}/></button>
                <button type="button" onClick={() => deleteRecord(record)} aria-label="Excluir"><Trash2 size={16}/></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
