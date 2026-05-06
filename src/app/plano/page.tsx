import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppHeader from "@/components/AppHeader";

const PRIORITY_LABEL: Record<number, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const PRIORITY_COLOR: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-gray-100 text-gray-700",
};

export default async function PlanoPage() {
  const user = await getOrCreateDbUser();

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id },
    include: {
      subjects: {
        include: {
          studySessions: {
            where: { userId: user.id },
            orderBy: { date: "desc" },
            take: 1,
          },
        },
        orderBy: { priority: "asc" },
      },
    },
  });

  const totalWeeklyHours = plan?.subjects.reduce((a, s) => a + s.weeklyHours, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="plano" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Plano de Estudos
            </h1>
            {plan && <p className="text-muted-foreground mt-1">{plan.examName}</p>}
          </div>
          {plan?.examDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Prova: {format(plan.examDate, "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{plan?.subjects.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Matérias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{totalWeeklyHours}h</p>
              <p className="text-sm text-muted-foreground">Por semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">
                {plan?.examDate
                  ? Math.ceil((plan.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Semanas restantes</p>
            </CardContent>
          </Card>
        </div>

        {plan?.subjects && plan.subjects.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Matérias</h2>
            {plan.subjects.map((subject) => (
              <Card key={subject.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{subject.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{subject.weeklyHours}h/semana</span>
                        {subject.studySessions[0] && (
                          <span>
                            · Última sessão:{" "}
                            {format(subject.studySessions[0].date, "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={PRIORITY_COLOR[subject.priority] ?? ""}>
                      {PRIORITY_LABEL[subject.priority] ?? "Normal"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              Nenhum plano de estudos criado ainda.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
