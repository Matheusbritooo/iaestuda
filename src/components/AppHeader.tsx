import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Brain, BarChart3, Target, BookOpen, BrainCircuit, Trophy, TrendingUp, User, Zap, Flame } from "lucide-react";

export type NavKey =
  | "dashboard" | "concursos" | "aprender" | "questoes" | "desafio"
  | "revisao" | "ranking" | "perfil" | "progresso" | "metas"
  | "plano" | "materiais" | "ia";

const links: { href: string; label: string; key: NavKey; icon: React.ElementType; badge?: string }[] = [
  { href: "/", label: "Dashboard", key: "dashboard", icon: BarChart3 },
  { href: "/concursos", label: "Concursos", key: "concursos", icon: Target },
  { href: "/aprender", label: "Aprender", key: "aprender", icon: BookOpen },
  { href: "/questoes", label: "Questões", key: "questoes", icon: BrainCircuit },
  { href: "/desafio", label: "Desafio", key: "desafio", icon: Zap, badge: "Hoje" },
  { href: "/progresso", label: "Progresso", key: "progresso", icon: TrendingUp },
  { href: "/ranking", label: "Ranking", key: "ranking", icon: Trophy },
];

export default function AppHeader({ active }: { active?: NavKey }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/85 backdrop-blur-xl px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative p-2 rounded-xl gradient-neon glow-neon">
            <Brain className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gradient-neon hidden sm:block">IAestuda</span>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <link.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                {link.label}
                {link.badge && (
                  <span className="text-[9px] font-bold gradient-neon text-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/metas"
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active === "metas" ? "text-orange-400 bg-orange-400/10" : "text-muted-foreground hover:text-orange-400"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/perfil"
            className={`p-1.5 rounded-lg transition-colors ${
              active === "perfil" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
