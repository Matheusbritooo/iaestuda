import { prisma } from "@/lib/prisma";
import { getLevelInfo } from "@/lib/level";
import { startOfDay, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type UserAIContext = {
  profile: {
    name: string;
    level: number;
    title: string;
    xp: number;
    streak: number;
    email: string;
  };
  exam: {
    name: string;
    weeksLeft: number | null;
    examDate: string | null;
  };
  performance: {
    totalAnswers: number;
    hitRate: number;
    weekMinutes: number;
    totalMinutes: number;
    strongestSubject: string | null;
    weakestSubject: string | null;
    subjectStats: { name: string; hitRate: number; answeredCount: number }[];
  };
  recentErrors: { subject: string; topic: string }[];
  progress: { subject: string; pct: number; studiedMins: number }[];
  pendingReviews: number;
  todayGoal: { done: number; target: number; completed: boolean };
};

export async function buildUserContext(userId: string): Promise<UserAIContext> {
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);

  const [
    user, studyPlan, allSessions, weekSessions, dailyGoals,
    totalAnswers, correctAnswers, recentWrong, flashcardsToReview,
    lessonsCompleted, subjectAnswers,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
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
    prisma.studySession.aggregate({ where: { userId }, _sum: { minutes: true } }),
    prisma.studySession.aggregate({ where: { userId, date: { gte: sevenDaysAgo } }, _sum: { minutes: true } }),
    prisma.dailyGoal.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 30 }),
    prisma.userAnswer.count({ where: { userId } }),
    prisma.userAnswer.count({ where: { userId, isCorrect: true } }),
    prisma.userAnswer.findMany({
      where: { userId, isCorrect: false },
      include: { question: { include: { subject: true } } },
      orderBy: { answeredAt: "desc" },
      take: 10,
    }),
    prisma.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
    prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.userAnswer.findMany({
      where: { userId },
      include: { question: { include: { subject: true } } },
    }),
  ]);

  const totalMinutes = allSessions._sum.minutes ?? 0;
  const weekMinutes = weekSessions._sum.minutes ?? 0;
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

  // Per-subject answer stats
  const subjectAnswerMap: Record<string, { correct: number; total: number; name: string }> = {};
  for (const a of subjectAnswers) {
    const sid = a.question.subjectId;
    const sname = a.question.subject.name;
    if (!subjectAnswerMap[sid]) subjectAnswerMap[sid] = { correct: 0, total: 0, name: sname };
    subjectAnswerMap[sid].total++;
    if (a.isCorrect) subjectAnswerMap[sid].correct++;
  }
  const subjectStats = Object.values(subjectAnswerMap)
    .map((s) => ({ name: s.name, hitRate: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0, answeredCount: s.total }))
    .sort((a, b) => b.answeredCount - a.answeredCount);

  const strongestSubject = subjectStats.filter(s => s.answeredCount >= 2).sort((a, b) => b.hitRate - a.hitRate)[0]?.name ?? null;
  const weakestSubject = subjectStats.filter(s => s.answeredCount >= 2).sort((a, b) => a.hitRate - b.hitRate)[0]?.name ?? null;

  // Subject progress
  const progress = (studyPlan?.subjects ?? []).map((s) => {
    const studiedMins = s.studySessions.reduce((a: number, ss: { minutes: number }) => a + ss.minutes, 0);
    const reviewed = s.flashcards.filter((f: { repetitions: number }) => f.repetitions > 0).length;
    const total = s.flashcards.length;
    return { subject: s.name, pct: total > 0 ? Math.round((reviewed / total) * 100) : 0, studiedMins };
  });

  // Today's goal
  const todayGoal = dailyGoals.find((g) => startOfDay(g.date).getTime() === today.getTime());

  // Recent errors (unique by topic)
  const seenTopics = new Set<string>();
  const recentErrors: { subject: string; topic: string }[] = [];
  for (const a of recentWrong) {
    const key = `${a.question.subject.name}-${a.question.topic}`;
    if (!seenTopics.has(key)) {
      seenTopics.add(key);
      recentErrors.push({ subject: a.question.subject.name, topic: a.question.topic });
    }
    if (recentErrors.length >= 5) break;
  }

  return {
    profile: {
      name: user?.name ?? "Aluno",
      level: level.level,
      title: level.title,
      xp,
      streak,
      email: user?.email ?? "",
    },
    exam: {
      name: studyPlan?.examName ?? "Concurso",
      weeksLeft: studyPlan?.examDate ? Math.max(0, Math.ceil((studyPlan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))) : null,
      examDate: studyPlan?.examDate ? format(studyPlan.examDate, "dd/MM/yyyy", { locale: ptBR }) : null,
    },
    performance: {
      totalAnswers,
      hitRate,
      weekMinutes,
      totalMinutes,
      strongestSubject,
      weakestSubject,
      subjectStats,
    },
    recentErrors,
    progress,
    pendingReviews: flashcardsToReview,
    todayGoal: {
      done: todayGoal?.doneMinutes ?? 0,
      target: todayGoal?.targetMinutes ?? 120,
      completed: todayGoal?.completed ?? false,
    },
  };
}

export function contextToSystemPrompt(ctx: UserAIContext, agentRole: string): string {
  const subjectSummary = ctx.performance.subjectStats.length > 0
    ? ctx.performance.subjectStats.map(s => `- ${s.name}: ${s.hitRate}% de acerto (${s.answeredCount} questões)`).join("\n")
    : "Nenhuma questão respondida ainda.";

  const errorsSummary = ctx.recentErrors.length > 0
    ? ctx.recentErrors.map(e => `- ${e.subject}: ${e.topic}`).join("\n")
    : "Nenhum erro recente registrado.";

  const progressSummary = ctx.progress.length > 0
    ? ctx.progress.map(p => `- ${p.subject}: ${p.pct}% (${p.studiedMins} min estudados)`).join("\n")
    : "Nenhuma matéria com progresso ainda.";

  return `Você é o IAestuda AI — um tutor especialista em concursos públicos brasileiros.
${agentRole}

━━━ CONTEXTO DO ALUNO ━━━
Nome: ${ctx.profile.name}
Nível: ${ctx.profile.level} (${ctx.profile.title}) | XP: ${ctx.profile.xp.toLocaleString("pt-BR")}
Streak: ${ctx.profile.streak} dias consecutivos
Concurso: ${ctx.exam.name}${ctx.exam.weeksLeft !== null ? ` — ${ctx.exam.weeksLeft} semanas restantes (prova em ${ctx.exam.examDate})` : ""}

━━━ DESEMPENHO ━━━
Taxa de acerto geral: ${ctx.performance.hitRate}%
Questões respondidas: ${ctx.performance.totalAnswers}
Minutos estudados (semana): ${ctx.performance.weekMinutes}
Total estudado: ${Math.round(ctx.performance.totalMinutes / 60)}h ${ctx.performance.totalMinutes % 60}min
Matéria mais forte: ${ctx.performance.strongestSubject ?? "ainda sem dados"}
Matéria mais fraca: ${ctx.performance.weakestSubject ?? "ainda sem dados"}
Revisões pendentes: ${ctx.pendingReviews}
Meta hoje: ${ctx.todayGoal.done}/${ctx.todayGoal.target} min ${ctx.todayGoal.completed ? "(cumprida ✓)" : "(pendente)"}

━━━ DESEMPENHO POR MATÉRIA ━━━
${subjectSummary}

━━━ ÚLTIMOS ERROS ━━━
${errorsSummary}

━━━ PROGRESSO NAS AULAS ━━━
${progressSummary}

━━━ REGRAS ━━━
- Responda SEMPRE em português brasileiro
- Seja direto, didático e específico
- Use os dados do aluno para personalizar respostas
- Cite o nome do aluno quando apropriado
- Nunca dê respostas genéricas — use o contexto
- Use marcadores, exemplos e estrutura clara
- Máximo 500 palavras por resposta`;
}
