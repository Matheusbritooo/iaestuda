import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppLayout from "@/components/AppLayout";
import AddStudySessionForm from "@/components/AddStudySessionForm";

export default async function MetasPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());

  const [goals, subjects] = await Promise.all([
    prisma.dailyGoal.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 14 }),
    prisma.subject.findMany({ where: { studyPlan: { userId: user.id } }, orderBy: { priority: "asc" } }),
  ]);

  const streak = goals.slice().reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const todayGoal = goals.find((g) => startOfDay(g.date).getTime() === today.getTime());
  const todayProgress = todayGoal ? Math.min(100, (todayGoal.doneMinutes / todayGoal.targetMinutes) * 100) : 0;

  return (
    <AppLayout active="metas">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gradient-neon flex items-center gap-2">
            <Trophy className="h-6 w-6" /> Metas & Streak
          </h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="glass-card border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Streak atual</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-3xl font-bold">{streak}</p>
                <p className="text-sm text-muted-foreground">dias consecutivos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Meta de hoje</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <div className="h-full gradient-neon rounded-full transition-all" style={{ width: `${todayProgress}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{todayGoal?.doneMinutes ?? 0} min</span>
                <span className="text-muted-foreground">{todayGoal?.targetMinutes ?? 120} min</span>
              </div>
              {todayGoal?.completed && <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10">Meta cumprida!</Badge>}
            </CardContent>
          </Card>
        </div>

        <AddStudySessionForm subjects={subjects} />

        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Histórico (14 dias)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3">
                {goal.completed ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                <span className="text-xs w-24 text-muted-foreground">{format(goal.date, "EEE dd/MM", { locale: ptBR })}</span>
                <div className="flex-1">
                  <Progress value={Math.min(100, (goal.doneMinutes / goal.targetMinutes) * 100)} className="h-1.5 bg-white/6" />
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{goal.doneMinutes}/{goal.targetMinutes}min</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
