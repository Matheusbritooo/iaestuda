import { SignUp } from "@clerk/nextjs";
import { Brain, Zap, Target, TrendingUp } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative text-center space-y-8 max-w-xs">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl gradient-primary shadow-2xl">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-3">Comece hoje.</h1>
            <p className="text-indigo-200 leading-relaxed">
              Crie sua conta gratuita e monte seu plano de estudos em menos de 2 minutos.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { icon: Zap, text: "Setup em 2 minutos" },
              { icon: Target, text: "Plano baseado no seu edital" },
              { icon: TrendingUp, text: "Progresso visível desde o dia 1" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <item.icon className="h-4 w-4 text-violet-300" />
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div className="p-1.5 rounded-lg gradient-primary">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">IAestuda</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Crie sua conta</h2>
            <p className="text-muted-foreground text-sm">
              Gratuito para começar. Sem cartão de crédito.
            </p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-border hover:bg-accent rounded-lg h-10 text-sm font-medium",
                formFieldInput:
                  "border border-input rounded-lg h-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary",
                formButtonPrimary:
                  "gradient-primary hover:opacity-90 rounded-lg h-10 text-sm font-semibold",
                footerActionLink: "text-primary font-medium",
                formFieldLabel: "text-sm font-medium text-foreground",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
