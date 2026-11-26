import { useState } from 'react'
import { ArrowDown, ArrowRight, Check, Clock3, GlassWater, Instagram, Menu, MessageCircle, Martini, X } from 'lucide-react'
import { plans } from './data/plans'
import { site } from './data/site'

function BudgetLink({ children, className = '' }) {
  const href = site.orcamentoUrl?.trim() || '/orcamento'
  const external = Boolean(site.orcamentoUrl?.trim())
  return <a className={className} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{children}</a>
}

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="header">
      <a className="brand" href="#inicio" onClick={close}>
        <span className="brand-mark"><img src="/images/brand/brinda-ae-monograma.webp" alt="" /></span>
        <span>{site.name}<small>SOLUÇÕES EM EVENTOS E BAR</small></span>
      </a>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Abrir menu">
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? 'nav nav-open' : 'nav'}>
        <a href="#planos" onClick={close}>Nossos planos</a>
        <a href="#experiencia" onClick={close}>A experiência</a>
        <a href="#contato" onClick={close}>Contato</a>
        <BudgetLink className="nav-cta">Use nossa ferramenta de orçamento <ArrowRight size={15}/></BudgetLink>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-image" />
      <div className="hero-shade" />
      <div className="hero-content wrap">
        <p className="eyebrow"><span />{site.eyebrow}</p>
        <h1>{site.slogan}</h1>
        <p className="hero-copy">{site.description}</p>
        <div className="hero-actions">
          <a className="button button-gold" href="#planos">Ver planos <ArrowDown size={16}/></a>
          <a className="button button-ghost" href="#experiencia">Conheça a experiência</a>
        </div>
        <div className="hero-note"><span className="note-line" /> Atendimento em {site.city}</div>
      </div>
      <div className="hero-index">01 <span>/</span> 05</div>
    </section>
  )
}

function Intro() {
  return (
    <section className="intro wrap" id="experiencia">
      <div className="section-kicker">MAIS QUE UM BAR</div>
      <div className="intro-grid">
        <h2>O cuidado está em cada <em>detalhe.</em></h2>
        <div>
          <p>Levamos estrutura, serviço e coquetelaria até o seu evento. Cada drink é preparado para combinar sabor, apresentação e um atendimento que acompanha o ritmo da celebração.</p>
          <div className="intro-points">
            <span><Check size={15}/> Drinks preparados na hora</span>
            <span><Check size={15}/> 4 horas de serviço de bar</span>
            <span><Check size={15}/> Cardápios para diferentes estilos</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan, index }) {
  return (
    <article className={`plan-card ${plan.featured ? 'plan-featured' : ''}`}>
      <div className="plan-photo">
        <img src={plan.image} alt={`Imagem ilustrativa do plano ${plan.name}`} loading="lazy" />
        <span className="plan-number">0{index + 1}</span>
        {plan.featured && <span className="popular-tag">MAIS ESCOLHIDO</span>}
      </div>
      <div className="plan-body">
        <div className="plan-tier">{plan.tier}</div>
        <h3>Plano {plan.name}</h3>
        <p className="plan-description">{plan.description}</p>
        <div className="plan-includes">
          <div><GlassWater size={17}/><strong>4 drinks por pessoa</strong></div>
          <div><Clock3 size={17}/><strong>4 horas de serviço de bar</strong></div>
        </div>
        <div className="drink-list-title">CARDÁPIO INCLUÍDO</div>
        <ul className="drink-list">
          {plan.drinks.map((drink) => <li key={drink}>{drink}</li>)}
        </ul>
        <BudgetLink className="plan-link">Consultar este plano <ArrowRight size={16}/></BudgetLink>
      </div>
    </article>
  )
}

function Plans() {
  return (
    <section className="plans-section" id="planos">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <div className="section-kicker">ENCONTRE SUA EXPERIÊNCIA</div>
            <h2>Planos para brindar <em>bons momentos.</em></h2>
          </div>
          <p>Escolha a proposta que combina com seu evento. Todos os planos incluem estrutura de atendimento por quatro horas.</p>
        </div>
        <div className="plans-grid">
          {plans.map((plan, index) => <PlanCard key={plan.id} plan={plan} index={index}/>)}
        </div>
        <p className="plans-footnote">A composição dos cardápios, a disponibilidade dos serviços e as condições de contratação são confirmadas na proposta do evento.</p>
      </div>
    </section>
  )
}

function DetailBand() {
  return (
    <section className="detail-band">
      <div className="detail-image"><img src="/images/brand/brinda-ae-assinatura.webp" alt="BRINDA AÊ — Soluções em Eventos e Bar" loading="lazy" /></div>
      <div className="detail-content">
        <div className="section-kicker">SEU EVENTO, NOSSO BAR</div>
        <h2>Uma estrutura pensada para <em>receber bem.</em></h2>
        <p>Além do serviço de coquetelaria, disponibilizamos estruturas de bar, balcões, iluminação, decoração e equipamentos para compor o ambiente do evento.</p>
        <a className="text-link" href="#contato">Converse com nossa equipe <ArrowRight size={16}/></a>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="contact wrap" id="contato">
      <div>
        <div className="section-kicker">VAMOS CONVERSAR?</div>
        <h2>Seu próximo evento começa <em>por aqui.</em></h2>
        <p>Consulte a disponibilidade, conheça as condições de contratação e organize os detalhes do serviço para o seu evento.</p>
      </div>
      <div className="contact-actions">
        <BudgetLink className="button button-gold"><MessageCircle size={17}/> Use nossa ferramenta de orçamento</BudgetLink>
        {site.instagramUrl && <a className="button button-ghost" href={site.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a>}
        {site.email && <a className="contact-email" href={`mailto:${site.email}`}> <span>E-MAIL</span>{site.email}</a> }
        
      </div>
    </section>
  )
}

function Footer() {
  return <footer className="footer"><div className="wrap footer-inner"><a className="brand" href="#inicio"><span className="brand-mark"><img src="/images/brand/brinda-ae-monograma.webp" alt="" /></span><span>{site.name}<small>SOLUÇÕES EM EVENTOS E BAR</small></span></a><span>© {new Date().getFullYear()} {site.name}. Todos os direitos reservados.</span><a href="#inicio">Voltar ao topo ↑</a></div></footer>
}

export default function App() {
  return <><Header/><main><Hero/><Intro/><Plans/><DetailBand/><Contact/></main><Footer/></>
}
