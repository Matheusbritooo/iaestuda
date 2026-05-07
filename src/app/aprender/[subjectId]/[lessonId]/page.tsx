import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle2, Play, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import CompleteLessonButton from "@/components/CompleteLessonButton";

export default async function LessonPage({ params }: { params: Promise<{ subjectId: string; lessonId: string }> }) {
  const { subjectId, lessonId } = await params;
  const user = await getOrCreateDbUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      subject: { include: { lessons: { orderBy: { order: "asc" } }, studyPlan: { select: { userId: true } } } },
      progress: { where: { userId: user.id } },
    },
  });
  if (!lesson || lesson.subject.studyPlan.userId !== user.id) notFound();

  const isCompleted = lesson.progress.some((p) => p.completedAt);
  const allLessons = lesson.subject.lessons;
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = allLessons[currentIdx - 1] ?? null;
  const nextLesson = allLessons[currentIdx + 1] ?? null;

  const TYPE_COLORS: Record<string, string> = {
    video: "text-primary border-primary/20 bg-primary/10",
    reading: "text-blue-400 border-blue-400/20 bg-blue-400/10",
    exercise: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  };

  return (
    <AppLayout active="aprender">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/aprender" className="hover:text-foreground">Aulas</Link>
          <span>/</span>
          <Link href={`/aprender/${subjectId}`} className="hover:text-foreground">{lesson.subject.name}</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[150px]">{lesson.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs border ${TYPE_COLORS[lesson.type] ?? TYPE_COLORS.video}`}>
              {lesson.type === "video" ? "Vídeo" : lesson.type === "reading" ? "Leitura" : "Exercício"}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">{lesson.subject.name}</Badge>
            <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />{lesson.duration} min
            </Badge>
            {isCompleted && (
              <Badge className="gradient-neon text-black border-0 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />Concluído
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p className="text-muted-foreground text-sm">{lesson.topic}</p>
        </div>

        {/* Video player */}
        {lesson.type === "video" && (
          <div className="rounded-2xl overflow-hidden border border-white/8">
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center gap-4 relative">
              <div className="absolute inset-0 grid-pattern opacity-20" />
              <div className="relative h-16 w-16 rounded-full gradient-neon glow-neon flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <Play className="h-7 w-7 text-black ml-1" />
              </div>
              <p className="relative text-sm text-muted-foreground">{lesson.duration} minutos</p>
            </div>
          </div>
        )}

        {/* Content */}
        <Card className="glass-card border-white/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Conteúdo da aula</span>
            </div>
            <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <CompleteLessonButton lessonId={lesson.id} isCompleted={isCompleted} subjectId={subjectId} />
          <div className="flex gap-2">
            {prevLesson && (
              <Link href={`/aprender/${subjectId}/${prevLesson.id}`}>
                <Badge variant="outline" className="border-white/10 cursor-pointer hover:bg-white/5 gap-1 py-1.5 px-3 text-sm">
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </Badge>
              </Link>
            )}
            {nextLesson && (
              <Link href={`/aprender/${subjectId}/${nextLesson.id}`}>
                <Badge className="gradient-neon text-black border-0 cursor-pointer hover:opacity-90 gap-1 py-1.5 px-3 text-sm">
                  Próxima <ChevronRight className="h-3.5 w-3.5" />
                </Badge>
              </Link>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card rounded-xl p-4 border-white/5 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{lesson.subject.name}</span>
            <span>{currentIdx + 1}/{allLessons.length}</span>
          </div>
          <div className="flex gap-1">
            {allLessons.map((l, i) => (
              <Link key={l.id} href={`/aprender/${subjectId}/${l.id}`} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${l.id === lessonId ? "bg-primary" : i < currentIdx ? "bg-primary/40" : "bg-white/10"}`} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
