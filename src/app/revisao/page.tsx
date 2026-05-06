import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Brain } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FlashcardReview from "@/components/FlashcardReview";

export default async function RevisaoPage() {
  const user = await getOrCreateDbUser();

  const [cards, allCards] = await Promise.all([
    prisma.flashcard.findMany({
      where: { userId: user.id, nextReview: { lte: new Date() } },
      include: { subject: true },
      orderBy: { nextReview: "asc" },
    }),
    prisma.flashcard.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="revisao" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Revisão Espaçada
          </h1>
          <p className="text-muted-foreground mt-1">
            {cards.length} de {allCards} cards para revisar hoje
          </p>
        </div>

        <FlashcardReview cards={cards} />
      </main>
    </div>
  );
}
