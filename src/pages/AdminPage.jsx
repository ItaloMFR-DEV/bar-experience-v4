import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CatalogManager from './CatalogManager'
import DrinkManager from './DrinkManager'
import PlanManager from './PlanManager'
import AnalyticsDashboard from './AnalyticsDashboard'
import QuotesManager from './QuotesManager'
import { LayoutDashboard, FileText, Martini, Users, Package, Tags, LogOut, LockKeyhole, GlassWater, ClipboardList } from 'lucide-react'

export default function AdminPage() {
  const [session,setSession] = useState(null)
  const [authorized,setAuthorized] = useState(false)
  const [loading,setLoading] = useState(true)
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')
  const [section,setSection] = useState('dashboard')

  useEffect(() => {
    let mounted = true
    async function checkSession() {
      try {
        const {data,error} = await supabase.auth.getSession()
        if (error) throw error
        if (data.session && mounted) await verifyAdmin(data.session)
        else if (mounted) setLoading(false)
      } catch (err) {
        if (mounted) { setError('Erro ao recuperar sessão: ' + err.message); setLoading(false) }
      }
    }
    checkSession()
    const {data:listener} = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' && mounted) { setSession(null); setAuthorized(false); setLoading(false); setError('') }
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  async function verifyAdmin(currentSession) {
    try {
      setSession(currentSession)
      const {data,error} = await supabase.rpc('be_is_admin')
      if (error) { setAuthorized(false); setError('Erro ao verificar autorização: ' + error.message); return }
      if (data !== true) { setAuthorized(false); setError('Login realizado, mas este usuário não está autorizado como administrador.'); return }
      setAuthorized(true); setError('')
    } catch (err) { setAuthorized(false); setError('Erro na verificação administrativa: ' + err.message) }
    finally { setLoading(false) }
  }

  async function login(event) {
    event.preventDefault()
    if (loading) return
    setLoading(true); setError('')
    try {
      const {data,error} = await supabase.auth.signInWithPassword({email:email.trim(),password})
      if (error) { setError('Falha na autenticação: ' + error.message); setLoading(false); return }
      if (!data.session) { setError('O Supabase não retornou uma sessão válida.'); setLoading(false); return }
      await verifyAdmin(data.session)
    } catch (err) { setError('Erro inesperado no login: ' + err.message); setLoading(false) }
  }

  async function logout() {
    setLoading(true)
    const {error} = await supabase.auth.signOut()
    if (error) { setError('Erro ao sair: ' + error.message); setLoading(false); return }
    setSession(null); setAuthorized(false); setPassword(''); setError(''); setLoading(false)
  }

  if (loading) return <div className="be-screen">Verificando acesso administrativo...</div>
  if (!session || !authorized) return <main className="be-screen"><form className="be-login" onSubmit={login}>
    <div className="be-brand-mark"><LockKeyhole size={25}/></div><span className="be-kicker">BAR EXPERIENCE</span><h1>Painel administrativo</h1><p>Acesse sua conta para gerenciar o negócio.</p>
    <label>E-mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Seu e-mail" autoComplete="username" required/>
    <label>Senha</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required/>
    {error&&<div className="be-error">{error}</div>}<button className="be-primary" type="submit" disabled={loading}>{loading?'Verificando...':'Entrar no painel'}</button><a className="be-back" href="/">Voltar ao portfólio</a>
  </form></main>

  const sections = [
    {id:'dashboard',label:'Visão geral',icon:LayoutDashboard},
    {id:'quotes',label:'Orçamentos',icon:FileText},
    {id:'plans',label:'Planos e cardápios',icon:ClipboardList},
    {id:'drinks',label:'Drinks',icon:GlassWater},
    {id:'services',label:'Serviços',icon:Martini},
    {id:'structures',label:'Estruturas',icon:Package},
    {id:'professionals',label:'Profissionais',icon:Users},
    {id:'promotions',label:'Promoções',icon:Tags}
  ]
  return <div className="be-admin">
    <aside className="be-sidebar"><div className="be-sidebar-brand"><Martini size={23}/><div>BAR EXPERIENCE<small>ADMINISTRAÇÃO</small></div></div>
      <nav>{sections.map(item=>{const Icon=item.icon;return <button key={item.id} className={section===item.id?'active':''} onClick={()=>setSection(item.id)}><Icon size={18}/>{item.label}</button>})}</nav>
      <button className="be-logout" onClick={logout}><LogOut size={17}/> Sair da conta</button>
    </aside>
    <main className="be-admin-main"><header className="be-admin-top"><div><span className="be-kicker">ÁREA ADMINISTRATIVA</span><h1>{sections.find(x=>x.id===section)?.label}</h1></div><span className="be-admin-email">{session.user.email}</span></header>
      {section==='dashboard'&&<section className="be-panel be-panel-analytics"><AnalyticsDashboard/></section>}
      {section==='drinks'&&<section className="be-panel be-panel-catalog"><h2>Cadastro de drinks</h2><DrinkManager/></section>}
      {section==='plans'&&<section className="be-panel be-panel-catalog"><h2>Planos e cardápios</h2><PlanManager/></section>}
      {['services','structures','professionals','promotions'].includes(section)&&<section className="be-panel be-panel-catalog"><h2>{sections.find(x=>x.id===section)?.label}</h2><CatalogManager key={section} section={section}/></section>}
      {section==='quotes'&&<section className="be-panel be-panel-quotes"><QuotesManager/></section>}
    </main>
  </div>
}
