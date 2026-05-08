import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { getLevelInfo } from "@/lib/level";
import { Progress } from "@/components/ui/progress";
import { SidebarWrapper } from "@/components/SidebarClient";
import {
  Brain, BarChart3, Target, BookOpen, BrainCircuit, Trophy,
  TrendingUp, Zap, Flame, User, Sparkles, GraduationCap,
  FileQuestion, Layers, Clock, Star,
} from "lucide-react";

export type NavKey =
  | "dashboard" | "concursos" | "aprender" | "questoes" | "desafio"
  | "revisao" | "ranking" | "perfil" | "progresso" | "metas"
  | "plano" | "ia" | "materiais" | "simulado" | "missoes" | "comunidade";

const NAV_GROUPS = [
  {
    label: "Visão Geral",
    items: [
      { href: "/", key: "dashboard", icon: BarChart3, label: "Dashboard" },
      { href: "/concursos", key: "concursos", icon: Target, label: "Trilha" },
      { href: "/missoes", key: "missoes", icon: Star, label: "Missões", badge: "XP" },
    ],
  },
  {
    label: "Estudar",
    items: [
      { href: "/aprender", key: "aprender", icon: BookOpen, label: "Aulas" },
      { href: "/revisao", key: "revisao", icon: BrainCircuit, label: "Revisão" },
    ],
  },
  {
    label: "Praticar",
    items: [
      { href: "/questoes", key: "questoes", icon: FileQuestion, label: "Questões" },
      { href: "/desafio", key: "desafio", icon: Zap, label: "Desafio do Dia", badge: "Hoje" },
      { href: "/questoes/simulado", key: "simulado", icon: Clock, label: "Simulado" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { href: "/comunidade", key: "comunidade", icon: Layers, label: "Fórum" },
      { href: "/ranking", key: "ranking", icon: Trophy, label: "Ranking" },
      { href: "/progresso", key: "progresso", icon: TrendingUp, label: "Progresso" },
    ],
  },
] as const;

async function getSidebarData(userId: string) {
  const [totalMinutes, streak, subjects, flashcardsToReview] = await Promise.all([
    prisma.studySession.aggregate({ where: { userId }, _sum: { minutes: true } }),
    prisma.dailyGoal.count({ where: { userId, completed: true } }),
    prisma.subject.findMany({
      where: { studyPlan: { userId } },
      select: { id: true, name: true },
      orderBy: { priority: "asc" },
      take: 7,
    }),
    prisma.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
  ]);
  const xp = (totalMinutes._sum.minutes ?? 0);
  return { xp, streak, subjects, flashcardsToReview };
}

export default async function AppLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: NavKey;
}) {
  const user = await getOrCreateDbUser();
  const { xp, streak, subjects, flashcardsToReview } = await getSidebarData(user.id);
  const level = getLevelInfo(xp);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="app-container">
      {/* ── SIDEBAR (com toggle mobile) ── */}
      <SidebarWrapper>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 pt-5 pb-3 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg gradient-neon glow-sm shrink-0">
                <Brain className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="font-bold text-base text-gradient-neon">IAestuda</span>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="px-3 py-3 border-b border-white/5">
            <div className="glass rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Nv.{level.level} {level.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(level.progress)}%</span>
              </div>
              <Progress value={level.progress} className="h-1 bg-white/8" />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Flame className="h-2.5 w-2.5 text-orange-400" />{streak}d streak</span>
                {flashcardsToReview > 0 && (
                  <span className="text-primary font-medium">{flashcardsToReview} revisões</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="sidebar-group-label">{group.label}</p>
                {group.items.map((item) => {
                  const isActive = active === item.key;
                  return (
                    <Link key={item.key} href={item.href} className={`sidebar-nav-item ${isActive ? "active" : ""}`}>
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="text-[9px] gradient-neon text-black font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Subjects */}
            {subjects.length > 0 && (
              <div>
                <p className="sidebar-group-label">Matérias</p>
                {subjects.map((s) => (
                  <Link key={s.id} href={`/aprender/${s.id}`} className={`sidebar-nav-item ${active === ("subject-" + s.id) as NavKey ? "active" : ""}`}>
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* AI Tutor */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <Link href="/ia" className={`sidebar-nav-item ${active === "ia" ? "active" : ""} group`}>
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-secondary" />
                <span>IA Tutor</span>
                <span className="text-[9px] gradient-purple text-white font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Novo
                </span>
              </Link>
            </div>
          </nav>

          {/* User */}
          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-2.5">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{firstName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{xp.toLocaleString("pt-BR")} XP</p>
              </div>
              <Link href="/perfil" className="text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </SidebarWrapper>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
