import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import QuestionSolver from "@/components/QuestionSolver";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Target } from "lucide-react";
import Link from "next/link";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateDbUser();

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: { orderBy: { letter: "asc" } },
      subject: { select: { name: true } },
      answers: { where: { userId: user.id }, orderBy: { answeredAt: "desc" }, take: 1 },
    },
  });
  if (!question) notFound();

  const nextQuestion = await prisma.question.findFirst({
    where: { subject: { studyPlan: { userId: user.id } }, id: { not: id }, answers: { none: { userId: user.id } } },
    select: { id: true },
  });

  return (
    <AppLayout active="questoes">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/questoes" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Questões
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">{question.subject.name}</span>
            <Badge variant="outline" className="border-white/8 text-muted-foreground text-xs">{question.banca} {question.year}</Badge>
          </div>
        </div>

        <QuestionSolver
          question={{
            id: question.id,
            content: question.content,
            options: question.options,
            explanation: question.explanation,
            difficulty: question.difficulty,
            previousAnswer: question.answers[0] ?? null,
          }}
          nextQuestionId={nextQuestion?.id ?? null}
        />
      </div>
    </AppLayout>
  );
}
