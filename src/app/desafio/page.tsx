import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppHeader from "@/components/AppHeader";
import QuestionSolver from "@/components/QuestionSolver";
import { Zap, Flame, Trophy, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DesafioPage() {
  const user = await getOrCreateDbUser();

  // Pick today's challenge based on day of year (deterministic per day)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  const allQuestions = await prisma.question.findMany({
    where: { subject: { studyPlan: { userId: user.id } } },
    include: { options: { orderBy: { letter: "asc" } }, subject: { select: { name: true } } },
    orderBy: { id: "asc" },
  });

  const todayQuestion = allQuestions.length > 0
    ? allQuestions[dayOfYear % allQuestions.length]
    : null;

  const todayAnswer = todayQuestion
    ? await prisma.userAnswer.findFirst({
        where: { userId: user.id, questionId: todayQuestion.id },
        orderBy: { answeredAt: "desc" },
      })
    : null;

  const [streak, totalChallenges] = await Promise.all([
    prisma.dailyGoal.count({ where: { userId: user.id, completed: true } }),
    allQuestions.length,
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="desafio" />
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-primary font-medium border-neon">
            <Zap className="h-3.5 w-3.5" />
            Desafio do dia — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </div>
          <h1 className="text-2xl font-bold">
            Questão <span className="text-gradient-neon">do dia</span>
          </h1>
          <p className="text-muted-foreground text-sm">Uma questão por dia. Consistência é a chave da aprovação.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: `${streak}d`, color: "text-orange-400" },
            { icon: Calendar, label: "Hoje", value: format(new Date(), "dd/MM"), color: "text-primary" },
            { icon: Trophy, label: "Desafios", value: `${totalChallenges}`, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Question */}
        {todayQuestion ? (
          <QuestionSolver
            question={{
              id: todayQuestion.id,
              content: todayQuestion.content,
              options: todayQuestion.options,
              explanation: todayQuestion.explanation,
              difficulty: todayQuestion.difficulty,
              previousAnswer: todayAnswer
                ? { optionId: todayAnswer.optionId, isCorrect: todayAnswer.isCorrect }
                : null,
            }}
            nextQuestionId={null}
          />
        ) : (
          <Card className="glass-card border-dashed border-white/10">
            <CardContent className="py-16 text-center">
              <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma questão disponível ainda.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">O sistema está carregando seu conteúdo.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
