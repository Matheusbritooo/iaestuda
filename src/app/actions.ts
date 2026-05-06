"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import Anthropic from "@anthropic-ai/sdk";

async function getAuthenticatedUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Não autenticado");
  const user = await prisma.user.findFirst({ where: { id: clerkId }, select: { id: true } });
  if (!user) throw new Error("Usuário não encontrado");
  return user.id;
}

export async function reviewFlashcard(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) {
  const userId = await getAuthenticatedUserId();
  const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
  if (!card || card.userId !== userId) return;

  let { easeFactor, interval, repetitions } = card;
  if (quality < 3) { repetitions = 0; interval = 1; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    repetitions += 1;
  }
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  await prisma.flashcard.update({ where: { id: cardId }, data: { easeFactor, interval, repetitions, nextReview } });
  revalidatePath("/revisao");
}

export async function completeMaterial(materialId: string) {
  const userId = await getAuthenticatedUserId();
  await prisma.materialProgress.upsert({
    where: { userId_materialId: { userId, materialId } },
    update: { completedAt: new Date() },
    create: { userId, materialId, completedAt: new Date() },
  });
  revalidatePath("/materiais");
}

export async function addStudySession(subjectId: string, minutes: number) {
  const userId = await getAuthenticatedUserId();
  const today = startOfDay(new Date());
  await prisma.studySession.create({ data: { userId, subjectId, minutes, date: new Date() } });
  const sessions = await prisma.studySession.findMany({ where: { userId, date: { gte: today } } });
  const todayMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const existing = await prisma.dailyGoal.findUnique({ where: { userId_date: { userId, date: today } } });
  if (existing) {
    await prisma.dailyGoal.update({ where: { userId_date: { userId, date: today } }, data: { doneMinutes: todayMinutes, completed: todayMinutes >= existing.targetMinutes } });
  } else {
    await prisma.dailyGoal.create({ data: { userId, date: today, targetMinutes: 120, doneMinutes: todayMinutes, completed: todayMinutes >= 120 } });
  }
  revalidatePath("/metas");
  revalidatePath("/");
}

export async function answerQuestion(questionId: string, optionId: string, timeSpent: number, mode = "treino") {
  const userId = await getAuthenticatedUserId();
  const option = await prisma.questionOption.findUnique({ where: { id: optionId } });
  if (!option) return;
  await prisma.userAnswer.create({
    data: { userId, questionId, optionId, isCorrect: option.isCorrect, timeSpent, mode },
  });
  revalidatePath("/questoes");
  revalidatePath("/ranking");
  revalidatePath("/");
}

export async function completeLesson(lessonId: string, subjectId: string) {
  const userId = await getAuthenticatedUserId();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completedAt: new Date() },
    create: { userId, lessonId, completedAt: new Date() },
  });
  revalidatePath(`/aprender/${subjectId}/${lessonId}`);
  revalidatePath(`/aprender/${subjectId}`);
  revalidatePath("/aprender");
  revalidatePath("/");
}

export async function sendAiMessage(messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  await getAuthenticatedUserId();

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `Você é o IAestuda AI, um tutor especializado em concursos públicos brasileiros.
Você ajuda candidatos a estudar para concursos como INSS, TRT, Receita Federal, Polícia Federal, etc.
Suas especialidades: Português, Direito Constitucional, Direito Administrativo, Raciocínio Lógico, Informática.
Seja direto, didático e use exemplos práticos.
Quando explicar conteúdos, use estrutura clara com tópicos.
Responda sempre em português brasileiro.`,
    messages,
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "Não consegui gerar uma resposta.";
}
