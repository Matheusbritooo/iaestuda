"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import { answerQuestion, explainQuestionWithAI } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, ChevronRight, Lightbulb,
  RotateCcw, Timer, Sparkles, Loader2, Brain,
  ThumbsUp, HelpCircle, Shuffle, Target,
} from "lucide-react";
import Link from "next/link";

type Option = { id: string; letter: string; text: string; isCorrect: boolean };
type PreviousAnswer = { optionId: string | null; isCorrect: boolean } | null;

type Props = {
  question: {
    id: string;
    content: string;
    options: Option[];
    explanation: string;
    difficulty: string;
    subject?: { name: string };
    previousAnswer: PreviousAnswer;
  };
  nextQuestionId: string | null;
  sessionStats?: { correct: number; total: number };
};

type Confidence = "sure" | "unsure" | "guess";

const DIFF_STYLE: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  easy: { label: "Fácil", color: "text-emerald-400", dot: "bg-emerald-400", bg: "border-emerald-400/20 bg-emerald-400/5" },
  medium: { label: "Médio", color: "text-amber-400", dot: "bg-amber-400", bg: "border-amber-400/20 bg-amber-400/5" },
  hard: { label: "Difícil", color: "text-red-400", dot: "bg-red-400", bg: "border-red-400/20 bg-red-400/5" },
};

const CONFIDENCE_CONFIG = {
  sure: { icon: ThumbsUp, label: "Tenho certeza", color: "border-primary/40 bg-primary/8 text-primary hover:bg-primary/15", selected: "border-primary bg-primary/15 text-primary" },
  unsure: { icon: HelpCircle, label: "Inseguro", color: "border-amber-400/40 bg-amber-400/8 text-amber-400 hover:bg-amber-400/15", selected: "border-amber-400 bg-amber-400/15 text-amber-400" },
  guess: { icon: Shuffle, label: "Vou chutar", color: "border-red-400/40 bg-red-400/8 text-red-400 hover:bg-red-400/15", selected: "border-red-400 bg-red-400/15 text-red-400" },
};

export default function QuestionSolver({ question, nextQuestionId, sessionStats }: Props) {
  const [confidence, setConfidence] = useState<Confidence | null>(
    question.previousAnswer ? "sure" : null
  );
  const [selected, setSelected] = useState<string | null>(question.previousAnswer?.optionId ?? null);
  const [revealed, setRevealed] = useState(!!question.previousAnswer);
  const [isPending, startTransition] = useTransition();
  const [aiExplanation, setAiExplanation] = useState("");
  const [isExplaining, startExplainTransition] = useTransition();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (revealed) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setTimeElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [revealed]);

  const diff = DIFF_STYLE[question.difficulty] ?? DIFF_STYLE.medium;
  const correctOption = question.options.find((o) => o.isCorrect);
  const isCorrect = selected === correctOption?.id;
  const chosenOption = question.options.find((o) => o.id === selected);

  function handleAnswer(optionId: string) {
    if (revealed || !confidence) return;
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    startTransition(async () => {
      await answerQuestion(question.id, optionId, timeSpent, "treino", confidence);
      setSelected(optionId);
      setRevealed(true);
    });
  }

  const handleAiExplain = useCallback(() => {
    if (!chosenOption || !question.subject) return;
    startExplainTransition(async () => {
      const explanation = await explainQuestionWithAI(
        question.content,
        question.options,
        chosenOption.letter,
        question.subject!.name,
        question.explanation
      );
      setAiExplanation(explanation);
    });
  }, [chosenOption, question]);

  function reset() { setSelected(null); setRevealed(false); setConfidence(null); setAiExplanation(""); startTime.current = Date.now(); setTimeElapsed(0); }

  function getOptionClass(option: Option) {
    if (!revealed) {
      if (!confidence) return "border-white/6 bg-white/1 text-foreground/40 cursor-not-allowed opacity-60";
      return selected === option.id
        ? "border-primary/50 bg-primary/10 text-foreground"
        : "border-white/8 bg-white/2 text-foreground/80 hover:border-white/15 hover:bg-white/4 cursor-pointer";
    }
    if (option.isCorrect) return "border-emerald-400/50 bg-emerald-400/8 text-emerald-300";
    if (selected === option.id && !option.isCorrect) return "border-red-400/50 bg-red-400/8 text-red-300";
    return "border-white/4 bg-white/1 text-muted-foreground/40";
  }

  function getLetterClass(option: Option) {
    if (!revealed) return selected === option.id ? "border-primary bg-primary text-black" : "border-white/15 text-muted-foreground";
    if (option.isCorrect) return "border-emerald-400 bg-emerald-400 text-black";
    if (selected === option.id) return "border-red-400 bg-red-400 text-white";
    return "border-white/8 text-muted-foreground/30";
  }

  // Session performance meter
  const sessionRate = sessionStats && sessionStats.total > 0
    ? Math.round((sessionStats.correct / sessionStats.total) * 100)
    : null;

  return (
    <div className="space-y-4">
      {/* Session stats bar */}
      {sessionStats && sessionStats.total > 0 && (
        <div className="glass rounded-xl border-white/5 px-4 py-2.5 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            <span>Sessão: <strong className={`${sessionRate! >= 70 ? "text-primary" : sessionRate! >= 50 ? "text-amber-400" : "text-red-400"}`}>{sessionRate}%</strong></span>
          </div>
          <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${sessionRate! >= 70 ? "gradient-neon" : sessionRate! >= 50 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${sessionRate}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{sessionStats.correct}/{sessionStats.total}</span>
          </div>
        </div>
      )}

      {/* Question card */}
      <div className="glass-card border-white/7 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
              <Badge variant="outline" className={`text-[10px] border ${diff.color} border-current/20`}>{diff.label}</Badge>
              {question.subject && (
                <Badge variant="outline" className="text-[10px] border-white/8 text-muted-foreground">{question.subject.name}</Badge>
              )}
            </div>
            {!revealed && (
              <div className={`flex items-center gap-1 text-xs ${timeElapsed > 90 ? "text-red-400" : timeElapsed > 60 ? "text-amber-400" : "text-muted-foreground"}`}>
                <Timer className="h-3.5 w-3.5" />
                <span className="font-mono">{String(Math.floor(timeElapsed / 60)).padStart(2, "0")}:{String(timeElapsed % 60).padStart(2, "0")}</span>
              </div>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground font-medium">{question.content}</p>
        </div>

        {/* Confidence selector */}
        {!revealed && (
          <div className="px-5 py-3 border-b border-white/5 bg-white/1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">
              <Brain className="h-3 w-3 inline mr-1" />Nível de confiança
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CONFIDENCE_CONFIG) as [Confidence, typeof CONFIDENCE_CONFIG[Confidence]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setConfidence(key)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${confidence === key ? cfg.selected : cfg.color}`}
                >
                  <cfg.icon className="h-3 w-3" />
                  {cfg.label}
                </button>
              ))}
            </div>
            {!confidence && (
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">Selecione sua confiança para liberar as alternativas</p>
            )}
          </div>
        )}

        {/* Options */}
        <div className="p-4 space-y-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={revealed || isPending || !confidence}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${getOptionClass(option)}`}
            >
              <span className={`shrink-0 h-6 w-6 rounded-lg border flex items-center justify-center text-[11px] font-bold transition-all ${getLetterClass(option)}`}>
                {option.letter}
              </span>
              <span className="text-sm leading-relaxed flex-1">{option.text}</span>
              {revealed && option.isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
              {revealed && selected === option.id && !option.isCorrect && <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Result + Explanation */}
      {revealed && (
        <div className={`rounded-2xl border overflow-hidden ${isCorrect ? "border-emerald-400/20" : "border-red-400/20"}`}>
          {/* Result banner */}
          <div className={`px-5 py-3 flex items-center gap-3 ${isCorrect ? "bg-emerald-400/8" : "bg-red-400/8"}`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-emerald-400">Resposta correta!</span>
                  {confidence && (
                    <span className={`text-xs ml-2 ${CONFIDENCE_CONFIG[confidence].color.split(" ").find(c => c.startsWith("text-"))}`}>
                      ({CONFIDENCE_CONFIG[confidence].label})
                    </span>
                  )}
                </div>
                <Badge className="bg-emerald-400/15 text-emerald-400 border-0 text-xs">+10 XP</Badge>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-red-400">Incorreta</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Correta: <strong className="text-emerald-400">{correctOption?.letter}</strong>
                  </span>
                </div>
                {confidence === "sure" && (
                  <Badge className="bg-red-400/15 text-red-400 border-0 text-xs">Revisar!</Badge>
                )}
              </>
            )}
          </div>

          {/* Time spent */}
          <div className="px-5 py-2 border-b border-white/5 flex items-center gap-3 text-xs text-muted-foreground bg-white/1">
            <Timer className="h-3 w-3" />
            <span>Tempo: <strong>{Math.floor(timeElapsed / 60) > 0 ? `${Math.floor(timeElapsed / 60)}min ` : ""}{timeElapsed % 60}s</strong></span>
            {timeElapsed > 120 && <span className="text-amber-400">· Questão lenta — revise o conteúdo</span>}
          </div>

          {/* Official explanation */}
          <div className="p-5 space-y-3 bg-white/1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/10">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Explicação oficial</span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{question.explanation}</p>

            {/* Why each option */}
            <div className="border-t border-white/5 pt-3 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Por que cada alternativa:</p>
              {question.options.map((opt) => (
                <div key={opt.id} className="flex items-start gap-2 text-xs">
                  <span className={`font-bold shrink-0 mt-0.5 ${opt.isCorrect ? "text-emerald-400" : "text-red-400/60"}`}>
                    {opt.isCorrect ? "✓" : "✗"} {opt.letter}
                  </span>
                  <span className={`leading-relaxed ${opt.isCorrect ? "text-emerald-400/80" : "text-muted-foreground/60"}`}>
                    {opt.text.length > 90 ? opt.text.slice(0, 90) + "..." : opt.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Explanation (only on wrong answers) */}
          {!isCorrect && question.subject && (
            <div className="px-5 pb-4">
              {!aiExplanation ? (
                <button
                  onClick={handleAiExplain}
                  disabled={isExplaining}
                  className="w-full flex items-center justify-center gap-2 gradient-purple text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isExplaining ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analisando seu erro com IA...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Explicar meu erro com IA</>
                  )}
                </button>
              ) : (
                <div className="glass border-secondary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-xs font-bold text-secondary uppercase tracking-wide">IA Tutor — Análise do seu erro</span>
                  </div>
                  <pre className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">{aiExplanation}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {revealed && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>

          {nextQuestionId ? (
            <Link href={`/questoes/${nextQuestionId}`}>
              <div className="gradient-neon glow-neon text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 cursor-pointer">
                Próxima <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <Link href="/questoes">
              <div className="gradient-neon text-black font-bold px-5 py-2 rounded-xl text-sm hover:opacity-90 cursor-pointer">
                Ver todas as questões
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
