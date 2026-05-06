"use client";

import { useTransition } from "react";
import { completeLesson } from "@/app/actions";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export default function CompleteLessonButton({
  lessonId, isCompleted, subjectId,
}: {
  lessonId: string;
  isCompleted: boolean;
  subjectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => completeLesson(lessonId, subjectId))}
      disabled={isPending || isCompleted}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
        isCompleted
          ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
          : "gradient-neon glow-neon text-black hover:opacity-90"
      }`}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {isCompleted ? "Aula concluída" : "Marcar como concluída"}
    </button>
  );
}
