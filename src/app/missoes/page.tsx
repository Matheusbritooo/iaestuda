import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAILY_MISSIONS, WEEKLY_MISSIONS, getDailyPeriod, getWeeklyPeriod, computeMissionProgress } from "@/lib/missions";
import { CheckCircle2, Zap, Trophy, Star, Lock } from "lucide-react";
import { startOfDay, subDays } from "date-fns";

export default async function MissoesPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 6);
  const dailyPeriod = getDailyPeriod();
  const weeklyPeriod = getWeeklyPeriod();

  const [todaySessions, todayAnswers, todayFlashcards, todayLessons, weekSessions, weekAnswers, weekCorrect, weekLessons, weekSimulados, dailyGoals, completedMissions, dailyChallengeAnswered] = await Promise.all([
    prisma.studySession.aggregate({ where: { userId: user.id, date: { gte: today } }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId: user.id, answeredAt: { gte: today } } }),
    prisma.flashcard.count({ where: { userId: user.id, repetitions: { gt: 0 }, nextReview: { gte: today } } }),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { gte: today } } }),
    prisma.studySession.aggregate({ where: { userId: user.id, date: { gte: sevenDaysAgo } }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId: user.id, answeredAt: { gte: sevenDaysAgo } } }),
    prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true, answeredAt: { gte: sevenDaysAgo } } }),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { gte: sevenDaysAgo } } }),
    prisma.userAnswer.count({ where: { userId: user.id, mode: "simulado", answeredAt: { gte: sevenDaysAgo } } }),
    prisma.dailyGoal.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 10 }),
    prisma.userMission.findMany({ where: { userId: user.id, OR: [{ period: dailyPeriod }, { period: weeklyPeriod }], completedAt: { not: null } }, select: { missionId: true } }),
    prisma.userAnswer.count({ where: { userId: user.id, answeredAt: { gte: today } } }),
  ]);

  const streak = [...dailyGoals].reduce((acc: { count: number; counting: boolean }, g) => {
    if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
    if (acc.counting && !g.completed) return { ...acc, counting: false };
    return acc;
  }, { count: 0, counting: true }).count;

  const completedIds = new Set(completedMissions.map((m) => m.missionId));
  const stats = {
    todayMinutes: todaySessions._sum.minutes ?? 0,
    todayAnswers, todayCorrect: 0, todayFlashcards, todayLessons,
    todayChallengeAnswered: dailyChallengeAnswered > 0,
    weekMinutes: weekSessions._sum.minutes ?? 0,
    weekAnswers, weekCorrect, weekLessons, weekSimulados, streak,
  };

  const allMissions = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].map((m) => {
    const { progress, target } = computeMissionProgress(m.id, stats);
    const completed = completedIds.has(m.id) || progress >= target;
    return { ...m, progress: Math.min(progress, target), target, completed };
  });

  const daily = allMissions.filter((m) => m.type === "daily");
  const weekly = allMissions.filter((m) => m.type === "weekly");
  const totalXpAvailable = allMissions.reduce((a, m) => a + m.xp, 0);
  const totalXpEarned = allMissions.filter((m) => m.completed).reduce((a, m) => a + m.xp, 0);
  const completedCount = allMissions.filter((m) => m.completed).length;

  return (
    <AppLayout active="missoes">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              <span className="text-gradient-full">Missões</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Complete missões diárias e semanais para ganhar XP</p>
          </div>
          <div className="glass-card rounded-2xl px-5 py-3 border-neon text-center">
            <p className="text-2xl font-bold text-gradient-neon">{totalXpEarned}</p>
            <p className="text-[10px] text-muted-foreground">de {totalXpAvailable} XP disponíveis</p>
            <div className="h-1 bg-white/6 rounded-full overflow-hidden mt-2">
              <div className="h-full gradient-neon rounded-full" style={{ width: `${(totalXpEarned / totalXpAvailable) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Progress overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Concluídas hoje", value: daily.filter(m => m.completed).length, total: daily.length, color: "text-primary" },
            { label: "Semanais", value: weekly.filter(m => m.completed).length, total: weekly.length, color: "text-amber-400" },
            { label: "XP ganho hoje", value: daily.filter(m => m.completed).reduce((a, m) => a + m.xp, 0), total: null, color: "text-secondary" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}{s.total !== null ? `/${s.total}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily missions */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Missões Diárias
              <Badge className="gradient-neon text-black border-0 text-xs ml-auto">Reinicia à meia-noite</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {daily.map((mission) => (
              <div key={mission.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${mission.completed ? "border-primary/25 bg-primary/5" : "border-white/6 bg-white/1 hover:border-white/12"}`}>
                <span className="text-2xl">{mission.icon}</span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${mission.completed ? "text-primary" : "text-foreground/90"}`}>{mission.title}</p>
                    {mission.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{mission.progress}/{mission.target}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${mission.completed ? "gradient-neon" : "bg-primary/50"}`}
                      style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}
                    />
                  </div>
                </div>
                <Badge className={`shrink-0 text-xs font-bold ${mission.completed ? "gradient-neon text-black border-0" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                  <Zap className="h-3 w-3 mr-0.5" />{mission.xp} XP
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly missions */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" /> Missões Semanais
              <Badge className="bg-amber-400/15 text-amber-400 border-0 text-xs ml-auto">Reinicia toda segunda</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekly.map((mission) => (
              <div key={mission.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${mission.completed ? "border-amber-400/25 bg-amber-400/5" : "border-white/6 bg-white/1 hover:border-white/12"}`}>
                <span className="text-2xl">{mission.icon}</span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${mission.completed ? "text-amber-400" : "text-foreground/90"}`}>{mission.title}</p>
                    {mission.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{mission.progress}/{mission.target}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${mission.completed ? "bg-amber-400" : "bg-amber-400/40"}`}
                      style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}
                    />
                  </div>
                </div>
                <Badge className={`shrink-0 text-xs font-bold ${mission.completed ? "bg-amber-400 text-black border-0" : "bg-amber-400/10 text-amber-400 border-amber-400/20"}`}>
                  <Zap className="h-3 w-3 mr-0.5" />{mission.xp} XP
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
