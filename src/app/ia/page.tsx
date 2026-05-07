import AppLayout from "@/components/AppLayout";
import AiChat from "@/components/AiChat";
import { Sparkles, Brain, Zap, Target, BookOpen, FileQuestion } from "lucide-react";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const STARTERS = [
  "Explique o princípio da legalidade na CF/88",
  "Qual a diferença entre juros simples e compostos?",
  "Como funciona a contrapositiva na lógica?",
  "Resuma os remédios constitucionais",
  "Me dê um plano de estudo para 30 dias",
  "Explique os atributos do ato administrativo",
  "Como não errar questões de Português em concursos?",
  "O que é phishing e como se proteger?",
];

export default async function IaPage() {
  const user = await getOrCreateDbUser();

  const [errorRate, nextLesson] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const total = await tx.userAnswer.count({ where: { userId: user.id } });
      const correct = await tx.userAnswer.count({ where: { userId: user.id, isCorrect: true } });
      return total > 0 ? Math.round(((total - correct) / total) * 100) : 0;
    }),
    prisma.lesson.findFirst({
      where: {
        subject: { studyPlan: { userId: user.id } },
        progress: { none: { userId: user.id } },
      },
      include: { subject: { select: { name: true } } },
      orderBy: [{ subject: { priority: "asc" } }, { order: "asc" }],
    }),
  ]);

  return (
    <AppLayout active="ia">
      <div className="p-6 max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 24px)" }}>
        {/* Header */}
        <div className="mb-5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-purple"><Sparkles className="h-4 w-4 text-white" /></div>
            <h1 className="text-xl font-bold">IA Tutor</h1>
            <span className="text-xs gradient-purple text-white px-2 py-0.5 rounded-full font-bold">Claude AI</span>
          </div>
          <p className="text-muted-foreground text-sm">Professor especializado em concursos. Tire dúvidas, peça resumos e gere planos de estudo.</p>
        </div>

        {/* Context cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { icon: Target, label: "Taxa de erro", value: `${errorRate}%`, color: "text-red-400", note: errorRate > 40 ? "⚠ Revise conteúdos" : "✓ Bom desempenho" },
            { icon: BookOpen, label: "Próxima aula", value: nextLesson?.subject.name ?? "—", color: "text-primary", note: nextLesson?.title ?? "Tudo em dia!" },
            { icon: Brain, label: "Especialidade", value: "Concursos", color: "text-secondary", note: "INSS · PF · TRF · Receita" },
          ].map((c) => (
            <div key={c.label} className="glass-card rounded-xl p-3 border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                <span className="text-[10px] text-muted-foreground">{c.label}</span>
              </div>
              <p className={`font-bold text-sm ${c.color} truncate`}>{c.value}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AiChat starters={STARTERS} />
        </div>
      </div>
    </AppLayout>
  );
}
