"use client";

import { useState, useTransition } from "react";
import { generateAiAnalysis } from "@/app/actions";
import { BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiAnalysis() {
  const [analysis, setAnalysis] = useState("");
  const [isPending, startTransition] = useTransition();

  function generate() {
    setAnalysis("");
    startTransition(async () => {
      const result = await generateAiAnalysis();
      setAnalysis(result);
    });
  }

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Análise de Performance — IA
        </CardTitle>
        <button
          onClick={generate}
          disabled={isPending}
          className="gradient-neon text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Analisando..." : "Gerar análise"}
        </button>
      </CardHeader>
      <CardContent>
        {!analysis && !isPending ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">📊</div>
            <p className="text-sm font-medium">Análise personalizada com IA</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Diagnóstico completo do seu desempenho, pontos críticos e recomendações específicas.
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl p-4 border-white/7 min-h-[200px]">
            {isPending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
                <span className="text-sm ml-1">Analisando seus dados com IA...</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{analysis}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
