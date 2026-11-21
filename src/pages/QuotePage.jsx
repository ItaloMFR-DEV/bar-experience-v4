import { Martini, ArrowLeft } from 'lucide-react'

export default function QuotePage() {
  return (
    <main className="be-screen">
      <section className="be-quote-intro">
        <a className="be-back" href="/"><ArrowLeft size={16}/> Voltar ao portfólio</a>
        <div className="be-brand-mark"><Martini size={27}/></div>
        <span className="be-kicker">BAR EXPERIENCE</span>
        <h1>Monte seu orçamento</h1>
        <p>Em breve você poderá configurar seu evento, selecionar serviços e estruturas e acompanhar o valor estimado da contratação.</p>
        <p className="be-quote-note">Toda solicitação passa por análise e aprovação da nossa equipe.</p>
      </section>
    </main>
  )
}
