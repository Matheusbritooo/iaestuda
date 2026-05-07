"use client";

import { useState, useTransition } from "react";
import { answerQuestion } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, ChevronRight, Lightbulb,
  RotateCcw, Brain, Timer, Star,
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
    previousAnswer: PreviousAnswer;
  };
  nextQuestionId: string | null;
};

const DIFFICULTY_STYLE: Record<string, { label: string; color: string; dot: string }> = {
  easy: { label: "Fácil", color: "text-emerald-400 border-emerald-400/25", dot: "bg-emerald-400" },
  medium: { label: "Médio", color: "text-amber-400 border-amber-400/25", dot: "bg-amber-400" },
  hard: { label: "Difícil", color: "text-red-400 border-red-400/25", dot: "bg-red-400" },
};

export default function QuestionSolver({ question, nextQuestionId }: Props) {
  const [selected, setSelected] = useState<string | null>(question.previousAnswer?.optionId ?? null);
  const [revealed, setRevealed] = useState(!!question.previousAnswer);
  const [isPending, startTransition] = useTransition();
  const [startTime] = useState(Date.now());

  const diff = DIFFICULTY_STYLE[question.difficulty] ?? DIFFICULTY_STYLE.medium;
  const correctOption = question.options.find((o) => o.isCorrect);
  const isCorrect = selected === correctOption?.id;
  const timeSpent = Math.round((Date.now() - startTime) / 1000);

  function handleSelect(optionId: string) {
    if (revealed) return;
    startTransition(async () => {
      await answerQuestion(question.id, optionId, timeSpent);
      setSelected(optionId);
      setRevealed(true);
    });
  }

  function getOptionClass(option: Option) {
    if (!revealed) {
      return selected === option.id
        ? "border-primary/50 bg-primary/8 text-foreground"
        : "border-white/7 bg-white/2 text-foreground/80 hover:border-white/14 hover:bg-white/4 cursor-pointer";
    }
    if (option.isCorrect) return "border-emerald-400/50 bg-emerald-400/8 text-emerald-300";
    if (selected === option.id && !option.isCorrect) return "border-red-400/50 bg-red-400/8 text-red-300";
    return "border-white/5 bg-white/1 text-muted-foreground/50";
  }

  function getLetterClass(option: Option) {
    if (!revealed) return selected === option.id ? "border-primary bg-primary text-black" : "border-white/15 text-muted-foreground";
    if (option.isCorrect) return "border-emerald-400 bg-emerald-400 text-black";
    if (selected === option.id && !option.isCorrect) return "border-red-400 bg-red-400 text-white";
    return "border-white/10 text-muted-foreground/40";
  }

  return (
    <div className="space-y-4">
      {/* Question card */}
      <div className="glass-card border-white/7 rounded-2xl overflow-hidden">
        {/* Question header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
            <Badge variant="outline" className={`text-[10px] ${diff.color}`}>{diff.label}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground font-medium">{question.content}</p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={revealed || isPending}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${getOptionClass(option)} disabled:cursor-default`}
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
        <div className={`rounded-2xl border overflow-hidden transition-all animate-fade-up ${isCorrect ? "border-emerald-400/20" : "border-red-400/20"}`}>
          {/* Result banner */}
          <div className={`px-5 py-3 flex items-center gap-3 ${isCorrect ? "bg-emerald-400/8" : "bg-red-400/8"}`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-400">Resposta correta!</span>
                  <span className="text-xs text-muted-foreground ml-2">+10 XP</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[...Array(3)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-400" />
                <div>
                  <span className="font-bold text-red-400">Resposta incorreta</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    · Correta: <strong className="text-emerald-400">{correctOption?.letter}</strong>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Explanation */}
          <div className="p-5 space-y-3 bg-white/1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/10">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Explicação</span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">{question.explanation}</p>

            {/* Why each option */}
            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Por que cada alternativa:</p>
              {question.options.map((opt) => (
                <div key={opt.id} className="flex items-start gap-2.5 text-xs">
                  <span className={`shrink-0 font-bold mt-0.5 ${opt.isCorrect ? "text-emerald-400" : "text-red-400/70"}`}>
                    {opt.letter}
                  </span>
                  <span className={opt.isCorrect ? "text-emerald-400/80" : "text-muted-foreground/70"}>
                    {opt.isCorrect ? "✓ Correta — " : "✗ "}
                    {opt.text.length > 80 ? opt.text.slice(0, 80) + "..." : opt.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {revealed && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setSelected(null); setRevealed(false); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>

          {nextQuestionId ? (
            <Link href={`/questoes/${nextQuestionId}`}>
              <div className="gradient-neon glow-neon text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer">
                Próxima <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <Link href="/questoes">
              <div className="gradient-neon text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 cursor-pointer">
                Ver mais questões <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
