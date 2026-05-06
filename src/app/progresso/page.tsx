import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppHeader from "@/components/AppHeader";
import ProgressChart from "@/components/ProgressChart";

export default async function ProgressoPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 6);

  const [sessions, goals, subjectSessions] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: user.id, date: { gte: sevenDaysAgo } },
      include: { subject: true },
      orderBy: { date: "asc" },
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
    const dayMinutes = sessions
      .filter((s) => startOfDay(s.date).getTime() === date.getTime())
      .reduce((a, s) => a + s.minutes, 0);
    const goal = goals.find((g) => startOfDay(g.date).getTime() === date.getTime());
    return {
      day: format(date, "dd/MM"),
      minutos: dayMinutes,
      meta: goal?.targetMinutes ?? 120,
    };
  });

  const totalWeekMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const daysGoalMet = goals.filter((g) => g.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="progresso" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Progresso
          </h1>
          <p className="text-muted-foreground mt-1">Últimos 7 dias de estudo</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{Math.round(totalWeekMinutes / 60)}h</p>
              <p className="text-sm text-muted-foreground">{totalWeekMinutes} min na semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{daysGoalMet}/7</p>
              <p className="text-sm text-muted-foreground">Dias com meta cumprida</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">
                {sessions.length > 0 ? Math.round(totalWeekMinutes / sessions.length) : 0} min
              </p>
              <p className="text-sm text-muted-foreground">Média por sessão</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Minutos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={dailyData} />
          </CardContent>
        </Card>

        {subjectSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tempo por matéria (total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subjectSessions.map((s) => {
                  const mins = s._sum.minutes ?? 0;
                  const maxMins = subjectSessions[0]._sum.minutes ?? 1;
                  return (
                    <div key={s.subjectId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{nameMap[s.subjectId] ?? s.subjectId}</span>
                        <span className="text-muted-foreground">{mins} min</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.round((mins / maxMins) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
