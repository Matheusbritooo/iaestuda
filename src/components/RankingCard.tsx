import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown } from "lucide-react";

type Props = { totalMinutes: number; streak: number; userName: string };

function generateRanking(totalMinutes: number, streak: number, userName: string) {
  const userScore = totalMinutes + streak * 30;
  const fakeUsers = [
    { name: "Ana Carvalho", bonus: 4200 },
    { name: "Pedro Lima", bonus: 2800 },
    { name: "Julia Santos", bonus: 1500 },
    { name: "Carlos Mendes", bonus: 800 },
    { name: "Beatriz Costa", bonus: 200 },
  ];
  return [
    ...fakeUsers.map((u) => ({ name: u.name, score: u.bonus, isUser: false })),
    { name: userName, score: userScore, isUser: true },
  ].sort((a, b) => b.score - a.score).slice(0, 6);
}

const RANK_STYLES = [
  { icon: Crown, color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10" },
  { icon: Medal, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export default function RankingCard({ totalMinutes, streak, userName }: Props) {
  const ranking = generateRanking(totalMinutes, streak, userName);
  const userPosition = ranking.findIndex((p) => p.isUser) + 1;

  return (
    <Card className="glass-card border-white/5 glow-card">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold text-foreground/80">Ranking semanal</CardTitle>
        <Badge className="gradient-neon text-black border-0 text-xs font-bold">#{userPosition}º lugar</Badge>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {ranking.map((player, i) => {
          const rank = RANK_STYLES[i];
          return (
            <div
              key={player.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                player.isUser
                  ? "border border-primary/20 bg-primary/5"
                  : "hover:bg-white/3"
              }`}
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${rank ? rank.bg : "bg-white/5"}`}>
                {rank ? (
                  <rank.icon className={`h-3.5 w-3.5 ${rank.color}`} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${player.isUser ? "text-primary" : "text-foreground/90"}`}>
                  {player.name}
                  {player.isUser && <span className="text-xs text-muted-foreground font-normal ml-1">(você)</span>}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {player.score.toLocaleString("pt-BR")} pts
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
