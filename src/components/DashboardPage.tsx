import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { getLevelInfo } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import ActivityGrid from "@/components/ActivityGrid";
import MissionPanel from "@/components/MissionPanel";
import {
  Flame, Trophy, Clock, Brain, TrendingUp, Zap, CheckCircle2,
  Target, Star, ChevronUp, ChevronDown, Lightbulb, ArrowRight,
  BookOpen, BarChart3, AlertCircle, Play, Sparkles,
} from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const [
    dailyGoals, recentSessions, flashcardsToReview,
    studyPlan, allSessions, totalAnswers, correctAnswers,
    lessonsCompleted, totalLessons, subjectAnswers,
  ] = await Promise.all([
    prisma.dailyGoal.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 14 }),
    prisma.studySession.findMany({
      where: { userId }, include: { subject: { select: { name: true } } },
      orderBy: { date: "desc" }, take: 3,
    }),
    prisma.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
    prisma.studyPlan.findFirst({
      where: { userId },
      include: {
        subjects: {
          include: {
            studySessions: { where: { userId }, select: { minutes: true } },
            flashcards: { where: { userId }, select: { repetitions: true } },
          },
          orderBy: { priority: "asc" },
        },
      },
    }),
    prisma.studySession.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      select: { date: true, minutes: true },
    }),
    prisma.userAnswer.count({ where: { userId } }),
    prisma.userAnswer.count({ where: { userId, isCorrect: true } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.lesson.count({ where: { subject: { studyPlan: { userId } } } }),
    prisma.userAnswer.groupBy({
      by: ["questionId"],
      where: { userId },
      _count: { id: true },
    }),
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
    const reviewed = s.flashcards.filter((f) => f.repetitions > 0).length;
    const total = s.flashcards.length;
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return { id: s.id, name: s.name, studiedMins, pct };
  }) ?? [];

  const hitRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const xp = totalMinutes + correctAnswers * 10 + streak * 30 + lessonsCompleted * 20;
  const examWeeksLeft = studyPlan?.examDate
    ? Math.max(0, Math.ceil((studyPlan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))
    : null;

  // AI Insight logic
  const worstSubject = subjectProgress.sort((a, b) => a.pct - b.pct)[0];
  const insight = generateInsight({ streak, hitRate, flashcardsToReview, worstSubject, weekMinutes, todayDone: todayGoal?.doneMinutes ?? 0, todayTarget: todayGoal?.targetMinutes ?? 120 });

  return {
    todayGoal, streak, totalMinutes, weekMinutes, weekTrend, xp,
    recentSessions, flashcardsToReview, studyPlan, subjectProgress,
    activityData, hitRate, totalAnswers, correctAnswers,
    examWeeksLeft, lessonsCompleted, totalLessons, insight,
  };
}

function generateInsight({ streak, hitRate, flashcardsToReview, worstSubject, weekMinutes, todayDone, todayTarget }: {
  streak: number; hitRate: number; flashcardsToReview: number;
  worstSubject?: { name: string; pct: number }; weekMinutes: number;
  todayDone: number; todayTarget: number;
}) {
  if (todayDone === 0) return { icon: "🌅", title: "Bom dia! Hora de começar.", text: "Você ainda não estudou hoje. Abra uma aula ou resolva o Desafio do Dia para manter seu streak.", type: "warning", action: "/desafio" };
  if (flashcardsToReview > 5) return { icon: "🧠", title: "Revisão urgente.", text: `Você tem ${flashcardsToReview} flashcards vencidos. A revisão espaçada só funciona quando feita no prazo certo.`, type: "info", action: "/revisao" };
  if (hitRate > 0 && hitRate < 60) return { icon: "📉", title: "Taxa de acerto baixa.", text: `Sua taxa de acerto está em ${hitRate}%. Volte para as aulas e revise o conteúdo antes de fazer mais questões.`, type: "warning", action: "/aprender" };
  if (worstSubject && worstSubject.pct < 20 && worstSubject.name) return { icon: "🎯", title: `Foco em ${worstSubject.name}.`, text: `Esta é sua matéria com menor progresso (${worstSubject.pct}%). Dedicar 30 minutos por dia pode mudar seus resultados rapidamente.`, type: "info", action: "/aprender" };
  if (streak >= 7) return { icon: "🔥", title: `${streak} dias seguidos! Incrível.`, text: "Você está em um ritmo excelente. Candidatos que mantêm streaks de 7+ dias têm 3x mais chance de aprovação.", type: "success", action: "/ranking" };
  if (weekMinutes > 500) return { icon: "⚡", title: "Semana produtiva!", text: `${Math.round(weekMinutes / 60)}h de estudo essa semana. Você está acima da média dos candidatos aprovados (6h/semana).`, type: "success", action: "/progresso" };
  return { icon: "💡", title: "Continue consistente.", text: "A aprovação é resultado de consistência diária. Estude pelo menos 2 horas hoje e mantenha seu streak.", type: "info", action: "/metas" };
}

export default async function DashboardPage() {
  const user = await getOrCreateDbUser();
  const data = await getDashboardData(user.id);
  const level = getLevelInfo(data.xp);
  const todayProgress = data.todayGoal ? Math.min(100, (data.todayGoal.doneMinutes / data.todayGoal.targetMinutes) * 100) : 0;

  const insightColors: Record<string, string> = {
    warning: "border-amber-400/20 bg-amber-400/5",
    info: "border-primary/20 bg-primary/5",
    success: "border-emerald-400/20 bg-emerald-400/5",
  };

  return (
    <AppLayout active="dashboard">
      <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
            <h1 className="text-2xl font-bold mt-0.5">
              Olá, <span className="text-gradient-neon">{user.name.split(" ")[0]}</span> 👋
            </h1>
            {data.studyPlan && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {data.studyPlan.examName}
                {data.examWeeksLeft !== null && (
                  <span className="text-primary font-medium ml-2">· {data.examWeeksLeft} semanas restantes</span>
                )}
              </p>
            )}
          </div>

          {/* Level badge */}
          <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 border-neon glow-card">
            <div className="p-2.5 rounded-xl gradient-neon glow-sm shrink-0">
              <Star className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Nível {level.level}</span>
                <Badge className="gradient-neon text-black border-0 text-[10px] font-bold">{level.title}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={level.progress} className="h-1 w-28 bg-white/8" />
                <span className="text-[10px] text-muted-foreground">{data.xp.toLocaleString("pt-BR")} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* IA Insight */}
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${insightColors[data.insight.type]}`}>
          <div className="text-xl shrink-0 mt-0.5">{data.insight.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">IA Insight</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{data.insight.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{data.insight.text}</p>
          </div>
          <Link href={data.insight.action} className="shrink-0 gradient-neon text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            Agir
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Flame, label: "Streak", value: `${data.streak}d`, sub: "consecutivos", color: "text-orange-400", bg: "from-orange-500/10" },
            { icon: TrendingUp, label: "Semana", value: `${Math.round(data.weekMinutes / 60)}h${data.weekMinutes % 60}m`, sub: `${data.weekTrend >= 0 ? "+" : ""}${data.weekTrend}% vs anterior`, color: "text-primary", bg: "from-primary/10", trend: data.weekTrend },
            { icon: Target, label: "Acertos", value: `${data.hitRate}%`, sub: `${data.correctAnswers}/${data.totalAnswers} questões`, color: "text-secondary", bg: "from-secondary/10" },
            { icon: Trophy, label: "Meta hoje", value: `${Math.round(todayProgress)}%`, sub: `${data.todayGoal?.doneMinutes ?? 0}/${data.todayGoal?.targetMinutes ?? 120} min`, color: "text-amber-400", bg: "from-amber-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card border-white/5 overflow-hidden">
              <CardContent className="pt-4 pb-3 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {"trend" in stat && stat.trend !== undefined && (
                      stat.trend >= 0 ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-destructive" />
                    )}
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* Today's goal */}
            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">Meta de hoje</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gradient-neon">{Math.round(todayProgress)}%</span>
                  <span className="text-sm text-muted-foreground">{data.todayGoal?.doneMinutes ?? 0}/{data.todayGoal?.targetMinutes ?? 120} min</span>
                </div>
                <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${todayProgress}%` }} />
                </div>
                {data.todayGoal?.completed ? (
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Meta cumprida 🎉
                  </div>
                ) : (
                  <Link href="/metas" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                    <ArrowRight className="h-3.5 w-3.5" /> Registrar sessão
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { href: "/desafio", icon: Zap, label: "Desafio do dia", color: "text-primary", bg: "bg-primary/10" },
                { href: "/revisao", icon: Brain, label: `${data.flashcardsToReview} revisões`, color: "text-violet-400", bg: "bg-violet-400/10" },
                { href: "/questoes", icon: Target, label: "Questões", color: "text-secondary", bg: "bg-secondary/10" },
                { href: "/aprender", icon: Play, label: "Continuar aula", color: "text-blue-400", bg: "bg-blue-400/10" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <div className="glass-card border-white/5 rounded-xl p-3 flex flex-col gap-2 hover:border-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer">
                    <div className={`p-2 rounded-lg ${a.bg} w-fit`}><a.icon className={`h-3.5 w-3.5 ${a.color}`} /></div>
                    <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{a.label}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent sessions */}
            {data.recentSessions.length > 0 && (
              <Card className="glass-card border-white/5">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold">Atividade recente</CardTitle>
                  <Link href="/progresso" className="text-xs text-primary">Ver →</Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.recentSessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 py-1.5">
                      <div className="h-7 w-7 rounded-lg gradient-neon flex items-center justify-center shrink-0">
                        <Clock className="h-3.5 w-3.5 text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.subject.name}</p>
                        <p className="text-[10px] text-muted-foreground">{format(s.date, "dd/MM", { locale: ptBR })}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-white/5">{s.minutes}min</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center + Right columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Activity heatmap */}
            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">Atividade — 30 dias</CardTitle>
                <span className="text-xs text-primary">{data.activityData.filter(d => d.minutes > 0).length} dias ativos</span>
              </CardHeader>
              <CardContent>
                <ActivityGrid data={data.activityData} />
              </CardContent>
            </Card>

            {/* Subject progress */}
            <Card className="glass-card border-white/5 glow-card">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">Progresso por matéria</CardTitle>
                <Link href="/aprender" className="text-xs text-primary hover:underline">Ver aulas →</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.subjectProgress.length > 0 ? (
                  data.subjectProgress.map((s) => (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Link href={`/aprender/${s.id}`} className="font-medium text-foreground/90 hover:text-primary transition-colors truncate max-w-[55%]">
                          {s.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.studiedMins}min</span>
                          <span className={`text-xs font-bold ${s.pct >= 70 ? "text-primary" : s.pct >= 30 ? "text-secondary" : "text-muted-foreground"}`}>{s.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${s.pct >= 70 ? "gradient-neon" : s.pct >= 30 ? "gradient-purple" : "bg-white/15"}`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aguardando seu conteúdo ser carregado...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lessons progress */}
            <Card className="glass-card border-white/5">
              <CardContent className="pt-4 pb-4 flex items-center gap-5">
                <div className="relative">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.88 0.20 163)" strokeWidth="3"
                      strokeDasharray={`${data.totalLessons > 0 ? (data.lessonsCompleted / data.totalLessons) * 94 : 0} 94`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gradient-neon">{data.totalLessons > 0 ? Math.round((data.lessonsCompleted / data.totalLessons) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Aulas concluídas</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{data.lessonsCompleted} de {data.totalLessons} aulas</p>
                  <Link href="/aprender" className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium hover:underline">
                    Continuar estudando <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">XP de aulas</p>
                  <p className="text-lg font-bold text-secondary">{data.lessonsCompleted * 20}</p>
                  <p className="text-[10px] text-muted-foreground">pontos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Missions + Community row */}
        <div className="grid lg:grid-cols-2 gap-5">
          <MissionPanel userId={user.id} />

          {/* Community activity */}
          <Card className="glass-card border-white/5 glow-card">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Comunidade ativa</CardTitle>
              <Link href="/comunidade" className="text-xs text-primary hover:underline">Ver fórum →</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="glass rounded-xl p-3 border-white/5">
                  <p className="text-sm font-medium text-primary">💬 Tire suas dúvidas com a comunidade</p>
                  <p className="text-xs text-muted-foreground mt-1">Mais de {Math.floor(Math.random() * 50 + 20)} candidatos online agora. A IA responde todas as perguntas automaticamente.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/comunidade/nova">
                    <div className="glass rounded-xl p-3 border-white/5 hover:border-primary/20 transition-all cursor-pointer text-center">
                      <p className="text-xs font-semibold text-primary">Nova pergunta</p>
                      <p className="text-[10px] text-muted-foreground">IA responde em segundos</p>
                    </div>
                  </Link>
                  <Link href="/comunidade">
                    <div className="glass rounded-xl p-3 border-white/5 hover:border-secondary/20 transition-all cursor-pointer text-center">
                      <p className="text-xs font-semibold text-secondary">Ver debates</p>
                      <p className="text-[10px] text-muted-foreground">Respostas da comunidade</p>
                    </div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
