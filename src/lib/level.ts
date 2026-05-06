export type Level = {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
};

const LEVELS: Level[] = [
  { level: 1, title: "Iniciante", minXp: 0, maxXp: 300, color: "text-slate-500" },
  { level: 2, title: "Dedicado", minXp: 300, maxXp: 900, color: "text-blue-500" },
  { level: 3, title: "Focado", minXp: 900, maxXp: 2100, color: "text-indigo-500" },
  { level: 4, title: "Avançado", minXp: 2100, maxXp: 4500, color: "text-violet-500" },
  { level: 5, title: "Expert", minXp: 4500, maxXp: 9000, color: "text-purple-500" },
  { level: 6, title: "Mestre", minXp: 9000, maxXp: 18000, color: "text-pink-500" },
  { level: 7, title: "Lenda", minXp: 18000, maxXp: Infinity, color: "text-amber-500" },
];

export function getLevelInfo(totalMinutes: number) {
  const xp = totalMinutes;
  const current = LEVELS.findLast((l) => xp >= l.minXp) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const progress = next
    ? Math.min(100, ((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;

  return { ...current, xp, progress, nextLevel: next ?? null };
}
