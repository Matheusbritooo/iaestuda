import AppLayout from "@/components/AppLayout";
import AiChat from "@/components/AiChat";
import AiAnalysis from "@/components/AiAnalysis";
import AiStudyPlan from "@/components/AiStudyPlan";
import { Sparkles, BarChart3, Calendar } from "lucide-react";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function IaPage() {
  const user = await getOrCreateDbUser();

  const [errorRate, nextLesson, subjectCount] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const total = await tx.userAnswer.count({ where: { userId: user.id } });
      const correct = await tx.userAnswer.count({ where: { userId: user.id, isCorrect: true } });
      return { total, correct, rate: total > 0 ? Math.round(((total - correct) / total) * 100) : 0 };
    }),
    prisma.lesson.findFirst({
      where: { subject: { studyPlan: { userId: user.id } }, progress: { none: { userId: user.id } } },
      include: { subject: { select: { name: true } } },
      orderBy: [{ subject: { priority: "asc" } }, { order: "asc" }],
    }),
    prisma.subject.count({ where: { studyPlan: { userId: user.id } } }),
  ]);

  return (
    <AppLayout active="ia">
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl gradient-purple"><Sparkles className="h-4 w-4 text-white" /></div>
            <h1 className="text-2xl font-bold">IA Tutor</h1>
            <span className="text-xs gradient-purple text-white px-2.5 py-1 rounded-full font-bold">6 Agentes Ativos</span>
          </div>
          <p className="text-muted-foreground text-sm">Sistema multi-agente com contexto completo do seu desempenho.</p>
        </div>

        {/* Context cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Taxa de erro", value: `${errorRate.rate}%`, note: errorRate.rate > 40 ? "⚠ Revisar conteúdos" : "✓ Bom desempenho", color: errorRate.rate > 40 ? "text-red-400" : "text-primary" },
            { label: "Próxima aula", value: nextLesson?.subject.name ?? "Tudo em dia!", note: nextLesson?.title ?? "Conteúdo atualizado", color: "text-blue-400" },
            { label: "Matérias ativas", value: `${subjectCount}`, note: `${errorRate.total} questões respondidas`, color: "text-secondary" },
          ].map((c) => (
            <div key={c.label} className="glass-card rounded-xl p-3 border-white/5">
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className={`font-bold text-sm ${c.color} mt-0.5 truncate`}>{c.value}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/8 p-1">
            <TabsTrigger value="chat" className="data-[state=active]:gradient-neon data-[state=active]:text-black text-xs">
              💬 Chat com Agentes
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:gradient-neon data-[state=active]:text-black text-xs">
              <BarChart3 className="h-3 w-3 mr-1" /> Análise de Performance
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:gradient-neon data-[state=active]:text-black text-xs">
              <Calendar className="h-3 w-3 mr-1" /> Cronograma Inteligente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <AiChat />
          </TabsContent>

          <TabsContent value="analysis">
            <AiAnalysis />
          </TabsContent>

          <TabsContent value="plan">
            <AiStudyPlan />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
