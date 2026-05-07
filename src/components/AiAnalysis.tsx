"use client";

import { useState, useRef } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiAnalysis() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    setAnalysis("");
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai/analyze", { signal: ac.signal });
      if (!res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setAnalysis(acc);
      }
    } catch {
      setAnalysis("Erro ao gerar análise. Verifique sua chave ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          className="gradient-neon text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {loading ? "Analisando..." : "Gerar análise"}
        </button>
      </CardHeader>
      <CardContent>
        {!analysis && !loading && (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">📊</div>
            <p className="text-sm font-medium">Análise personalizada com IA</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Clique em "Gerar análise" para receber um diagnóstico completo do seu desempenho,
              pontos críticos e recomendações específicas para sua aprovação.
            </p>
          </div>
        )}

        {(analysis || loading) && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-4 border-white/7 min-h-[200px]">
              {analysis ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{analysis}</pre>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Analisando seus dados...</span>
                </div>
              )}
            </div>
            {analysis && (
              <p className="text-[10px] text-muted-foreground text-center">
                Gerado pela IA com base no seu histórico completo · Atualizado agora
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
