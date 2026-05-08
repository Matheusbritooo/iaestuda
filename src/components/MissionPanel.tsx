import { prisma } from "@/lib/prisma";
import { DAILY_MISSIONS, WEEKLY_MISSIONS, getDailyPeriod, getWeeklyPeriod, computeMissionProgress, type MissionStatus } from "@/lib/missions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Zap, Trophy } from "lucide-react";
import Link from "next/link";
import { startOfDay, subDays } from "date-fns";

export default async function MissionPanel({ userId }: { userId: string }) {
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 6);
  const dailyPeriod = getDailyPeriod();
  const weeklyPeriod = getWeeklyPeriod();

  const [
    todaySessions, todayAnswers, todayFlashcards, todayLessons,
    weekSessions, weekAnswers, weekCorrect, weekLessons, weekSimulados,
    dailyGoals, completedMissions, dailyChallengeAnswered,
  ] = await Promise.all([
    prisma.studySession.aggregate({ where: { userId, date: { gte: today } }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId, answeredAt: { gte: today } } }),
    prisma.flashcard.count({ where: { userId, repetitions: { gt: 0 }, nextReview: { gte: today } } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { gte: today } } }),
    prisma.studySession.aggregate({ where: { userId, date: { gte: sevenDaysAgo } }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId, answeredAt: { gte: sevenDaysAgo } } }),
    prisma.userAnswer.count({ where: { userId, isCorrect: true, answeredAt: { gte: sevenDaysAgo } } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { gte: sevenDaysAgo } } }),
    prisma.userAnswer.count({ where: { userId, mode: "simulado", answeredAt: { gte: sevenDaysAgo } } }),
    prisma.dailyGoal.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.userMission.findMany({ where: { userId, OR: [{ period: dailyPeriod }, { period: weeklyPeriod }], completedAt: { not: null } }, select: { missionId: true } }),
    prisma.userAnswer.count({ where: { userId, answeredAt: { gte: today } } }),
  ]);

  const streak = [...dailyGoals].reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const completedIds = new Set(completedMissions.map((m) => m.missionId));
  const stats = {
    todayMinutes: todaySessions._sum.minutes ?? 0,
    todayAnswers,
    todayCorrect: 0,
    todayFlashcards,
    todayLessons,
    todayChallengeAnswered: dailyChallengeAnswered > 0,
    weekMinutes: weekSessions._sum.minutes ?? 0,
    weekAnswers,
    weekCorrect,
    weekLessons,
    weekSimulados,
    streak,
  };

  const buildStatus = (missions: typeof DAILY_MISSIONS, period: string): MissionStatus[] =>
    missions.map((m) => {
      const { progress, target } = computeMissionProgress(m.id, stats);
      const completed = completedIds.has(m.id) || progress >= target;
      return { ...m, progress: Math.min(progress, target), target, completed, period };
    });

  const dailyStatuses = buildStatus(DAILY_MISSIONS, dailyPeriod);
  const weeklyStatuses = buildStatus(WEEKLY_MISSIONS, weeklyPeriod);
  const dailyXp = dailyStatuses.filter((m) => m.completed).reduce((a, m) => a + m.xp, 0);
  const dailyTotal = dailyStatuses.reduce((a, m) => a + m.xp, 0);

  return (
    <Card className="glass-card border-white/5 glow-card">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Missões
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="gradient-neon text-black border-0 text-xs font-bold">
            {dailyXp}/{dailyTotal} XP hoje
          </Badge>
          <Link href="/missoes" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily missions */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Missões diárias</p>
          <div className="space-y-2">
            {dailyStatuses.slice(0, 4).map((mission) => (
              <div key={mission.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${mission.completed ? "border-primary/20 bg-primary/5" : "border-white/5 bg-white/1 hover:border-white/10"}`}>
                <span className="text-base shrink-0">{mission.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-medium ${mission.completed ? "text-primary" : "text-foreground/80"}`}>{mission.title}</p>
                    <div className="flex items-center gap-1">
                      {mission.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">{mission.progress}/{mission.target}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${mission.completed ? "gradient-neon" : "bg-primary/40"}`}
                      style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${mission.completed ? "gradient-neon text-black border-0" : "bg-white/5 text-muted-foreground"}`}>
                  <Zap className="h-2.5 w-2.5 mr-0.5" />{mission.xp}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly highlight */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Missão semanal em destaque</p>
          {weeklyStatuses.filter((m) => !m.completed).slice(0, 1).map((mission) => (
            <div key={mission.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-400/20 bg-amber-400/5">
              <span className="text-xl">{mission.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400">{mission.title}</p>
                <p className="text-[10px] text-muted-foreground">{mission.description}</p>
                <div className="h-1 bg-white/6 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${(mission.progress / mission.target) * 100}%` }} />
                </div>
              </div>
              <Badge className="bg-amber-400/15 text-amber-400 border-0 text-[10px] shrink-0">
                +{mission.xp} XP
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
