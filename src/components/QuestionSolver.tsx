"use client";

import { useState, useTransition } from "react";
import { answerQuestion } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronRight, Lightbulb, RotateCcw } from "lucide-react";
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

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: { label: "Fácil", color: "text-primary border-primary/30" },
  medium: { label: "Médio", color: "text-amber-400 border-amber-400/30" },
  hard: { label: "Difícil", color: "text-red-400 border-red-400/30" },
};

export default function QuestionSolver({ question, nextQuestionId }: Props) {
  const [selected, setSelected] = useState<string | null>(question.previousAnswer?.optionId ?? null);
  const [revealed, setRevealed] = useState(!!question.previousAnswer);
  const [isPending, startTransition] = useTransition();
  const [startTime] = useState(Date.now());

  const cfg = DIFFICULTY_CONFIG[question.difficulty];
  const correctOption = question.options.find((o) => o.isCorrect);
  const isCorrect = selected === correctOption?.id;

  function handleSelect(optionId: string) {
    if (revealed) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    startTransition(async () => {
      await answerQuestion(question.id, optionId, timeSpent);
      setSelected(optionId);
      setRevealed(true);
    });
  }

  function getOptionStyle(option: Option) {
    if (!revealed) {
      return selected === option.id
        ? "border-primary/50 bg-primary/10 text-foreground"
        : "border-white/8 bg-white/2 text-foreground/80 hover:border-white/15 hover:bg-white/5";
    }
    if (option.isCorrect) return "border-primary/60 bg-primary/10 text-primary";
    if (selected === option.id && !option.isCorrect) return "border-destructive/60 bg-destructive/10 text-destructive";
    return "border-white/5 bg-white/2 text-muted-foreground";
  }

  return (
    <div className="space-y-5">
      {/* Question card */}
      <div className="glass-card border-white/5 rounded-2xl p-6 space-y-5 glow-card">
        <div className="flex items-center gap-2">
          {cfg && <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>}
        </div>

        <p className="text-base leading-relaxed text-foreground">{question.content}</p>

        <div className="space-y-2.5">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={revealed || isPending}
              className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${getOptionStyle(option)} disabled:cursor-default`}
            >
              <span className={`shrink-0 h-6 w-6 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                revealed && option.isCorrect ? "border-primary bg-primary text-black" :
                revealed && selected === option.id && !option.isCorrect ? "border-destructive bg-destructive text-white" :
                "border-white/20 text-muted-foreground"
              }`}>
                {option.letter}
              </span>
              <span className="text-sm leading-relaxed flex-1">{option.text}</span>
              {revealed && option.isCorrect && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
              {revealed && selected === option.id && !option.isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Result + explanation */}
      {revealed && (
        <div className={`rounded-2xl border p-5 space-y-3 transition-all ${isCorrect ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-bold text-primary">Resposta correta! 🎉</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-bold text-destructive">Resposta incorreta</span>
                <span className="text-sm text-muted-foreground">· Correta: <strong className="text-primary">{correctOption?.letter}</strong></span>
              </>
            )}
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium text-amber-400">Explicação</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{question.explanation}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      {revealed && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setSelected(null); setRevealed(false); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>

          {nextQuestionId ? (
            <Link href={`/questoes/${nextQuestionId}`}>
              <div className="gradient-neon glow-neon text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer">
                Próxima questão <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <Link href="/questoes">
              <div className="gradient-neon text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer">
                Ver todas as questões <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
