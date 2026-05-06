import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Brain, BarChart3, Target, BookOpen, BrainCircuit, Trophy, TrendingUp, User } from "lucide-react";

export type NavKey = "dashboard" | "aprender" | "questoes" | "revisao" | "ranking" | "perfil" | "progresso" | "metas" | "plano" | "materiais" | "ia";

const links: { href: string; label: string; key: NavKey; icon: React.ElementType }[] = [
  { href: "/", label: "Dashboard", key: "dashboard", icon: BarChart3 },
  { href: "/aprender", label: "Aprender", key: "aprender", icon: BookOpen },
  { href: "/questoes", label: "Questões", key: "questoes", icon: Target },
  { href: "/revisao", label: "Revisão", key: "revisao", icon: BrainCircuit },
  { href: "/progresso", label: "Progresso", key: "progresso", icon: TrendingUp },
  { href: "/ranking", label: "Ranking", key: "ranking", icon: Trophy },
];

export default function AppHeader({ active }: { active?: NavKey }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/85 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="relative p-2 rounded-xl gradient-neon glow-neon">
          <Brain className="h-4 w-4 text-black" />
        </div>
        <span className="font-bold text-lg tracking-tight text-gradient-neon">IAestuda</span>
      </Link>

      <nav className="hidden md:flex items-center gap-0.5">
        {links.map((link) => {
          const isActive = active === link.key;
          return (
            <Link key={link.key} href={link.href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}>
              <link.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/perfil" className={`p-1.5 rounded-lg transition-colors ${active === "perfil" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
          <User className="h-4 w-4" />
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
