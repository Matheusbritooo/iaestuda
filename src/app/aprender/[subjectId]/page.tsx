import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, Lock, CheckCircle2, ChevronLeft, Clock } from "lucide-react";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = { video: "Vídeo", reading: "Leitura", exercise: "Exercício" };
const TYPE_COLORS: Record<string, string> = {
  video: "text-primary border-primary/20 bg-primary/10",
  reading: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  exercise: "text-amber-400 border-amber-400/20 bg-amber-400/10",
};

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const user = await getOrCreateDbUser();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      lessons: { include: { progress: { where: { userId: user.id } } }, orderBy: { order: "asc" } },
      studyPlan: { select: { userId: true } },
    },
  });
  if (!subject || subject.studyPlan.userId !== user.id) notFound();

  const completed = subject.lessons.filter((l) => l.progress.some((p) => p.completedAt)).length;
  const pct = subject.lessons.length > 0 ? Math.round((completed / subject.lessons.length) * 100) : 0;

  const topicGroups = subject.lessons.reduce((acc: Record<string, typeof subject.lessons>, lesson) => {
    if (!acc[lesson.topic]) acc[lesson.topic] = [];
    acc[lesson.topic].push(lesson);
    return acc;
  }, {});

  return (
    <AppLayout active="aprender">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/aprender" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Aulas
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{subject.name}</span>
        </div>

        <Card className="glass-card border-white/5 overflow-hidden">
          <div className="gradient-navy p-5 relative">
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative">
              <h1 className="text-xl font-bold">{subject.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <Progress value={pct} className="flex-1 h-1.5 bg-white/10" />
                <span className="text-primary font-bold">{pct}%</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1">{completed}/{subject.lessons.length} aulas concluídas</p>
            </div>
          </div>
        </Card>

        {Object.entries(topicGroups).map(([topic, lessons]) => (
          <div key={topic} className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{topic}</h2>
            {lessons.map((lesson, idx) => {
              const isDone = lesson.progress.some((p) => p.completedAt);
              const allPrev = lessons.slice(0, idx).every((l) => l.progress.some((p) => p.completedAt));
              const isLocked = idx > 0 && !allPrev;
              const typeColor = TYPE_COLORS[lesson.type] ?? TYPE_COLORS.video;
              return (
                <Link key={lesson.id} href={isLocked ? "#" : `/aprender/${subjectId}/${lesson.id}`} className={isLocked ? "pointer-events-none" : ""}>
                  <Card className={`glass-card border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all ${isLocked ? "opacity-40" : "cursor-pointer group"} ${isDone ? "border-primary/15" : ""}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "gradient-neon" : isLocked ? "bg-white/5" : "bg-white/7 group-hover:bg-primary/10 transition-colors"}`}>
                        {isDone ? <CheckCircle2 className="h-4 w-4 text-black" /> : isLocked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isDone ? "text-foreground/70" : "text-foreground"}`}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${typeColor}`}>{TYPE_LABELS[lesson.type]}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {lesson.duration} min</span>
                        </div>
                      </div>
                      {isDone && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
