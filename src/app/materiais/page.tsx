import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ChevronRight, CheckCircle2, Lock, FileText } from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

const TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  exercise: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  summary: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};
const TYPE_LABELS: Record<string, string> = { article: "Teoria", exercise: "Exercício", summary: "Resumo" };

export default async function MateriaisPage() {
  const user = await getOrCreateDbUser();
  const subjects = await prisma.subject.findMany({
    where: { studyPlan: { userId: user.id } },
    include: { materials: { include: { progress: { where: { userId: user.id } } }, orderBy: { order: "asc" } } },
    orderBy: { priority: "asc" },
  });

  const totalM = subjects.reduce((a, s) => a + s.materials.length, 0);
  const doneM = subjects.reduce((a, s) => a + s.materials.filter((m) => m.progress.some((p) => p.completedAt)).length, 0);
  const overallPct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

  return (
    <AppLayout active="materiais">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gradient-neon flex items-center gap-2">
              <BookOpen className="h-6 w-6" /> Materiais
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Conteúdo complementar por matéria</p>
          </div>
          <div className="glass-card rounded-xl px-4 py-2.5 border-neon text-center">
            <p className="text-xl font-bold text-gradient-neon">{overallPct}%</p>
            <p className="text-[10px] text-muted-foreground">{doneM}/{totalM} concluídos</p>
            <Progress value={overallPct} className="h-1 mt-1 bg-white/8" />
          </div>
        </div>

        {subjects.map((subject) => {
          const done = subject.materials.filter((m) => m.progress.some((p) => p.completedAt)).length;
          const total = subject.materials.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Card key={subject.id} className="glass-card border-white/5 overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{subject.name}</h2>
                    <p className="text-xs text-muted-foreground">{done}/{total} módulos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="w-24 h-1 bg-white/8 hidden sm:block" />
                    <Badge variant="outline" className={`text-xs border-white/10 ${pct === 100 ? "text-primary" : ""}`}>{pct}%</Badge>
                  </div>
                </div>
              </div>

              {total === 0 ? (
                <div className="px-5 py-4 text-sm text-muted-foreground text-center">Nenhum material disponível</div>
              ) : (
                <div className="divide-y divide-white/4">
                  {subject.materials.map((material, idx) => {
                    const isCompleted = material.progress.some((p) => p.completedAt);
                    const isLocked = idx > 0 && !subject.materials[idx - 1].progress.some((p) => p.completedAt);
                    return (
                      <Link key={material.id} href={isLocked ? "#" : `/materiais/${subject.id}/${material.id}`}
                        className={`flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors group ${isLocked ? "opacity-40 pointer-events-none" : ""}`}>
                        <div className={`p-1.5 rounded-lg shrink-0 ${isCompleted ? "gradient-neon" : "bg-white/6"}`}>
                          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-black" /> : isLocked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{material.title}</p>
                          <Badge variant="outline" className={`text-[10px] border mt-0.5 ${TYPE_COLORS[material.type] ?? ""}`}>
                            {TYPE_LABELS[material.type] ?? material.type}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
