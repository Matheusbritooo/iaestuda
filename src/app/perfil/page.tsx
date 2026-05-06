import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLevelInfo } from "@/lib/level";
import { Star, Flame, Target, Clock, BookOpen, Brain, Trophy, CheckCircle2, Calendar } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACHIEVEMENTS = [
  { id: "first_answer", label: "Primeira questão", desc: "Responda sua primeira questão", icon: Target, condition: (d: Stats) => d.totalAnswers >= 1 },
  { id: "streak_7", label: "Uma semana seguida", desc: "7 dias de streak", icon: Flame, condition: (d: Stats) => d.streak >= 7 },
  { id: "accuracy_80", label: "Precisão de Elite", desc: "80%+ de acerto", icon: Star, condition: (d: Stats) => d.hitRate >= 80 },
  { id: "study_10h", label: "10 horas estudadas", desc: "600+ minutos totais", icon: Clock, condition: (d: Stats) => d.totalMinutes >= 600 },
  { id: "lesson_1", label: "Primeiro módulo", desc: "Conclua uma aula", icon: BookOpen, condition: (d: Stats) => d.lessonsCompleted >= 1 },
  { id: "flashcard_10", label: "Revisor dedicado", desc: "Revise 10 flashcards", icon: Brain, condition: (d: Stats) => d.flashcardsReviewed >= 10 },
];

type Stats = { totalAnswers: number; streak: number; hitRate: number; totalMinutes: number; lessonsCompleted: number; flashcardsReviewed: number };

export default async function PerfilPage() {
  const user = await getOrCreateDbUser();
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const [
    totalAnswers, correctAnswers, allSessions, dailyGoals,
    flashcardsReviewed, lessonsCompleted, studyPlan,
    recentAnswers,
  ] = await Promise.all([
    prisma.userAnswer.count({ where: { userId: user.id } }),
    prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
    prisma.studySession.findMany({ where: { userId: user.id }, select: { minutes: true, date: true } }),
    prisma.dailyGoal.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 30 }),
    prisma.flashcard.count({ where: { userId: user.id, repetitions: { gt: 0 } } }),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { not: null } } }),
    prisma.studyPlan.findFirst({ where: { userId: user.id }, include: { subjects: { include: { _count: { select: { questions: true } } } } } }),
    prisma.userAnswer.findMany({ where: { userId: user.id }, include: { question: { include: { subject: true } } }, orderBy: { answeredAt: "desc" }, take: 5 }),
  ]);

  const totalMinutes = allSessions.reduce((a, s) => a + s.minutes, 0);
  const hitRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const streak = [...dailyGoals].reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const xp = totalMinutes + correctAnswers * 10 + streak * 30 + lessonsCompleted * 20;
  const level = getLevelInfo(xp);
  const stats: Stats = { totalAnswers, streak, hitRate, totalMinutes, lessonsCompleted, flashcardsReviewed };

  const daysStudied = new Set(allSessions.filter(s => s.date >= thirtyDaysAgo).map(s => format(s.date, "yyyy-MM-dd"))).size;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="perfil" />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Profile hero */}
        <Card className="glass-card border-white/5 glow-card overflow-hidden">
          <div className="gradient-navy relative p-6">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative flex items-center gap-5 flex-wrap">
              <div className="h-16 w-16 rounded-2xl gradient-neon glow-neon flex items-center justify-center text-2xl font-bold text-black shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="gradient-neon text-black border-0 font-bold">Nível {level.level} · {level.title}</Badge>
                  {studyPlan && <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">{studyPlan.examName}</Badge>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gradient-neon">{xp.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">XP total</p>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <Progress value={level.progress} className="w-24 h-1.5 bg-white/10" />
                  <span className="text-xs text-muted-foreground">{Math.round(level.progress)}% → Nv.{level.level + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Flame, label: "Streak", value: `${streak} dias`, color: "text-orange-400" },
            { icon: Target, label: "Taxa de acerto", value: `${hitRate}%`, color: "text-primary" },
            { icon: Clock, label: "Horas estudadas", value: `${Math.round(totalMinutes / 60)}h`, color: "text-secondary" },
            { icon: Calendar, label: "Dias ativos (30d)", value: `${daysStudied}`, color: "text-blue-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Achievements */}
          <Card className="glass-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/80">Conquistas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = ach.condition(stats);
                return (
                  <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${unlocked ? "bg-primary/5 border border-primary/20" : "bg-white/2 border border-white/5 opacity-50"}`}>
                    <div className={`p-2 rounded-lg ${unlocked ? "gradient-neon" : "bg-white/5"} shrink-0`}>
                      <ach.icon className={`h-4 w-4 ${unlocked ? "text-black" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{ach.label}</p>
                      <p className="text-xs text-muted-foreground">{ach.desc}</p>
                    </div>
                    {unlocked && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <div className="space-y-4">
            <Card className="glass-card border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/80">Últimas questões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentAnswers.length > 0 ? recentAnswers.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2">
                    {a.isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      : <Target className="h-4 w-4 text-destructive shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.question.subject.name}</p>
                      <p className="text-[11px] text-muted-foreground">{format(a.answeredAt, "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] border-0 ${a.isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {a.isCorrect ? "Acerto" : "Erro"}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma questão respondida ainda</p>
                )}
              </CardContent>
            </Card>

            {/* Subject breakdown */}
            {studyPlan && (
              <Card className="glass-card border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground/80">Questões por matéria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {studyPlan.subjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground/80 truncate max-w-[60%]">{s.name}</span>
                      <span className="text-muted-foreground text-xs">{s._count.questions} questões</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
