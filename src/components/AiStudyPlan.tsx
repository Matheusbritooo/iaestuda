"use client";

import { useState, useTransition } from "react";
import { generateStudyPlan } from "@/app/actions";
import { Calendar, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiStudyPlan() {
  const [plan, setPlan] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function generate() {
    setPlan("");
    startTransition(async () => {
      const result = await generateStudyPlan();
      setPlan(result);
    });
  }

  function copy() {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          Cronograma Inteligente — IA
        </CardTitle>
        <div className="flex items-center gap-2">
          {plan && (
            <button onClick={copy} className="glass border-white/10 text-muted-foreground text-xs px-3 py-1.5 rounded-lg hover:text-foreground flex items-center gap-1.5 transition-colors">
              {copied ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          )}
          <button
            onClick={generate}
            disabled={isPending}
            className="gradient-neon text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Gerando..." : "Gerar cronograma"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {!plan && !isPending ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">📅</div>
            <p className="text-sm font-medium">Cronograma personalizado com IA</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              A IA analisa seu desempenho e cria um plano semanal otimizado para sua aprovação.
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl p-4 border-white/7 min-h-[250px]">
            {isPending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="text-sm ml-1">Montando seu cronograma personalizado...</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{plan}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
