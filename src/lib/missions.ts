import { format, getISOWeek, getYear } from "date-fns";

export type MissionType = "daily" | "weekly";

export type Mission = {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  xp: number;
  icon: string;
  category: "study" | "questions" | "review" | "consistency";
};

export const DAILY_MISSIONS: Mission[] = [
  { id: "study_30", type: "daily", title: "30 min de estudo", description: "Estude pelo menos 30 minutos hoje", xp: 50, icon: "⏱", category: "study" },
  { id: "answer_5", type: "daily", title: "5 questões", description: "Responda 5 questões hoje", xp: 30, icon: "❓", category: "questions" },
  { id: "review_cards", type: "daily", title: "Revisar flashcards", description: "Revise pelo menos 3 flashcards pendentes", xp: 20, icon: "🃏", category: "review" },
  { id: "lesson_today", type: "daily", title: "Aula do dia", description: "Assista ou leia uma aula completa", xp: 40, icon: "📖", category: "study" },
  { id: "daily_challenge", type: "daily", title: "Desafio do dia", description: "Complete a questão do dia", xp: 25, icon: "⚡", category: "questions" },
];

export const WEEKLY_MISSIONS: Mission[] = [
  { id: "streak_5", type: "weekly", title: "Guerreiro da consistência", description: "Mantenha streak por 5 dias seguidos", xp: 200, icon: "🔥", category: "consistency" },
  { id: "correct_20", type: "weekly", title: "Sniper", description: "Acerte 20 questões nesta semana", xp: 150, icon: "🎯", category: "questions" },
  { id: "lessons_3", type: "weekly", title: "Estudante dedicado", description: "Complete 3 aulas diferentes", xp: 120, icon: "🏆", category: "study" },
  { id: "simulado", type: "weekly", title: "Simulado completo", description: "Complete um simulado cronometrado", xp: 180, icon: "📝", category: "questions" },
  { id: "study_300", type: "weekly", title: "Maratonista", description: "Estude 5 horas nesta semana (300 min)", xp: 250, icon: "🚀", category: "study" },
];

export function getDailyPeriod(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getWeeklyPeriod(): string {
  const now = new Date();
  return `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;
}

export type MissionStatus = Mission & {
  progress: number;
  target: number;
  completed: boolean;
  period: string;
};

export function computeMissionProgress(
  missionId: string,
  stats: {
    todayMinutes: number;
    todayAnswers: number;
    todayCorrect: number;
    todayFlashcards: number;
    todayLessons: number;
    todayChallengeAnswered: boolean;
    weekMinutes: number;
    weekAnswers: number;
    weekCorrect: number;
    weekLessons: number;
    weekSimulados: number;
    streak: number;
  }
): { progress: number; target: number } {
  switch (missionId) {
    case "study_30": return { progress: stats.todayMinutes, target: 30 };
    case "answer_5": return { progress: stats.todayAnswers, target: 5 };
    case "review_cards": return { progress: stats.todayFlashcards, target: 3 };
    case "lesson_today": return { progress: stats.todayLessons, target: 1 };
    case "daily_challenge": return { progress: stats.todayChallengeAnswered ? 1 : 0, target: 1 };
    case "streak_5": return { progress: Math.min(stats.streak, 5), target: 5 };
    case "correct_20": return { progress: stats.weekCorrect, target: 20 };
    case "lessons_3": return { progress: stats.weekLessons, target: 3 };
    case "simulado": return { progress: stats.weekSimulados, target: 1 };
    case "study_300": return { progress: stats.weekMinutes, target: 300 };
    default: return { progress: 0, target: 1 };
  }
}
