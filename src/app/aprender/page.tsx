import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ChevronRight, CheckCircle2, Lock, Play, Clock } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "border-primary/20 bg-primary/4",
  "border-secondary/20 bg-secondary/4",
  "border-blue-400/20 bg-blue-400/4",
  "border-amber-400/20 bg-amber-400/4",
  "border-orange-400/20 bg-orange-400/4",
  "border-violet-400/20 bg-violet-400/4",
  "border-pink-400/20 bg-pink-400/4",
];

export default async function AprenderPage() {
  const user = await getOrCreateDbUser();

  const subjects = await prisma.subject.findMany({
    where: { studyPlan: { userId: user.id } },
    include: {
      lessons: {
        include: { progress: { where: { userId: user.id } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { questions: true } },
    },
    orderBy: { priority: "asc" },
  });

  const totalL = subjects.reduce((a, s) => a + s.lessons.length, 0);
  const doneL = subjects.reduce((a, s) => a + s.lessons.filter((l) => l.progress.some((p) => p.completedAt)).length, 0);
  const pct = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;

  return (
    <AppLayout active="aprender">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gradient-neon">Aulas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Conteúdo estruturado por matéria e assunto</p>
          </div>
          <div className="glass-card rounded-xl px-4 py-2.5 border-neon flex items-center gap-3">
            <div>
              <p className="text-xl font-bold text-gradient-neon">{pct}%</p>
              <p className="text-[10px] text-muted-foreground">{doneL}/{totalL} aulas</p>
            </div>
            <Progress value={pct} className="w-20 h-1 bg-white/8" />
          </div>
        </div>

        {subjects.length === 0 ? (
          <Card className="glass-card border-dashed border-white/8">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Carregando seu conteúdo...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map((subject, idx) => {
              const done = subject.lessons.filter((l) => l.progress.some((p) => p.completedAt)).length;
              const total = subject.lessons.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const nextLesson = subject.lessons.find((l) => !l.progress.some((p) => p.completedAt));
              const colorClass = COLORS[idx % COLORS.length];

              return (
                <Card key={subject.id} className={`glass-card border overflow-hidden hover:scale-[1.01] transition-transform ${colorClass}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold">{subject.name}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {done}/{total} aulas · {subject._count.questions} questões
                        </p>
                      </div>
                      <Badge variant="outline" className="border-white/8 text-xs shrink-0">
                        {pct}%
                      </Badge>
                    </div>

                    <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 70 ? "gradient-neon" : pct >= 30 ? "gradient-purple" : "bg-white/15"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Preview lessons */}
                    <div className="space-y-1">
                      {subject.lessons.slice(0, 3).map((lesson, li) => {
                        const isDone = lesson.progress.some((p) => p.completedAt);
                        const isLocked = li > 0 && !subject.lessons[li - 1].progress.some((p) => p.completedAt);
                        return (
                          <Link
                            key={lesson.id}
                            href={isLocked ? "#" : `/aprender/${subject.id}/${lesson.id}`}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors group ${isLocked ? "opacity-35 cursor-not-allowed pointer-events-none" : "hover:bg-white/4"}`}
                          >
                            <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${isDone ? "gradient-neon" : "bg-white/7"}`}>
                              {isDone ? <CheckCircle2 className="h-3 w-3 text-black" /> : isLocked ? <Lock className="h-2.5 w-2.5 text-muted-foreground" /> : <Play className="h-2.5 w-2.5 text-muted-foreground" />}
                            </div>
                            <span className="text-xs truncate text-foreground/70 group-hover:text-foreground">{lesson.title}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />{lesson.duration}min
                            </span>
                          </Link>
                        );
                      })}
                      {total > 3 && <p className="text-xs text-muted-foreground text-center py-0.5">+{total - 3} aulas</p>}
                    </div>

                    <Link href={`/aprender/${subject.id}`}>
                      <div className="flex items-center justify-between w-full gradient-neon text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity">
                        <span>{nextLesson ? "Continuar" : "Revisitar"}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
