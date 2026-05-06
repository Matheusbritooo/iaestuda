"use client";

import { useTransition } from "react";
import { completeMaterial } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export default function CompleteMaterialButton({
  materialId,
  isCompleted,
}: {
  materialId: string;
  isCompleted: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => completeMaterial(materialId))}
      disabled={isPending || isCompleted}
      variant={isCompleted ? "secondary" : "default"}
      className={isCompleted ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "gradient-primary text-white border-0 hover:opacity-90"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-4 w-4 mr-2" />
      ) : (
        <Circle className="h-4 w-4 mr-2" />
      )}
      {isCompleted ? "Concluído" : "Marcar como concluído"}
    </Button>
  );
}
