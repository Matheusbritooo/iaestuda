"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { answerQuestion } from "@/app/actions";
import { Timer, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

type Option = { id: string; letter: string; text: string; isCorrect: boolean };
type Question = { id: string; content: string; options: Option[]; explanation: string; subject: { name: string } };

export default function SimuladoClient({
  questions, userId, timeMinutes,
}: {
  questions: Question[];
  userId: string;
  timeMinutes: number;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{ questionId: string; correct: boolean; chosen?: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showReview, setShowReview] = useState(false);

  const finish = useCallback(() => {
    setFinished(true);
    const r = questions.map((q) => {
      const chosenId = answers[q.id];
      const chosenOpt = q.options.find((o) => o.id === chosenId);
      return { questionId: q.id, correct: chosenOpt?.isCorrect ?? false, chosen: chosenId };
    });
    setResults(r);
    startTransition(async () => {
      for (const q of questions) {
        const optId = answers[q.id];
        if (optId) await answerQuestion(q.id, optId, 0, "simulado");
      }
    });
  }, [answers, questions]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); finish(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, finish]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft < 300;
  const score = results.filter((r) => r.correct).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q = questions[current];

  if (finished && !showReview) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-8 pt-8">
        <div className={`inline-flex p-5 rounded-3xl ${pct >= 70 ? "gradient-neon glow-neon" : pct >= 50 ? "bg-amber-400/20 border border-amber-400/30" : "bg-destructive/20 border border-destructive/30"}`}>
          {pct >= 70 ? <Zap className="h-10 w-10 text-black" /> : pct >= 50 ? <AlertCircle className="h-10 w-10 text-amber-400" /> : <XCircle className="h-10 w-10 text-destructive" />}
        </div>

        <div>
          <p className="text-muted-foreground text-sm mb-1">Resultado do Simulado</p>
          <div className={`text-6xl font-bold ${pct >= 70 ? "text-gradient-neon" : pct >= 50 ? "text-amber-400" : "text-destructive"}`}>{pct}%</div>
          <p className="text-foreground/70 mt-2">{score} de {questions.length} acertos</p>
        </div>

        <div className="glass-card rounded-2xl border-white/5 p-5 space-y-3">
          {[
            { label: "Acertos", value: score, color: "text-primary" },
            { label: "Erros", value: questions.length - score, color: "text-destructive" },
            { label: "Em branco", value: questions.filter(q => !answers[q.id]).length, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={`font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowReview(true)} className="flex-1 glass border-white/10 text-foreground font-medium py-3 rounded-xl hover:border-white/20 transition-all text-sm">
            Ver gabarito
          </button>
          <Link href="/questoes/simulado" className="flex-1 gradient-neon glow-neon text-black font-bold py-3 rounded-xl hover:opacity-90 text-sm text-center">
            Novo simulado
          </Link>
        </div>
      </div>
    );
  }

  if (finished && showReview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Gabarito — {score}/{questions.length} acertos</h2>
          <Link href="/questoes/simulado" className="text-sm text-primary">Novo simulado →</Link>
        </div>
        {questions.map((q, i) => {
          const r = results.find((r) => r.questionId === q.id);
          const correct = q.options.find((o) => o.isCorrect);
          const chosen = q.options.find((o) => o.id === r?.chosen);
          return (
            <div key={q.id} className={`glass-card rounded-xl p-4 border ${r?.correct ? "border-primary/20" : "border-destructive/20"}`}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {r?.correct ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{i + 1}. {q.subject.name}</p>
                  <p className="text-sm text-foreground/90 line-clamp-2">{q.content}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-primary">Correta: <strong>{correct?.letter}</strong></span>
                    {chosen && !r?.correct && <span className="text-destructive">Sua resposta: <strong>{chosen.letter}</strong></span>}
                    {!chosen && <span className="text-muted-foreground">Em branco</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{current + 1}/{questions.length}</span>
          <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full gradient-neon rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={`flex items-center gap-2 glass rounded-xl px-3 py-1.5 border ${isWarning ? "border-destructive/30 text-destructive animate-pulse" : "border-white/10 text-foreground"}`}>
          <Timer className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Mini map */}
      <div className="flex gap-1 flex-wrap">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-6 w-6 rounded text-[10px] font-bold transition-all ${
            i === current ? "gradient-neon text-black" :
            answers[questions[i].id] ? "bg-primary/20 text-primary border border-primary/30" :
            "bg-white/5 text-muted-foreground hover:bg-white/10"
          }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="glass-card rounded-2xl border-white/5 p-6 space-y-5">
        <div>
          <p className="text-xs text-muted-foreground mb-2">{q.subject.name}</p>
          <p className="text-base leading-relaxed text-foreground">{q.content}</p>
        </div>
        <div className="space-y-2.5">
          {q.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
              className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                answers[q.id] === opt.id
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-white/8 bg-white/2 text-foreground/80 hover:border-white/15 hover:bg-white/5"
              }`}
            >
              <span className={`shrink-0 h-6 w-6 rounded-lg border flex items-center justify-center text-xs font-bold ${answers[q.id] === opt.id ? "border-primary bg-primary text-black" : "border-white/20 text-muted-foreground"}`}>
                {opt.letter}
              </span>
              <span className="text-sm leading-relaxed">{opt.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="flex items-center gap-1.5 glass border-white/10 text-muted-foreground px-4 py-2 rounded-xl text-sm disabled:opacity-30 hover:border-white/20 transition-all">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="flex items-center gap-1.5 gradient-neon text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Próxima <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={finish} disabled={isPending} className="gradient-neon glow-neon text-black font-bold px-6 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            <Zap className="h-4 w-4" /> Finalizar simulado
          </button>
        )}
      </div>
    </div>
  );
}
