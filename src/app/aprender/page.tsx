import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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

  const totalLessons = subjects.reduce((a, s) => a + s.lessons.length, 0);
  const completedLessons = subjects.reduce(
    (a, s) => a + s.lessons.filter((l) => l.progress.some((p) => p.completedAt)).length, 0
  );
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const SUBJECT_COLORS = [
    "from-primary/20 to-primary/5 border-primary/20",
    "from-secondary/20 to-secondary/5 border-secondary/20",
    "from-blue-400/20 to-blue-400/5 border-blue-400/20",
    "from-amber-400/20 to-amber-400/5 border-amber-400/20",
    "from-orange-400/20 to-orange-400/5 border-orange-400/20",
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="aprender" />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-gradient-neon">Aprender</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Aulas organizadas por matéria e assunto</p>
          </div>
          <div className="glass-card rounded-2xl px-4 py-3 border-neon text-center min-w-[130px]">
            <p className="text-3xl font-bold text-gradient-neon">{overallPct}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">{completedLessons}/{totalLessons} aulas</p>
            <Progress value={overallPct} className="h-1 mt-2 bg-white/5" />
          </div>
        </div>

        {subjects.length === 0 ? (
          <Card className="glass-card border-dashed border-white/10">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">Configure seu plano para acessar as aulas</p>
              <Link href="/plano"><Badge className="mt-4 gradient-neon text-black border-0 cursor-pointer">Criar plano</Badge></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {subjects.map((subject, idx) => {
              const completed = subject.lessons.filter((l) => l.progress.some((p) => p.completedAt)).length;
              const total = subject.lessons.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const nextLesson = subject.lessons.find((l) => !l.progress.some((p) => p.completedAt));
              const colorClass = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];

              return (
                <Card key={subject.id} className={`glass-card border overflow-hidden hover:scale-[1.01] transition-transform ${colorClass.split(" ").slice(2).join(" ")}`}>
                  <div className={`h-1.5 w-full bg-gradient-to-r ${colorClass.split(" ").slice(0, 2).join(" ")}`} style={{ width: `${pct}%` }} />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-base">{subject.name}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{completed}/{total} aulas · {subject._count.questions} questões</p>
                      </div>
                      <Badge variant="outline" className="border-white/10 text-xs shrink-0">{pct}%</Badge>
                    </div>

                    <Progress value={pct} className="h-1 bg-white/5" />

                    {/* Lessons preview */}
                    <div className="space-y-1.5">
                      {subject.lessons.slice(0, 3).map((lesson, li) => {
                        const isDone = lesson.progress.some((p) => p.completedAt);
                        const isPrev = li > 0 && !subject.lessons[li - 1].progress.some((p) => p.completedAt);
                        return (
                          <Link
                            key={lesson.id}
                            href={isPrev ? "#" : `/aprender/${subject.id}/${lesson.id}`}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-colors group ${isPrev ? "opacity-40 cursor-not-allowed pointer-events-none" : "hover:bg-white/5"}`}
                          >
                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${isDone ? "gradient-neon" : isPrev ? "bg-white/5" : "bg-white/8"}`}>
                              {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-black" /> : isPrev ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Play className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{lesson.title}</p>
                              <p className="text-[10px] text-muted-foreground">{lesson.topic} · {lesson.duration} min</p>
                            </div>
                          </Link>
                        );
                      })}
                      {subject.lessons.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center py-1">+{subject.lessons.length - 3} aulas</p>
                      )}
                    </div>

                    <Link href={`/aprender/${subject.id}`} className="flex items-center justify-between w-full gradient-neon text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
                      <span>{nextLesson ? "Continuar" : "Revisitar"}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
