import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  easy: { label: "Fácil", color: "text-primary", dot: "bg-primary" },
  medium: { label: "Médio", color: "text-amber-400", dot: "bg-amber-400" },
  hard: { label: "Difícil", color: "text-red-400", dot: "bg-red-400" },
};

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ banca?: string; subject?: string; difficulty?: string }>;
}) {
  const user = await getOrCreateDbUser();
  const sp = await searchParams;

  const subjects = await prisma.subject.findMany({
    where: { studyPlan: { userId: user.id } },
    select: { id: true, name: true },
    orderBy: { priority: "asc" },
  });

  const bancas = await prisma.question.findMany({
    where: { subject: { studyPlan: { userId: user.id } } },
    select: { banca: true },
    distinct: ["banca"],
  });

  const questions = await prisma.question.findMany({
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
    orderBy: { subject: { priority: "asc" } },
    take: 50,
  });

  const stats = {
    total: await prisma.question.count({ where: { subject: { studyPlan: { userId: user.id } } } }),
    answered: await prisma.userAnswer.count({ where: { userId: user.id } }),
    correct: await prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
  };
  const hitRate = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="questoes" />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-gradient-neon">Banco de Questões</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Questões estilo prova real com feedback imediato</p>
          </div>
          <Link href="/questoes/simulado">
            <div className="gradient-neon glow-neon text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:opacity-90 transition-opacity cursor-pointer">
              <Zap className="h-4 w-4" /> Iniciar Simulado
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de questões", value: stats.total, icon: Target, color: "text-primary" },
            { label: "Respondidas", value: stats.answered, icon: CheckCircle2, color: "text-secondary" },
            { label: "Taxa de acerto", value: `${hitRate}%`, icon: Zap, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="w-52 shrink-0 space-y-4">
            <div className="glass-card rounded-xl p-4 border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Filter className="h-3.5 w-3.5" /> Filtros
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Matéria</p>
                <div className="space-y-1">
                  <Link href={`/questoes?${new URLSearchParams({ ...sp, subject: "" })}`}>
                    <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${!sp.subject ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                      Todas
                    </div>
                  </Link>
                  {subjects.map((s) => (
                    <Link key={s.id} href={`/questoes?${new URLSearchParams({ ...sp, subject: s.id })}`}>
                      <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors truncate ${sp.subject === s.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                        {s.name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Dificuldade</p>
                <div className="space-y-1">
                  {["", "easy", "medium", "hard"].map((d) => {
                    const cfg = d ? DIFFICULTY_CONFIG[d] : null;
                    return (
                      <Link key={d} href={`/questoes?${new URLSearchParams({ ...sp, difficulty: d })}`}>
                        <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${sp.difficulty === d || (!sp.difficulty && !d) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                          {cfg && <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                          {cfg ? cfg.label : "Todas"}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {bancas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Banca</p>
                  <div className="space-y-1">
                    <Link href={`/questoes?${new URLSearchParams({ ...sp, banca: "" })}`}>
                      <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer ${!sp.banca ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>Todas</div>
                    </Link>
                    {bancas.map((b) => (
                      <Link key={b.banca} href={`/questoes?${new URLSearchParams({ ...sp, banca: b.banca })}`}>
                        <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer ${sp.banca === b.banca ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>{b.banca}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Questions list */}
          <div className="flex-1 space-y-3">
            {questions.length === 0 ? (
              <Card className="glass-card border-dashed border-white/10">
                <CardContent className="py-16 text-center">
                  <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma questão encontrada</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Configure seu plano de estudos para acessar questões</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((q, idx) => {
                const answered = q.answers[0];
                const cfg = DIFFICULTY_CONFIG[q.difficulty];
                return (
                  <Link key={q.id} href={`/questoes/${q.id}`}>
                    <div className="glass-card border-white/5 rounded-xl p-4 hover:border-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                            {q.subject.name}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                            {q.banca} {q.year ? `· ${q.year}` : ""}
                          </Badge>
                          {cfg && (
                            <div className="flex items-center gap-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 line-clamp-2 group-hover:text-foreground transition-colors">
                          <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                          {q.content}
                        </p>
                      </div>
                      <div className="shrink-0 mt-1">
                        {answered ? (
                          answered.isCorrect
                            ? <CheckCircle2 className="h-5 w-5 text-primary" />
                            : <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
