"use client";

import { useState, useTransition } from "react";
import { reviewFlashcard } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Brain } from "lucide-react";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  subject: { name: string };
};

export default function FlashcardReview({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (cards.length === 0 || done) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <p className="text-lg font-semibold">Tudo revisado!</p>
            <p className="text-muted-foreground text-sm mt-1">
              Não há cards para revisar agora. Volte mais tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const card = cards[index];

  function handleQuality(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    startTransition(async () => {
      await reviewFlashcard(card.id, quality);
      if (index + 1 >= cards.length) {
        setDone(true);
      } else {
        setIndex(index + 1);
        setRevealed(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Badge variant="secondary">{card.subject.name}</Badge>
        <span>{index + 1} / {cards.length}</span>
      </div>

      <Card className="min-h-48">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pergunta</p>
            <p className="text-lg font-medium leading-relaxed">{card.question}</p>
          </div>

          {revealed ? (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Resposta</p>
              <p className="text-base leading-relaxed">{card.answer}</p>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setRevealed(true)}>
              Revelar resposta
            </Button>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="space-y-2">
          <p className="text-sm text-center text-muted-foreground">Como foi?</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={isPending}
              onClick={() => handleQuality(1)}
            >
              Errei
            </Button>
            <Button
              variant="outline"
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              disabled={isPending}
              onClick={() => handleQuality(3)}
            >
              Dificuldade
            </Button>
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              disabled={isPending}
              onClick={() => handleQuality(5)}
            >
              Fácil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
