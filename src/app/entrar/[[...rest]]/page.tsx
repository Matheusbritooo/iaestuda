import { SignIn } from "@clerk/nextjs";
import { Brain, CheckCircle2, Star, Users, Zap, Target, BarChart3, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: Target, text: "Banco de questões CESPE, FCC e VUNESP" },
  { icon: Brain, text: "IA Tutor personalizado por matéria" },
  { icon: BarChart3, text: "Dashboard estilo trading em tempo real" },
  { icon: TrendingUp, text: "Ranking global com gamificação" },
];

const STATS = [
  { value: "48k+", label: "aprovados" },
  { value: "94%", label: "satisfação" },
  { value: "2.1M", label: "questões respondidas" },
  { value: "4.9★", label: "avaliação" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[58%] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-neon glow-neon animate-pulse-neon">
            <Brain className="h-5 w-5 text-black" />
          </div>
          <div>
            <span className="font-bold text-xl text-gradient-neon">IAestuda</span>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">A plataforma #1 para concursos</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-primary font-medium border-neon">
              <Star className="h-3.5 w-3.5 fill-primary" />
              #1 Plataforma de Concursos do Brasil
            </div>
            <h1 className="text-5xl font-bold leading-[1.08]">
              Estude como os
              <br />
              <span className="text-gradient-full">aprovados</span>
              <br />
              estudam.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              IA personalizada, simulados reais e gamificação que torna o estudo viciante. Mais de 48 mil aprovados.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((f) => (
              <div key={f.text} className="glass flex items-center gap-2.5 rounded-xl px-3.5 py-3 border-white/8">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground/90">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5 grid grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-gradient-neon">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 flex items-start gap-3 border-neon">
            <div className="h-9 w-9 rounded-xl gradient-neon flex items-center justify-center shrink-0 text-black font-bold text-sm">A</div>
            <div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                &ldquo;Passei no TRF em 5 meses. O IA Tutor me explicava os erros em segundos. Impossível sem o IAestuda.&rdquo;
              </p>
              <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> Ana S. · Aprovada TRF 2025
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">© 2025 IAestuda · Tecnologia para aprovação</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-[360px] space-y-7">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg gradient-neon"><Brain className="h-4 w-4 text-black" /></div>
            <span className="font-bold text-lg text-gradient-neon">IAestuda</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Entre com Google em 1 clique</p>
          </div>

          <SignIn
            appearance={{
              layout: { socialButtonsPlacement: "top", socialButtonsVariant: "blockButton" },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-white/10 hover:bg-white/8 hover:border-primary/30 rounded-xl h-11 text-sm font-semibold text-foreground bg-white/4 transition-all duration-200 mb-2",
                socialButtonsBlockButtonText: "font-semibold",
                dividerRow: "my-4",
                dividerLine: "bg-white/8",
                dividerText: "text-muted-foreground text-xs",
                formFieldInput:
                  "bg-white/5 border border-white/10 rounded-xl h-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 focus:bg-white/8 transition-all",
                formFieldLabel: "text-sm font-medium text-foreground/80",
                formButtonPrimary:
                  "gradient-neon hover:opacity-90 rounded-xl h-10 text-sm font-bold text-black glow-neon transition-all",
                footerActionLink: "text-primary font-medium hover:text-primary/80",
                identityPreviewText: "text-sm text-foreground",
                alertText: "text-sm",
                formResendCodeLink: "text-primary",
              },
            }}
          />

          <div className="flex items-center justify-center gap-4 pt-2">
            {[
              { text: "Seguro" },
              { text: "Gratuito para começar" },
              { text: "Sem cartão" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
