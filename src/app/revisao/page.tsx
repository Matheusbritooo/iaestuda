import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Brain } from "lucide-react";
import AppLayout from "@/components/AppLayout";
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
    <AppLayout active="revisao">
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gradient-neon flex items-center gap-2">
            <Brain className="h-6 w-6" /> Revisão Espaçada
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {cards.length} de {allCards} cards para revisar hoje
          </p>
        </div>
        <FlashcardReview cards={cards} />
      </div>
    </AppLayout>
  );
}
