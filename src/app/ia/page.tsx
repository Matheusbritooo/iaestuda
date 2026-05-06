import AppHeader from "@/components/AppHeader";
import AiChat from "@/components/AiChat";
import { Sparkles, Brain, Zap, Target } from "lucide-react";

const STARTERS = [
  "Explique o princípio da legalidade na CF/88",
  "Como funciona a revisão espaçada?",
  "Qual a diferença entre juízo e tribunal de exceção?",
  "Crie um resumo sobre conectivos lógicos",
  "Me dê 3 dicas para não errar questões de Português",
];

export default function IaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader active="ia" />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8 gap-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 border-neon">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">IA Tutor · Powered by Claude</span>
          </div>
          <h1 className="text-3xl font-bold">
            Seu tutor <span className="text-gradient-neon">inteligente</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Tire dúvidas, peça resumos, explique questões erradas e Monte seu plano de estudo com IA.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: Brain, label: "Explica conteúdos" },
            { icon: Target, label: "Analisa seus erros" },
            { icon: Zap, label: "Cria resumos" },
            { icon: Sparkles, label: "Sugere plano de estudos" },
          ].map((f) => (
            <div key={f.label} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground border-white/8">
              <f.icon className="h-3 w-3 text-primary" />
              {f.label}
            </div>
          ))}
        </div>

        {/* Chat */}
        <AiChat starters={STARTERS} />
      </main>
    </div>
  );
}
