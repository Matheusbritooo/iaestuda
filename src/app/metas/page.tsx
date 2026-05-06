import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppHeader from "@/components/AppHeader";
import AddStudySessionForm from "@/components/AddStudySessionForm";

export default async function MetasPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());

  const [goals, subjects] = await Promise.all([
    prisma.dailyGoal.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.subject.findMany({
      where: { studyPlan: { userId: user.id } },
      orderBy: { priority: "asc" },
    }),
  ]);

  const streak = goals
    .slice()
    .reduce(
      (acc: { count: number; counting: boolean }, g) => {
        if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
        if (acc.counting && !g.completed) return { ...acc, counting: false };
        return acc;
      },
      { count: 0, counting: true }
    ).count;

  const todayGoal = goals.find((g) => startOfDay(g.date).getTime() === today.getTime());
  const todayProgress = todayGoal
    ? Math.min(100, (todayGoal.doneMinutes / todayGoal.targetMinutes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="metas" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Metas & Streak
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Streak atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-3xl font-bold">{streak}</p>
                  <p className="text-sm text-muted-foreground">dias consecutivos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Meta de hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={todayProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{todayGoal?.doneMinutes ?? 0} min</span>
                <span>{todayGoal?.targetMinutes ?? 120} min</span>
              </div>
              {todayGoal?.completed && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Concluída hoje!
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <AddStudySessionForm subjects={subjects} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico (14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3">
                  {goal.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm w-24 text-muted-foreground">
                    {format(goal.date, "EEE dd/MM", { locale: ptBR })}
                  </span>
                  <div className="flex-1">
                    <Progress
                      value={Math.min(100, (goal.doneMinutes / goal.targetMinutes) * 100)}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {goal.doneMinutes}/{goal.targetMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
