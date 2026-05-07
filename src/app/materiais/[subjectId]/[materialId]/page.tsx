import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import CompleteMaterialButton from "@/components/CompleteMaterialButton";

export default async function MaterialPage({ params }: { params: Promise<{ subjectId: string; materialId: string }> }) {
  const { subjectId, materialId } = await params;
  const user = await getOrCreateDbUser();

  const [material, subject] = await Promise.all([
    prisma.material.findUnique({
      where: { id: materialId },
      include: { progress: { where: { userId: user.id } }, subject: { include: { materials: { orderBy: { order: "asc" } } } } },
    }),
    prisma.subject.findUnique({ where: { id: subjectId }, include: { materials: { orderBy: { order: "asc" } } } }),
  ]);
  if (!material || material.subjectId !== subjectId) notFound();

  const isCompleted = material.progress.some((p) => p.completedAt);
  const currentIndex = subject?.materials.findIndex((m) => m.id === materialId) ?? 0;
  const prevMaterial = subject?.materials[currentIndex - 1] ?? null;
  const nextMaterial = subject?.materials[currentIndex + 1] ?? null;

  return (
    <AppLayout active="materiais">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/materiais" className="flex items-center gap-1 hover:text-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Materiais
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{material.subject.name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate max-w-[150px]">{material.title}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{material.subject.name}</Badge>
            {isCompleted && <Badge className="gradient-neon text-black border-0 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>}
          </div>
          <h1 className="text-xl font-bold">{material.title}</h1>
        </div>

        <Card className="glass-card border-white/5">
          <CardContent className="pt-5 pb-5">
            <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{material.content}</div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <CompleteMaterialButton materialId={material.id} isCompleted={isCompleted} />
          <div className="flex gap-2">
            {prevMaterial && (
              <Link href={`/materiais/${subjectId}/${prevMaterial.id}`}>
                <Badge variant="outline" className="border-white/10 cursor-pointer hover:bg-white/5 gap-1 py-1.5 px-3">
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </Badge>
              </Link>
            )}
            {nextMaterial && (
              <Link href={`/materiais/${subjectId}/${nextMaterial.id}`}>
                <Badge className="gradient-neon text-black border-0 cursor-pointer hover:opacity-90 gap-1 py-1.5 px-3">
                  Próximo <ChevronRight className="h-3.5 w-3.5" />
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
