import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Flame, Target, Clock, Star } from "lucide-react";
import { getLevelInfo } from "@/lib/level";

type RankPlayer = { id: string; name: string; xp: number; streak: number; hitRate: number; isUser: boolean; level: number; title: string };

const SIMULATED: Omit<RankPlayer, "isUser" | "level" | "title">[] = [
  { id: "s1", name: "Ana Carvalho", xp: 8420, streak: 32, hitRate: 91 },
  { id: "s2", name: "Pedro Lima", xp: 6850, streak: 21, hitRate: 87 },
  { id: "s3", name: "Julia Santos", xp: 5200, streak: 15, hitRate: 82 },
  { id: "s4", name: "Carlos Mendes", xp: 4100, streak: 12, hitRate: 79 },
  { id: "s5", name: "Beatriz Costa", xp: 3300, streak: 8, hitRate: 75 },
  { id: "s6", name: "Lucas Oliveira", xp: 2800, streak: 7, hitRate: 72 },
  { id: "s7", name: "Fernanda Reis", xp: 2100, streak: 5, hitRate: 68 },
  { id: "s8", name: "Rafael Souza", xp: 1600, streak: 4, hitRate: 65 },
  { id: "s9", name: "Camila Neves", xp: 1200, streak: 3, hitRate: 61 },
];

const RANK_ICONS = [
  <Crown key="1" className="h-4 w-4 text-amber-400" />,
  <Medal key="2" className="h-4 w-4 text-slate-300" />,
  <Medal key="3" className="h-4 w-4 text-orange-500" />,
];

export default async function RankingPage() {
  const user = await getOrCreateDbUser();

  const [totalMinutes, totalAnswers, correctAnswers, dailyGoals] = await Promise.all([
    prisma.studySession.aggregate({ where: { userId: user.id }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId: user.id } }),
    prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
    prisma.dailyGoal.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 30 }),
  ]);

  const mins = totalMinutes._sum.minutes ?? 0;
  const hitRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const streak = [...dailyGoals].reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const userXp = mins + correctAnswers * 10 + streak * 30;
  const levelInfo = getLevelInfo(userXp);

  const allPlayers: RankPlayer[] = [
    ...SIMULATED.map((p) => {
      const li = getLevelInfo(p.xp);
      return { ...p, isUser: false, level: li.level, title: li.title };
    }),
    { id: user.id, name: user.name, xp: userXp, streak, hitRate, isUser: true, level: levelInfo.level, title: levelInfo.title },
  ].sort((a, b) => b.xp - a.xp);

  const userPos = allPlayers.findIndex((p) => p.isUser) + 1;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="ranking" />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-gradient-neon">Ranking Global</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Atualizado em tempo real após cada questão respondida</p>
          </div>
          <div className="glass-card rounded-2xl px-5 py-3 border-neon flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-neon shrink-0"><Star className="h-4 w-4 text-black" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground">Sua posição</p>
              <p className="text-xl font-bold text-gradient-neon">#{userPos}º lugar</p>
            </div>
          </div>
        </div>

        {/* User stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Trophy, label: "XP Total", value: userXp.toLocaleString("pt-BR"), color: "text-primary" },
            { icon: Target, label: "Taxa de acerto", value: `${hitRate}%`, color: "text-secondary" },
            { icon: Flame, label: "Streak atual", value: `${streak} dias`, color: "text-orange-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global ranking */}
        <Card className="glass-card border-white/5 glow-card">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-foreground/80">Top candidatos</CardTitle>
            <Badge className="gradient-neon text-black border-0 text-xs">Ao vivo</Badge>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {allPlayers.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  player.isUser ? "border border-primary/25 bg-primary/5 glow-neon" : "hover:bg-white/3"
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  {i < 3 ? RANK_ICONS[i] : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                </div>

                {/* Avatar */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${player.isUser ? "gradient-neon text-black" : "bg-white/8 text-foreground/60"}`}>
                  {player.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${player.isUser ? "text-primary" : "text-foreground/90"}`}>
                      {player.name}
                      {player.isUser && <span className="text-xs text-muted-foreground font-normal ml-1">(você)</span>}
                    </p>
                    <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground hidden sm:flex shrink-0">Nv.{player.level} {player.title}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" />{player.streak}d</span>
                    <span className="flex items-center gap-1"><Target className="h-3 w-3 text-secondary" />{player.hitRate}%</span>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${player.isUser ? "text-gradient-neon" : "text-foreground/80"}`}>
                    {player.xp.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How XP is calculated */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/80">Como o XP é calculado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Clock, label: "Tempo de estudo", value: "+1 XP/min" },
                { icon: Target, label: "Acerto em questão", value: "+10 XP" },
                { icon: Flame, label: "Streak diário", value: "+30 XP/dia" },
                { icon: Star, label: "Aula concluída", value: "+20 XP" },
              ].map((item) => (
                <div key={item.label} className="glass rounded-xl p-3 text-center">
                  <item.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-gradient-neon mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
