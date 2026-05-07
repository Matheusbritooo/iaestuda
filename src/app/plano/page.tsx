import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppLayout from "@/components/AppLayout";

const PRIORITY_LABEL: Record<number, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const PRIORITY_COLOR: Record<number, string> = {
  1: "bg-red-400/10 text-red-400 border-red-400/20",
  2: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  3: "bg-white/5 text-muted-foreground border-white/10",
};

export default async function PlanoPage() {
  const user = await getOrCreateDbUser();
  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id },
    include: {
      subjects: {
        include: {
          studySessions: { where: { userId: user.id }, orderBy: { date: "desc" }, take: 1 },
          _count: { select: { lessons: true, questions: true } },
        },
        orderBy: { priority: "asc" },
      },
    },
  });

  const totalHours = plan?.subjects.reduce((a, s) => a + s.weeklyHours, 0) ?? 0;
  const weeksLeft = plan?.examDate ? Math.max(0, Math.ceil((plan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))) : null;

  return (
    <AppLayout active="plano">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gradient-neon flex items-center gap-2">
              <BookOpen className="h-6 w-6" /> Plano de Estudos
            </h1>
            {plan && <p className="text-muted-foreground text-sm mt-0.5">{plan.examName}</p>}
          </div>
          {plan?.examDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(plan.examDate, "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Matérias", value: plan?.subjects.length ?? 0 },
            { label: "Horas/semana", value: `${totalHours}h` },
            { label: "Semanas restantes", value: weeksLeft ?? "—" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {plan?.subjects && plan.subjects.length > 0 ? (
          <div className="space-y-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Matérias</h2>
            {plan.subjects.map((subject) => (
              <Card key={subject.id} className="glass-card border-white/5 hover:border-white/10 transition-all">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">{subject.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{subject.weeklyHours}h/semana</span>
                      <span>{subject._count.lessons} aulas · {subject._count.questions} questões</span>
                      {subject.studySessions[0] && (
                        <span>Última: {format(subject.studySessions[0].date, "dd/MM", { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs border shrink-0 ${PRIORITY_COLOR[subject.priority] ?? ""}`}>
                    {PRIORITY_LABEL[subject.priority] ?? "Normal"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card border-dashed border-white/8">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Aguardando carregamento do plano...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
