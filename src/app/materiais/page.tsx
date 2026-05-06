import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ChevronRight, FileText, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const TYPE_LABEL: Record<string, string> = {
  article: "Teoria",
  exercise: "Exercício",
  summary: "Resumo",
};

const TYPE_COLOR: Record<string, string> = {
  article: "bg-blue-100 text-blue-700",
  exercise: "bg-violet-100 text-violet-700",
  summary: "bg-amber-100 text-amber-700",
};

export default async function MateriaisPage() {
  const user = await getOrCreateDbUser();

  const subjects = await prisma.subject.findMany({
    where: { studyPlan: { userId: user.id } },
    include: {
      materials: {
        include: {
          progress: { where: { userId: user.id } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { priority: "asc" },
  });

  const totalMaterials = subjects.reduce((a, s) => a + s.materials.length, 0);
  const completedMaterials = subjects.reduce(
    (a, s) => a + s.materials.filter((m) => m.progress.some((p) => p.completedAt)).length,
    0
  );
  const overallPct = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="materiais" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Materiais de Estudo
            </h1>
            <p className="text-muted-foreground mt-1">
              Conteúdo estruturado por matéria para sua aprovação
            </p>
          </div>

          <div className="bg-card border rounded-xl px-4 py-3 text-center min-w-[140px] shadow-sm">
            <p className="text-2xl font-bold">{overallPct}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedMaterials}/{totalMaterials} concluídos
            </p>
            <Progress value={overallPct} className="h-1.5 mt-2" />
          </div>
        </div>

        {subjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Nenhum material disponível ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure seu plano de estudos para acessar os materiais
              </p>
              <Link href="/plano" className="inline-block mt-4">
                <Badge variant="secondary" className="cursor-pointer">
                  Ir para o plano
                </Badge>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => {
              const done = subject.materials.filter((m) =>
                m.progress.some((p) => p.completedAt)
              ).length;
              const total = subject.materials.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <Card key={subject.id} className="shadow-sm overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg gradient-primary">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="font-semibold">{subject.name}</h2>
                          <p className="text-xs text-muted-foreground">
                            {done}/{total} módulos concluídos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-32">
                          <Progress value={pct} className="h-1.5" />
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            pct === 100
                              ? "bg-emerald-100 text-emerald-700"
                              : pct > 0
                              ? "bg-blue-100 text-blue-700"
                              : ""
                          }
                        >
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {total === 0 ? (
                    <div className="px-5 py-4 text-sm text-muted-foreground text-center">
                      Nenhum material adicionado ainda
                    </div>
                  ) : (
                    <div className="divide-y">
                      {subject.materials.map((material, idx) => {
                        const isCompleted = material.progress.some((p) => p.completedAt);
                        const isLocked = idx > 0 && !subject.materials[idx - 1].progress.some((p) => p.completedAt);

                        return (
                          <Link
                            key={material.id}
                            href={isLocked ? "#" : `/materiais/${subject.id}/${material.id}`}
                            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors group ${isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isCompleted ? "bg-emerald-100" : "bg-muted"}`}>
                              {isCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : isLocked ? (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {material.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs px-1.5 py-0 ${TYPE_COLOR[material.type] ?? ""}`}
                                >
                                  {TYPE_LABEL[material.type] ?? material.type}
                                </Badge>
                              </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
