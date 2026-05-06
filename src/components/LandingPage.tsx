import Link from "next/link";
import { Brain, Target, BarChart3, Sparkles, Zap, BookOpen, Trophy, CheckCircle2, Star, ChevronRight, Users, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "IA Tutor 24/7", desc: "Explicações personalizadas, resumos instantâneos e plano de estudos gerado por IA.", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { icon: Target, title: "Banco de Questões", desc: "Milhares de questões CESPE, FCC e VUNESP com gabarito comentado.", color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  { icon: BarChart3, title: "Dashboard de Trading", desc: "Analise seu progresso como um trader analisa o mercado. Dados em tempo real.", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { icon: Zap, title: "Simulados Cronometrados", desc: "Simule a prova real com tempo controlado e análise de desempenho.", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { icon: Trophy, title: "Ranking Global", desc: "Compete com outros candidatos e acompanhe sua posição no ranking.", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { icon: BookOpen, title: "Aulas Estruturadas", desc: "Conteúdo organizado por concurso > matéria > assunto. Estude de onde parou.", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
];

const STATS = [
  { value: "48.3k", label: "Alunos aprovados" },
  { value: "2.1M+", label: "Questões respondidas" },
  { value: "94%", label: "Taxa de aprovação" },
  { value: "4.9★", label: "Avaliação média" },
];

const TESTIMONIALS = [
  { name: "Ana Carvalho", role: "Aprovada INSS 2025", text: "Em 5 meses passei no INSS. O simulado e o IA Tutor foram decisivos. Nunca estudei de forma tão eficiente.", initial: "A", color: "gradient-neon text-black" },
  { name: "Pedro Lima", role: "Aprovado TRF 2024", text: "O dashboard me mostrou exatamente onde eu estava errando. Foquei nas matérias certas e passei na primeira tentativa.", initial: "P", color: "gradient-purple text-white" },
  { name: "Julia Santos", role: "Aprovada PF 2025", text: "O ranking me motivou a estudar mais. A competição saudável fez toda a diferença na minha rotina.", initial: "J", color: "bg-blue-600 text-white" },
];

const PLANS = [
  {
    name: "Grátis", price: "R$ 0", period: "para sempre",
    features: ["Dashboard básico", "5 questões/dia", "Revisão espaçada", "IA Tutor (10 msgs/dia)"],
    cta: "Começar grátis", highlight: false,
  },
  {
    name: "Premium", price: "R$ 29,90", period: "/mês",
    features: ["Tudo do plano grátis", "Questões ilimitadas", "Simulados completos", "IA Tutor ilimitado", "Ranking global", "Materiais em PDF"],
    cta: "Assinar agora", highlight: true,
  },
  {
    name: "Elite", price: "R$ 49,90", period: "/mês",
    features: ["Tudo do Premium", "Mentoria em grupo", "Plano de estudo por IA", "Correção de redação", "Suporte prioritário"],
    cta: "Quero o Elite", highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl gradient-neon glow-neon"><Brain className="h-4 w-4 text-black" /></div>
          <span className="font-bold text-lg text-gradient-neon">IAestuda</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Planos</Link>
          <Link href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/entrar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
          <Link href="/cadastro" className="gradient-neon glow-neon text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm border-neon text-primary font-medium">
            <Star className="h-3.5 w-3.5" /> #1 plataforma de concursos do Brasil · 48k+ aprovados
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            Estude como os
            <br />
            <span className="text-gradient-full">aprovados estudam.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tecnologia de ponta, IA personalizada e gamificação real. Transforme cada hora de estudo em uma certeza de aprovação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="gradient-neon glow-neon text-black font-bold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 justify-center">
              <Zap className="h-5 w-5" /> Começar grátis agora
            </Link>
            <Link href="/entrar" className="glass border-white/10 text-foreground font-medium px-8 py-4 rounded-xl text-base hover:border-white/20 transition-all flex items-center gap-2 justify-center">
              Já tenho conta <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center border-white/5">
                <p className="text-2xl font-bold text-gradient-neon">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tudo que você precisa para <span className="text-gradient-neon">ser aprovado</span></h2>
            <p className="text-muted-foreground text-lg">Uma plataforma completa, do estudo ao simulado.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`glass-card rounded-2xl p-6 border ${f.border} hover:scale-[1.02] transition-transform group`}>
                <div className={`p-3 rounded-xl ${f.bg} w-fit mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Como funciona</h2>
          <p className="text-muted-foreground mb-16">Do zero à aprovação em 4 passos simples.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Escolhe o concurso", desc: "Selecione seu objetivo e a IA monta seu plano.", icon: Target },
              { step: "02", title: "Estuda com foco", desc: "Aulas, resumos e flashcards organizados por matéria.", icon: BookOpen },
              { step: "03", title: "Pratica questões", desc: "Banco com milhares de questões reais com gabarito.", icon: Brain },
              { step: "04", title: "Evolui no ranking", desc: "Acompanhe seu progresso e motive-se a estudar mais.", icon: Trophy },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-10" />}
                <div className="glass-card rounded-2xl p-5 border-white/5 text-center">
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">{s.step}</div>
                  <div className="p-3 rounded-xl gradient-neon w-fit mx-auto mb-3">
                    <s.icon className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Histórias reais de <span className="text-gradient-neon">aprovação</span></h2>
            <p className="text-muted-foreground">Mais de 48 mil candidatos já foram aprovados com o IAestuda.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6 border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${t.color} flex items-center justify-center font-bold shrink-0`}>{t.initial}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-primary">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Planos para cada momento</h2>
            <p className="text-muted-foreground">Comece grátis. Evolua quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 space-y-6 ${plan.highlight ? "gradient-neon text-black glow-neon scale-105" : "glass-card border-white/5"}`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? "text-black/60" : "text-primary"}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-black" : ""}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-black/60" : "text-muted-foreground"}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-black" : "text-primary"}`} />
                      <span className={plan.highlight ? "text-black" : "text-foreground/80"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/cadastro">
                  <div className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    plan.highlight
                      ? "bg-black text-white hover:bg-black/80"
                      : "gradient-neon text-black hover:opacity-90"
                  }`}>
                    {plan.cta}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-4 rounded-2xl gradient-neon glow-neon w-fit mx-auto">
            <Brain className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-4xl font-bold">Sua aprovação começa <span className="text-gradient-neon">hoje.</span></h2>
          <p className="text-muted-foreground text-lg">Junte-se a 48 mil candidatos que já transformaram sua forma de estudar.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 gradient-neon glow-neon text-black font-bold px-10 py-4 rounded-xl text-base hover:opacity-90 transition-all hover:scale-105">
            <Zap className="h-5 w-5" /> Criar conta grátis — sem cartão
          </Link>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Users className="h-3 w-3" /> 127 pessoas se cadastraram hoje
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-neon"><Brain className="h-4 w-4 text-black" /></div>
            <span className="font-bold text-gradient-neon">IAestuda</span>
            <span className="text-muted-foreground text-xs">© 2025 · Todos os direitos reservados</span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Termos de uso</Link>
            <Link href="#" className="hover:text-foreground">Privacidade</Link>
            <Link href="#" className="hover:text-foreground">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
