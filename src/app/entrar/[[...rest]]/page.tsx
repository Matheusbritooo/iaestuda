import { SignIn } from "@clerk/nextjs";
import { Brain, Zap, Target, TrendingUp, Users, Star } from "lucide-react";

const stats = [
  { value: "94%", label: "taxa de aprovação" },
  { value: "48k+", label: "alunos ativos" },
  { value: "2.1M", label: "questões resolvidas" },
  { value: "4.9★", label: "avaliação" },
];

const features = [
  { icon: Target, label: "Banco de questões por banca" },
  { icon: Brain, label: "IA que explica seus erros" },
  { icon: TrendingUp, label: "Dashboard estilo trading" },
  { icon: Zap, label: "Revisão espaçada com IA" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-3/5 flex-col justify-between p-14 relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-neon glow-neon">
            <Brain className="h-5 w-5 text-black" />
          </div>
          <div>
            <span className="font-bold text-xl text-gradient-neon">IAestuda</span>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Powered by IA · Premium</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-primary font-medium border-neon">
              <Star className="h-3 w-3" />
              #1 Plataforma de Concursos do Brasil
            </div>
            <h1 className="text-5xl font-bold leading-[1.1]">
              Estude como
              <br />
              <span className="text-gradient-neon">os aprovados</span>
              <br />
              estudam.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Tecnologia de ponta, gamificação real e IA que te conhece.
              Transforme horas de estudo em aprovação.
            </p>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-2">
            {features.map((f) => (
              <div key={f.label} className="glass flex items-center gap-2.5 rounded-xl px-3.5 py-2.5">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground/90">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="glass rounded-2xl p-5 grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-gradient-neon">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="glass rounded-xl p-4 flex items-start gap-3 border-neon">
            <div className="h-9 w-9 rounded-full gradient-neon flex items-center justify-center shrink-0 text-black font-bold text-sm">
              A
            </div>
            <div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                &ldquo;Aprovada no TRT em 5 meses. O dashboard de progresso e os simulados foram decisivos.&rdquo;
              </p>
              <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> Ana S. · Aprovada TRT 2025
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © 2025 IAestuda · Tecnologia para aprovação
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg gradient-neon">
              <Brain className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-lg text-gradient-neon">IAestuda</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Acesse sua conta e continue evoluindo</p>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-white/10 hover:bg-white/5 rounded-xl h-10 text-sm font-medium text-foreground bg-white/3 transition-all",
                dividerRow: "my-5",
                dividerLine: "bg-white/8",
                dividerText: "text-muted-foreground text-xs",
                formFieldInput: "bg-white/5 border border-white/10 rounded-xl h-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 transition-colors",
                formFieldLabel: "text-sm font-medium text-foreground/80",
                formButtonPrimary: "gradient-neon hover:opacity-90 rounded-xl h-10 text-sm font-bold text-black glow-neon transition-all",
                footerActionLink: "text-primary font-medium hover:text-primary/80",
                identityPreviewText: "text-sm text-foreground",
                alertText: "text-sm",
                formResendCodeLink: "text-primary",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
