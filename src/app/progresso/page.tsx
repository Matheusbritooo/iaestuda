import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import AppLayout from "@/components/AppLayout";
import ProgressChart from "@/components/ProgressChart";

export default async function ProgressoPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 6);

  const [sessions, goals, subjectSessions] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: user.id, date: { gte: sevenDaysAgo } },
      include: { subject: true }, orderBy: { date: "asc" },
    }),
    prisma.dailyGoal.findMany({
      where: { userId: user.id, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.studySession.groupBy({
      by: ["subjectId"],
      where: { userId: user.id },
      _sum: { minutes: true },
      orderBy: { _sum: { minutes: "desc" } },
    }),
  ]);

  const subjectNames = await prisma.subject.findMany({
    where: { id: { in: subjectSessions.map((s) => s.subjectId) } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(subjectNames.map((s) => [s.id, s.name]));

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayMinutes = sessions.filter((s) => startOfDay(s.date).getTime() === date.getTime()).reduce((a, s) => a + s.minutes, 0);
    const goal = goals.find((g) => startOfDay(g.date).getTime() === date.getTime());
    return { day: format(date, "EEE"), minutos: dayMinutes, meta: goal?.targetMinutes ?? 120 };
  });

  const totalWeekMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const daysGoalMet = goals.filter((g) => g.completed).length;

  return (
    <AppLayout active="progresso">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gradient-neon flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Progresso
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Últimos 7 dias</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total na semana", value: `${Math.round(totalWeekMinutes / 60)}h ${totalWeekMinutes % 60}min`, color: "text-primary" },
            { label: "Dias com meta", value: `${daysGoalMet}/7`, color: "text-secondary" },
            { label: "Média por sessão", value: `${sessions.length > 0 ? Math.round(totalWeekMinutes / sessions.length) : 0}min`, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-white/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Minutos por dia</CardTitle></CardHeader>
          <CardContent><ProgressChart data={dailyData} /></CardContent>
        </Card>

        {subjectSessions.length > 0 && (
          <Card className="glass-card border-white/5">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Tempo por matéria</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {subjectSessions.map((s) => {
                const mins = s._sum.minutes ?? 0;
                const maxMins = subjectSessions[0]._sum.minutes ?? 1;
                return (
                  <div key={s.subjectId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground/90">{nameMap[s.subjectId]}</span>
                      <span className="text-muted-foreground text-xs">{mins}min</span>
                    </div>
                    <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div className="h-full gradient-neon rounded-full" style={{ width: `${Math.round((mins / maxMins) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
