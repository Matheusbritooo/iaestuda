"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import Anthropic from "@anthropic-ai/sdk";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import { getAgent, type AgentId } from "@/lib/agents";

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

export async function answerQuestion(
  questionId: string,
  optionId: string,
  timeSpent: number,
  mode = "treino",
  confidence = "unknown"
) {
  const userId = await getAuthenticatedUserId();
  const option = await prisma.questionOption.findUnique({ where: { id: optionId } });
  if (!option) return;
  await prisma.userAnswer.create({
    data: { userId, questionId, optionId, isCorrect: option.isCorrect, timeSpent, mode, confidence },
  });
  revalidatePath("/questoes");
  revalidatePath("/ranking");
  revalidatePath("/");
}

export async function explainQuestionWithAI(
  questionContent: string,
  options: { letter: string; text: string; isCorrect: boolean }[],
  chosenLetter: string,
  subjectName: string,
  explanation: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "IA não configurada.";

  let userId: string | null = null;
  try { userId = await getAuthenticatedUserId(); } catch { /* público */ }

  let contextExtra = "";
  try {
    if (userId) {
      const ctx = await buildUserContext(userId);
      const subjectStat = ctx.performance.subjectStats.find(s => s.name === subjectName);
      contextExtra = subjectStat
        ? `\nO aluno tem ${subjectStat.hitRate}% de acerto em ${subjectName} (${subjectStat.answeredCount} questões respondidas).`
        : "";
    }
  } catch { /* ignora */ }

  const correctOption = options.find(o => o.isCorrect);
  const chosenOption = options.find(o => o.letter === chosenLetter);

  const prompt = `Questão de concurso — ${subjectName}:
"${questionContent}"

Resposta escolhida pelo aluno: ${chosenLetter}) ${chosenOption?.text ?? ""}
Resposta correta: ${correctOption?.letter}) ${correctOption?.text ?? ""}
Gabarito comentado: ${explanation}
${contextExtra}

Explique de forma didática e específica:
1. Por que a resposta escolhida (${chosenLetter}) está errada
2. Por que a resposta correta (${correctOption?.letter}) está certa
3. A regra/conceito fundamental que o aluno deve revisar
4. Uma dica prática para não errar esse tipo de questão novamente

Seja direto, use exemplos práticos e máximo 200 palavras.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `Você é um tutor especialista em concursos públicos brasileiros.
Sua tarefa é explicar erros de questões de forma didática e personalizada.
Responda sempre em português brasileiro, seja específico e use linguagem clara.`,
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.content[0];
    return content.type === "text" ? content.text : "Não consegui gerar explicação.";
  } catch (err) {
    return `Erro: ${err instanceof Error ? err.message : "desconhecido"}`;
  }
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

// ─── IA ACTIONS (Server Actions — auth garantida) ───

function buildBaseSystemPrompt(role: string): string {
  return `Você é o IAestuda AI — tutor especialista em concursos públicos brasileiros.
${role}

Concursos: INSS, TRF, PF, Receita Federal, PRF, Caixa, BB.
Matérias: Português, Direito Constitucional, Direito Administrativo,
Raciocínio Lógico, Matemática, Informática, Atualidades.

Regras obrigatórias:
- Responda SEMPRE em português brasileiro
- Seja didático, específico e use exemplos práticos de concurso
- Estruture com tópicos, bullets e formatação clara
- Cite a banca (CESPE, FCC, VUNESP) quando relevante
- Use mnemônicos para memorização
- Máximo 500 palavras por resposta`;
}

export async function sendChatMessage(
  messages: { role: "user" | "assistant"; content: string }[],
  agentId: string = "tutor"
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "⚠️ IA não configurada. Chave ANTHROPIC_API_KEY ausente.";

  let userId: string | null = null;
  try { userId = await getAuthenticatedUserId(); } catch { /* público */ }

  const agent = getAgent(agentId as AgentId);

  let systemPrompt: string;
  try {
    if (userId) {
      const ctx = await buildUserContext(userId);
      systemPrompt = contextToSystemPrompt(ctx, agent.role);
    } else {
      systemPrompt = buildBaseSystemPrompt(agent.role);
    }
  } catch {
    systemPrompt = buildBaseSystemPrompt(agent.role);
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
    const content = response.content[0];
    return content.type === "text" ? content.text : "Não consegui gerar uma resposta.";
  } catch (err) {
    return `⚠️ Erro ao chamar a IA: ${err instanceof Error ? err.message : "desconhecido"}`;
  }
}

export async function generateAiAnalysis(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "⚠️ IA não configurada.";

  let userId: string | null = null;
  try { userId = await getAuthenticatedUserId(); } catch { /* não autenticado */ }

  const ROLE = `Você é o Analista de Performance IA. Produza um relatório com:

1. **Diagnóstico** (2-3 linhas)
2. **Ponto Crítico** (o que precisa de atenção)
3. **Forças** (o que está indo bem)
4. **Ação da Semana** (1 tarefa concreta)

Máximo 200 palavras. Use dados reais do aluno.`;

  let systemPrompt = buildBaseSystemPrompt(ROLE);
  try {
    if (userId) {
      const ctx = await buildUserContext(userId);
      systemPrompt = contextToSystemPrompt(ctx, ROLE);
    }
  } catch { /* usa fallback */ }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: "Gere minha análise de desempenho." }],
    });
    const content = response.content[0];
    return content.type === "text" ? content.text : "";
  } catch (err) {
    return `⚠️ ${err instanceof Error ? err.message : "Erro"}`;
  }
}

export async function generateStudyPlan(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "⚠️ IA não configurada.";

  let userId: string | null = null;
  try { userId = await getAuthenticatedUserId(); } catch { /* não autenticado */ }

  const ROLE = `Você é o Planejador Inteligente. Crie um cronograma semanal detalhado.

Formato exato:
📅 CRONOGRAMA — [Nome] | [Concurso] | [N] semanas

SEG │ [Matéria]  │ 2h │ [tópico específico]
TER │ [Matéria]  │ 2h │ [tópico específico]
QUA │ [Matéria]  │ 2h │ [tópico específico]
QUI │ [Matéria]  │ 2h │ [tópico específico]
SEX │ [Matéria]  │ 2h │ [tópico específico]
SAB │ Revisão + Simulado │ 4h │ [matérias]
DOM │ Descanso ativo │ — │ Leitura leve

⚡ PRIORIDADE: [matéria mais urgente — motivo]
🎯 META: [algo mensurável para a semana]
💡 DICA: [insight baseado nos dados]

Priorize matérias com menor taxa de acerto.`;

  let systemPrompt = buildBaseSystemPrompt(ROLE);
  try {
    if (userId) {
      const ctx = await buildUserContext(userId);
      systemPrompt = contextToSystemPrompt(ctx, ROLE);
    }
  } catch { /* usa fallback */ }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: "user", content: "Crie meu cronograma semanal personalizado." }],
    });
    const content = response.content[0];
    return content.type === "text" ? content.text : "";
  } catch (err) {
    return `⚠️ ${err instanceof Error ? err.message : "Erro"}`;
  }
}

// Mantém compatibilidade com código antigo
export async function sendAiMessage(messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  return sendChatMessage(messages, "tutor");
}

// ─── COMMUNITY ACTIONS ───

export async function createForumPost(title: string, content: string, subject: string): Promise<string | null> {
  const userId = await getAuthenticatedUserId();

  const post = await prisma.forumPost.create({
    data: { userId, title: title.trim(), content: content.trim(), subject },
  });

  // AI auto-response
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const client = new Anthropic({ apiKey });
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: `Você é o IAestuda AI — tutor especialista em concursos públicos.
Responda a dúvida do fórum de forma didática e específica.
Matéria: ${subject}. Responda em português, máximo 300 palavras.
Estruture com: explicação, regra e exemplo prático.`,
      messages: [{ role: "user", content: `Título: ${title}\n\nDúvida: ${content}` }],
    }).then(async (response) => {
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      if (text) {
        await prisma.forumReply.create({
          data: {
            postId: post.id,
            userId,
            content: text,
            isAI: true,
            upvotes: 5,
          },
        });
      }
    }).catch(() => {});
  }

  revalidatePath("/comunidade");
  return post.id;
}

export async function createForumReply(
  postId: string,
  content: string,
  postTitle: string,
  postContent: string,
  subject: string
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  await prisma.forumReply.create({
    data: { postId, userId, content: content.trim() },
  });

  // AI complementary response (async)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const client = new Anthropic({ apiKey });
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Você é o IAestuda AI. Adicione uma perspectiva complementar à resposta do aluno sobre: ${subject}.
Seja breve, didático e específico. Máximo 150 palavras.`,
      messages: [{ role: "user", content: `Pergunta: ${postTitle}\n\nResposta do aluno: ${content}` }],
    }).then(async (response) => {
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      if (text) {
        await prisma.forumReply.create({
          data: { postId, userId, content: `**Complemento da IA:**\n\n${text}`, isAI: true, upvotes: 3 },
        });
      }
    }).catch(() => {});
  }

  revalidatePath(`/comunidade/${postId}`);
}

export async function voteForumPost(postId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const existing = await prisma.forumVote.findFirst({ where: { userId, postId } });
  if (existing) return;

  await prisma.$transaction([
    prisma.forumVote.create({ data: { userId, postId } }),
    prisma.forumPost.update({ where: { id: postId }, data: { upvotes: { increment: 1 } } }),
  ]);

  revalidatePath(`/comunidade/${postId}`);
}
