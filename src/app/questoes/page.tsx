import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import Link from "next/link";

const DIFF: Record<string, { label: string; dot: string; color: string }> = {
  easy: { label: "Fácil", dot: "bg-emerald-400", color: "text-emerald-400" },
  medium: { label: "Médio", dot: "bg-amber-400", color: "text-amber-400" },
  hard: { label: "Difícil", dot: "bg-red-400", color: "text-red-400" },
};

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ banca?: string; subject?: string; difficulty?: string }>;
}) {
  const user = await getOrCreateDbUser();
  const sp = await searchParams;

  const [subjects, bancas, questions, stats] = await Promise.all([
    prisma.subject.findMany({
      where: { studyPlan: { userId: user.id } },
      select: { id: true, name: true },
      orderBy: { priority: "asc" },
    }),
    prisma.question.findMany({
      where: { subject: { studyPlan: { userId: user.id } } },
      select: { banca: true }, distinct: ["banca"],
    }),
    prisma.question.findMany({
      where: {
        subject: { studyPlan: { userId: user.id } },
        ...(sp.subject ? { subjectId: sp.subject } : {}),
        ...(sp.banca ? { banca: sp.banca } : {}),
        ...(sp.difficulty ? { difficulty: sp.difficulty } : {}),
      },
      include: {
        subject: { select: { name: true } },
        answers: { where: { userId: user.id }, orderBy: { answeredAt: "desc" }, take: 1 },
      },
      orderBy: [{ subject: { priority: "asc" } }, { id: "asc" }],
      take: 50,
    }),
    prisma.$transaction([
      prisma.question.count({ where: { subject: { studyPlan: { userId: user.id } } } }),
      prisma.userAnswer.count({ where: { userId: user.id } }),
      prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
    ]),
  ]);

  const [total, answered, correct] = stats;
  const hitRate = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const unanswered = questions.filter((q) => !q.answers[0]).length;

  return (
    <AppLayout active="questoes">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gradient-neon">Banco de Questões</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Questões CESPE, FCC e VUNESP com gabarito comentado</p>
          </div>
          <Link href="/questoes/simulado">
            <div className="gradient-neon glow-neon text-black font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:opacity-90">
              <Target className="h-4 w-4" /> Simulado
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: total, color: "text-primary" },
            { label: "Respondidas", value: answered, color: "text-secondary" },
            { label: "Taxa de acerto", value: `${hitRate}%`, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Filters */}
          <aside className="w-44 shrink-0">
            <div className="glass-card rounded-xl p-3 border-white/5 space-y-4 sticky top-6">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3 w-3" /> Filtros
              </div>

              {[
                {
                  label: "Matéria",
                  items: [{ id: "", name: "Todas" }, ...subjects.map((s) => ({ id: s.id, name: s.name }))],
                  paramKey: "subject",
                  currentValue: sp.subject ?? "",
                },
                {
                  label: "Dificuldade",
                  items: [
                    { id: "", name: "Todas" },
                    { id: "easy", name: "Fácil" },
                    { id: "medium", name: "Médio" },
                    { id: "hard", name: "Difícil" },
                  ],
                  paramKey: "difficulty",
                  currentValue: sp.difficulty ?? "",
                },
              ].map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{group.label}</p>
                  {group.items.map((item) => {
                    const params = new URLSearchParams({ ...sp, [group.paramKey]: item.id });
                    return (
                      <Link key={item.id} href={`/questoes?${params}`}>
                        <div className={`text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors truncate ${group.currentValue === item.id || (!group.currentValue && !item.id) ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* Questions */}
          <div className="flex-1 space-y-2.5">
            {unanswered > 0 && (
              <div className="glass rounded-xl px-3 py-2 border-primary/15 text-xs text-primary flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                <span><strong>{unanswered}</strong> questões não respondidas nesta seleção</span>
              </div>
            )}

            {questions.length === 0 ? (
              <Card className="glass-card border-dashed border-white/8">
                <CardContent className="py-16 text-center">
                  <Target className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma questão encontrada</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((q, idx) => {
                const answered = q.answers[0];
                const diff = DIFF[q.difficulty];
                return (
                  <Link key={q.id} href={`/questoes/${q.id}`}>
                    <div className="glass-card border-white/5 rounded-xl p-4 hover:border-white/10 hover:-translate-y-0.5 transition-all group flex items-start gap-4">
                      <span className="text-xs text-muted-foreground/40 font-mono mt-0.5 shrink-0">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-white/8 text-muted-foreground">{q.subject.name}</Badge>
                          <Badge variant="outline" className="text-[10px] border-white/8 text-muted-foreground">{q.banca}</Badge>
                          {diff && (
                            <div className="flex items-center gap-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                              <span className={`text-[10px] ${diff.color}`}>{diff.label}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/85 line-clamp-2 group-hover:text-foreground transition-colors">
                          {q.content}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {answered ? (
                          answered.isCorrect
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground/25" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
