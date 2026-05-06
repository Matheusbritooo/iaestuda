import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import CompleteMaterialButton from "@/components/CompleteMaterialButton";

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

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ subjectId: string; materialId: string }>;
}) {
  const { subjectId, materialId } = await params;
  const user = await getOrCreateDbUser();

  const [material, subject] = await Promise.all([
    prisma.material.findUnique({
      where: { id: materialId },
      include: {
        progress: { where: { userId: user.id } },
        subject: { include: { materials: { orderBy: { order: "asc" } } } },
      },
    }),
    prisma.subject.findUnique({
      where: { id: subjectId },
      include: { materials: { orderBy: { order: "asc" } } },
    }),
  ]);

  if (!material || material.subjectId !== subjectId) notFound();

  const isCompleted = material.progress.some((p) => p.completedAt);
  const currentIndex = subject?.materials.findIndex((m) => m.id === materialId) ?? 0;
  const prevMaterial = subject?.materials[currentIndex - 1] ?? null;
  const nextMaterial = subject?.materials[currentIndex + 1] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="materiais" />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/materiais" className="hover:text-foreground transition-colors flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            Materiais
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{material.subject.name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate max-w-[200px]">{material.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={TYPE_COLOR[material.type] ?? ""}>
              {TYPE_LABEL[material.type] ?? material.type}
            </Badge>
            <Badge variant="secondary">{material.subject.name}</Badge>
            {isCompleted && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{material.title}</h1>
        </div>

        {/* Content */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div
              className="prose prose-sm max-w-none text-foreground leading-relaxed space-y-4 whitespace-pre-wrap"
            >
              {material.content}
            </div>
          </CardContent>
        </Card>

        {/* Complete button + navigation */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <CompleteMaterialButton
            materialId={material.id}
            isCompleted={isCompleted}
          />

          <div className="flex gap-2">
            {prevMaterial && (
              <Link href={`/materiais/${subjectId}/${prevMaterial.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted gap-1 py-1.5 px-3">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Badge>
              </Link>
            )}
            {nextMaterial && (
              <Link href={`/materiais/${subjectId}/${nextMaterial.id}`}>
                <Badge className="cursor-pointer gradient-primary text-white border-0 gap-1 py-1.5 px-3 hover:opacity-90">
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </Badge>
              </Link>
            )}
          </div>
        </div>

        {/* Progress within subject */}
        <Card className="shadow-sm bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{material.subject.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {currentIndex + 1}/{subject?.materials.length} módulos
              </span>
            </div>
            <div className="flex gap-1.5">
              {subject?.materials.map((m, i) => (
                <Link key={m.id} href={`/materiais/${subjectId}/${m.id}`} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      m.id === materialId
                        ? "bg-primary"
                        : i < currentIndex
                        ? "bg-emerald-400"
                        : "bg-muted"
                    }`}
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
