"use client";

import { useState, useRef } from "react";
import { Calendar, Loader2, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiStudyPlan() {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    setPlan("");
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/ai/plan", { signal: ac.signal });
      if (!res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setPlan(acc);
      }
    } catch {
      setPlan("Erro ao gerar cronograma. Verifique sua chave ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(plan);
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
            <button onClick={copyToClipboard} className="glass border-white/10 text-muted-foreground text-xs px-3 py-1.5 rounded-lg hover:text-foreground flex items-center gap-1.5">
              <Download className="h-3 w-3" /> Copiar
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="gradient-neon text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {loading ? "Gerando..." : "Gerar cronograma"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {!plan && !loading && (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">📅</div>
            <p className="text-sm font-medium">Cronograma personalizado com IA</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              A IA analisa seu desempenho por matéria, o prazo da sua prova e distribui
              o tempo de estudo de forma otimizada para maximizar suas chances de aprovação.
            </p>
          </div>
        )}

        {(plan || loading) && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-4 border-white/7 min-h-[250px]">
              {plan ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{plan}</pre>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Montando seu cronograma personalizado...</span>
                </div>
              )}
            </div>
            {plan && (
              <p className="text-[10px] text-muted-foreground text-center">
                Cronograma gerado pela IA com base no seu perfil · Válido para esta semana
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
