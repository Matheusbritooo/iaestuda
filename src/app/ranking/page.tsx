import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Flame, Target, Clock, Star, Zap } from "lucide-react";
import { getLevelInfo } from "@/lib/level";

type RankPlayer = { id: string; name: string; xp: number; streak: number; hitRate: number; isUser: boolean; level: number; title: string };

const SIMULATED: Omit<RankPlayer, "isUser" | "level" | "title">[] = [
  { id: "s1", name: "Ana Carvalho", xp: 9200, streak: 38, hitRate: 93 },
  { id: "s2", name: "Pedro Lima", xp: 7400, streak: 24, hitRate: 88 },
  { id: "s3", name: "Julia Santos", xp: 5800, streak: 18, hitRate: 84 },
  { id: "s4", name: "Carlos Mendes", xp: 4500, streak: 14, hitRate: 80 },
  { id: "s5", name: "Beatriz Costa", xp: 3600, streak: 10, hitRate: 76 },
  { id: "s6", name: "Lucas Oliveira", xp: 2900, streak: 8, hitRate: 73 },
  { id: "s7", name: "Fernanda Reis", xp: 2200, streak: 6, hitRate: 69 },
  { id: "s8", name: "Rafael Souza", xp: 1700, streak: 5, hitRate: 65 },
  { id: "s9", name: "Camila Neves", xp: 1300, streak: 4, hitRate: 62 },
];

const RANK_ICONS = [
  <Crown key="1" className="h-4 w-4 text-amber-400" />,
  <Medal key="2" className="h-4 w-4 text-slate-300" />,
  <Medal key="3" className="h-4 w-4 text-orange-500" />,
];

export default async function RankingPage() {
  const user = await getOrCreateDbUser();

  const [totalSess, totalAnswers, correctAnswers, dailyGoals] = await Promise.all([
    prisma.studySession.aggregate({ where: { userId: user.id }, _sum: { minutes: true } }),
    prisma.userAnswer.count({ where: { userId: user.id } }),
    prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
    prisma.dailyGoal.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 30 }),
  ]);

  const totalMinutes = totalSess._sum.minutes ?? 0;
  const hitRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const streak = [...dailyGoals].reduce(
    (acc: { count: number; counting: boolean }, g) => {
      if (acc.counting && g.completed) return { count: acc.count + 1, counting: true };
      if (acc.counting && !g.completed) return { ...acc, counting: false };
      return acc;
    }, { count: 0, counting: true }
  ).count;

  const xp = totalMinutes + correctAnswers * 10 + streak * 30;
  const level = getLevelInfo(xp);

  const allPlayers: RankPlayer[] = [
    ...SIMULATED.map((p) => { const li = getLevelInfo(p.xp); return { ...p, isUser: false, level: li.level, title: li.title }; }),
    { id: user.id, name: user.name, xp, streak, hitRate, isUser: true, level: level.level, title: level.title },
  ].sort((a, b) => b.xp - a.xp);

  const userPos = allPlayers.findIndex((p) => p.isUser) + 1;

  return (
    <AppLayout active="ranking">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gradient-neon">Ranking Global</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Atualizado após cada questão respondida</p>
          </div>
          <div className="glass-card rounded-xl px-4 py-2.5 border-neon text-center">
            <p className="text-2xl font-bold text-gradient-neon">#{userPos}º</p>
            <p className="text-[10px] text-muted-foreground">sua posição</p>
          </div>
        </div>

        {/* User stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "XP Total", value: xp.toLocaleString("pt-BR"), color: "text-primary" },
            { icon: Target, label: "Taxa de acerto", value: `${hitRate}%`, color: "text-secondary" },
            { icon: Flame, label: "Streak", value: `${streak} dias`, color: "text-orange-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 flex items-center gap-2.5">
                <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rankings */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Top candidatos</CardTitle>
            <Badge className="gradient-neon text-black border-0 text-[10px] flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" /> Ao vivo
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            {allPlayers.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  player.isUser ? "border border-primary/20 bg-primary/4" : "hover:bg-white/2"
                }`}
              >
                <div className="w-7 flex items-center justify-center shrink-0">
                  {i < 3 ? RANK_ICONS[i] : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                </div>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${player.isUser ? "gradient-neon text-black" : "bg-white/7 text-foreground/50"}`}>
                  {player.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${player.isUser ? "text-primary" : "text-foreground/90"}`}>
                      {player.name}
                      {player.isUser && <span className="text-xs text-muted-foreground font-normal ml-1">(você)</span>}
                    </p>
                    <Badge variant="outline" className="text-[9px] border-white/8 text-muted-foreground hidden sm:flex shrink-0">
                      Nv.{player.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5 text-orange-400" />{player.streak}d</span>
                    <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5 text-secondary" />{player.hitRate}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${player.isUser ? "text-gradient-neon" : "text-foreground/70"}`}>
                    {player.xp.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* XP table */}
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Como ganhar XP</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Clock, label: "Minuto estudado", value: "+1 XP" },
                { icon: Target, label: "Questão certa", value: "+10 XP" },
                { icon: Flame, label: "Dia com streak", value: "+30 XP" },
                { icon: Star, label: "Aula concluída", value: "+20 XP" },
              ].map((item) => (
                <div key={item.label} className="glass rounded-xl p-3 flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-bold text-gradient-neon">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
