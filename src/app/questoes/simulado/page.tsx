import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import SimuladoClient from "@/components/SimuladoClient";
import { Zap } from "lucide-react";

export default async function SimuladoPage({ searchParams }: { searchParams: Promise<{ subject?: string; count?: string; time?: string }> }) {
  const user = await getOrCreateDbUser();
  const sp = await searchParams;

  const subjects = await prisma.subject.findMany({
    where: { studyPlan: { userId: user.id } },
    select: { id: true, name: true },
  });

  const count = Math.min(30, Math.max(5, parseInt(sp.count ?? "10")));
  const timeMinutes = parseInt(sp.time ?? "30");
  const questions = await prisma.question.findMany({
    where: { subject: { studyPlan: { userId: user.id } }, ...(sp.subject ? { subjectId: sp.subject } : {}) },
    include: { options: { orderBy: { letter: "asc" } }, subject: { select: { name: true } } },
    take: count,
    orderBy: { id: "asc" },
  });

  const started = sp.count !== undefined;

  return (
    <AppLayout active="questoes">
      <div className="p-6 max-w-4xl mx-auto">
        {!started ? (
          <div className="space-y-8 max-w-lg mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-2xl gradient-neon glow-neon">
                <Zap className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold">Modo Simulado</h1>
              <p className="text-muted-foreground text-sm">Simule a prova real com cronômetro.</p>
            </div>

            <form method="GET" action="/questoes/simulado" className="glass-card rounded-2xl border-white/5 p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matéria</label>
                <select name="subject" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  <option value="">Todas as matérias</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Questões</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map((n) => (
                    <label key={n} className="cursor-pointer">
                      <input type="radio" name="count" value={n} defaultChecked={n === 10} className="sr-only peer" />
                      <div className="text-center py-2.5 rounded-xl border border-white/10 peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary text-muted-foreground text-sm font-medium transition-all">{n}q</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((t) => (
                    <label key={t} className="cursor-pointer">
                      <input type="radio" name="time" value={t} defaultChecked={t === 30} className="sr-only peer" />
                      <div className="text-center py-2.5 rounded-xl border border-white/10 peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary text-muted-foreground text-sm font-medium transition-all">{t}min</div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full gradient-neon glow-neon text-black font-bold py-3 rounded-xl hover:opacity-90 text-sm flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" /> Iniciar Simulado
              </button>
            </form>
          </div>
        ) : (
          <SimuladoClient questions={questions} userId={user.id} timeMinutes={timeMinutes} />
        )}
      </div>
    </AppLayout>
  );
}
