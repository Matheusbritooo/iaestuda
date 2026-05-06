import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { getLevelInfo } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import ActivityGrid from "@/components/ActivityGrid";
import RankingCard from "@/components/RankingCard";
import {
  Flame, Trophy, Clock, BookOpen, Brain, BarChart3,
  TrendingUp, Zap, ArrowRight, CheckCircle2, Target,
  Sparkles, Star, ChevronUp, ChevronDown, Play,
} from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const [
    dailyGoals, recentSessions, flashcardsToReview,
    studyPlan, allSessions, materialsDone, totalMaterials,
    totalAnswers, correctAnswers, lessonsCompleted, totalLessons,
  ] = await Promise.all([
    prisma.dailyGoal.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 14 }),
    prisma.studySession.findMany({ where: { userId }, include: { subject: true }, orderBy: { date: "desc" }, take: 4 }),
    prisma.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
    prisma.studyPlan.findFirst({
      where: { userId },
      include: {
        subjects: {
          include: {
            studySessions: { where: { userId }, select: { minutes: true } },
            flashcards: { where: { userId }, select: { repetitions: true } },
          },
        },
      },
    }),
    prisma.studySession.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, select: { date: true, minutes: true } }),
    prisma.materialProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.material.count({ where: { subject: { studyPlan: { userId } } } }),
    prisma.userAnswer.count({ where: { userId } }),
    prisma.userAnswer.count({ where: { userId, isCorrect: true } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.lesson.count({ where: { subject: { studyPlan: { userId } } } }),
  ]);

  const todayGoal = dailyGoals.find((g) => startOfDay(g.date).getTime() === today.getTime());
  const streak = [...dailyGoals].reverse().reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const totalMinutes = allSessions.reduce((a, s) => a + s.minutes, 0);
  const weekMinutes = allSessions.filter((s) => s.date >= subDays(today, 7)).reduce((a, s) => a + s.minutes, 0);
  const prevWeekMinutes = allSessions.filter((s) => s.date >= subDays(today, 14) && s.date < subDays(today, 7)).reduce((a, s) => a + s.minutes, 0);
  const weekTrend = prevWeekMinutes > 0 ? Math.round(((weekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100) : 0;

  const activityData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const mins = allSessions.filter((s) => startOfDay(s.date).getTime() === date.getTime()).reduce((a, s) => a + s.minutes, 0);
    return { date: date.toISOString(), minutes: mins };
  });

  const subjectProgress = studyPlan?.subjects.map((s) => {
    const studiedMins = s.studySessions.reduce((a, ss) => a + ss.minutes, 0);
    const reviewedCards = s.flashcards.filter((f) => f.repetitions > 0).length;
    const totalCards = s.flashcards.length;
    const pct = totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;
    return { id: s.id, name: s.name, studiedMins, pct };
  }) ?? [];

  const hitRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const examWeeksLeft = studyPlan?.examDate ? Math.max(0, Math.ceil((studyPlan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))) : null;
  const xp = totalMinutes + correctAnswers * 10 + streak * 30 + lessonsCompleted * 20;

  return {
    todayGoal, streak, totalMinutes, weekMinutes, weekTrend, xp,
    recentSessions, flashcardsToReview, studyPlan, subjectProgress,
    activityData, materialsDone, totalMaterials, hitRate, totalAnswers,
    correctAnswers, examWeeksLeft, lessonsCompleted, totalLessons,
  };
}

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();
  const data = await getDashboardData(user.id);
  const level = getLevelInfo(data.xp);
  const todayProgress = data.todayGoal
    ? Math.min(100, (data.todayGoal.doneMinutes / data.todayGoal.targetMinutes) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="dashboard" />

      {/* Ticker */}
      <div className="border-b border-white/5 bg-muted/20 px-6 py-2 overflow-hidden">
        <div className="flex gap-8 animate-ticker whitespace-nowrap text-xs text-muted-foreground">
          {[
            `🔥 Streak: ${data.streak} dias`, `⚡ XP: ${data.xp.toLocaleString("pt-BR")} pts`,
            `🎯 Acertos: ${data.hitRate}%`, `📚 ${data.flashcardsToReview} revisões pendentes`,
            `🏆 Nível ${level.level}: ${level.title}`, `⏱ Semana: ${Math.round(data.weekMinutes / 60)}h ${data.weekMinutes % 60}min`,
            `📖 ${data.lessonsCompleted}/${data.totalLessons} aulas concluídas`,
            `🔥 Streak: ${data.streak} dias`, `⚡ XP: ${data.xp.toLocaleString("pt-BR")} pts`,
            `🎯 Acertos: ${data.hitRate}%`,
          ].map((item, i) => <span key={i} className="shrink-0">{item}</span>)}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-7">
        {/* Hero row */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <h1 className="text-3xl font-bold mt-1">Olá, <span className="text-gradient-neon">{user.name.split(" ")[0]}</span> 👋</h1>
            {data.studyPlan && <p className="text-muted-foreground mt-1 text-sm">Preparando para <span className="text-foreground font-medium">{data.studyPlan.examName}</span></p>}
          </div>
          <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 glow-card border-neon">
            <div className="p-3 rounded-xl gradient-neon glow-neon shrink-0"><Star className="h-5 w-5 text-black" /></div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Nível {level.level}</span>
                <Badge className="gradient-neon text-black border-0 text-[10px] font-bold px-2">{level.title}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={level.progress} className="h-1.5 w-32 bg-white/10" />
                <span className="text-xs text-muted-foreground">{Math.round(level.progress)}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{data.xp.toLocaleString("pt-BR")} XP total</p>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Flame, label: "Streak", value: `${data.streak}`, unit: "dias", sub: "consecutivos", color: "text-orange-400", bg: "from-orange-500/10" },
            { icon: TrendingUp, label: "Esta semana", value: `${Math.round(data.weekMinutes / 60)}h${data.weekMinutes % 60}m`, unit: "", sub: `${data.weekTrend >= 0 ? "+" : ""}${data.weekTrend}% vs semana anterior`, color: "text-primary", bg: "from-primary/10", trend: data.weekTrend },
            { icon: Target, label: "Taxa de acerto", value: `${data.hitRate}%`, unit: "", sub: `${data.correctAnswers}/${data.totalAnswers} questões`, color: "text-secondary", bg: "from-secondary/10" },
            { icon: Trophy, label: "Meta diária", value: `${Math.round(todayProgress)}%`, unit: "", sub: `${data.todayGoal?.doneMinutes ?? 0}/${data.todayGoal?.targetMinutes ?? 120} min`, color: "text-amber-400", bg: "from-amber-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card border-white/5 glow-card overflow-hidden">
              <CardContent className="pt-5 pb-4 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                    {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {"trend" in stat && stat.trend !== undefined && (stat.trend >= 0 ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-destructive" />)}
                    <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            {/* Meta */}
            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-foreground/80">Meta de hoje</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-gradient-neon">{Math.round(todayProgress)}%</span>
                  <div className="text-right">
                    <p className="text-sm text-foreground font-medium">{data.todayGoal?.doneMinutes ?? 0} min</p>
                    <p className="text-xs text-muted-foreground">de {data.todayGoal?.targetMinutes ?? 120} min</p>
                  </div>
                </div>
                <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 gradient-neon rounded-full transition-all duration-500" style={{ width: `${todayProgress}%` }} />
                </div>
                {data.todayGoal?.completed ? (
                  <div className="flex items-center gap-2 text-primary text-sm font-medium"><CheckCircle2 className="h-4 w-4" /> Meta cumprida! 🎉</div>
                ) : (
                  <Link href="/metas" className="flex items-center gap-1 text-sm text-primary font-medium"><ArrowRight className="h-3.5 w-3.5" /> Registrar sessão</Link>
                )}
              </CardContent>
            </Card>

            {/* Countdown */}
            {data.studyPlan && data.examWeeksLeft !== null ? (
              <div className="rounded-2xl overflow-hidden glow-card border border-white/5">
                <div className="gradient-navy p-5 relative overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-40" />
                  <div className="relative">
                    <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Contagem regressiva</p>
                    <p className="text-foreground/80 text-sm font-medium truncate">{data.studyPlan.examName}</p>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-6xl font-bold text-gradient-neon">{data.examWeeksLeft}</span>
                      <span className="text-foreground/60 text-lg">semanas</span>
                    </div>
                    {data.studyPlan.examDate && (
                      <p className="text-muted-foreground text-xs mt-2">{format(data.studyPlan.examDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="glass-card border-dashed border-white/10 glow-card">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground/70">Configure seu plano</p>
                  <Link href="/plano"><Badge className="mt-3 gradient-neon text-black border-0 cursor-pointer">Criar plano</Badge></Link>
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/aprender", icon: Play, label: "Continuar aula", color: "text-primary", bg: "bg-primary/10" },
                { href: "/questoes/simulado", icon: Zap, label: "Simulado", color: "text-amber-400", bg: "bg-amber-400/10" },
                { href: "/revisao", icon: Brain, label: `${data.flashcardsToReview} revisões`, color: "text-violet-400", bg: "bg-violet-400/10" },
                { href: "/ia", icon: Sparkles, label: "IA Tutor", color: "text-secondary", bg: "bg-secondary/10" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <div className="glass-card border-white/5 rounded-xl p-3 flex flex-col gap-2 hover:border-white/10 hover:-translate-y-0.5 transition-all cursor-pointer group">
                    <div className={`p-2 rounded-lg ${a.bg} w-fit`}><a.icon className={`h-3.5 w-3.5 ${a.color}`} /></div>
                    <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{a.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Center + Right */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-foreground/80">Atividade — 30 dias</CardTitle>
                <span className="text-xs text-primary">{data.activityData.filter(d => d.minutes > 0).length} dias ativos</span>
              </CardHeader>
              <CardContent><ActivityGrid data={data.activityData} /></CardContent>
            </Card>

            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-foreground/80">Progresso por matéria</CardTitle>
                <Link href="/aprender" className="text-xs text-primary hover:text-primary/80">Ver cursos →</Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.subjectProgress.length > 0 ? data.subjectProgress.map((s) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground/90 truncate max-w-[55%]">{s.name}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground">{s.studiedMins} min</span>
                        <span className={`text-xs font-bold ${s.pct >= 70 ? "text-primary" : s.pct >= 30 ? "text-secondary" : "text-muted-foreground"}`}>{s.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${s.pct >= 70 ? "gradient-neon" : s.pct >= 30 ? "gradient-purple" : "bg-white/20"}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma matéria cadastrada</p>}
              </CardContent>
            </Card>

            <RankingCard totalMinutes={data.xp} streak={data.streak} userName={user.name} />
          </div>
        </div>

        {/* Recent sessions */}
        {data.recentSessions.length > 0 && (
          <Card className="glass-card border-white/5 glow-card">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-foreground/80">Sessões recentes</CardTitle>
              <Link href="/progresso" className="text-xs text-primary">Ver tudo →</Link>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.recentSessions.map((s) => (
                  <div key={s.id} className="glass rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-neon shrink-0"><Clock className="h-3.5 w-3.5 text-black" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{s.minutes} min · {format(s.date, "dd/MM", { locale: ptBR })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
