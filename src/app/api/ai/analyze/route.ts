import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_ROLE = `Você é o Analista de Performance IA da plataforma IAEstuda.
Analise os dados do aluno e produza um relatório inteligente com:

1. **Diagnóstico Geral** (2-3 linhas): situação atual do aluno
2. **Ponto Crítico Principal**: o que mais precisa de atenção agora
3. **Suas Forças**: o que está indo bem (seja específico)
4. **Recomendação da Semana**: 1 ação concreta e específica para os próximos 7 dias

Seja direto, use dados reais do aluno, evite frases genéricas.
Formato: texto estruturado, sem headers longos, máximo 200 palavras.`;

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findFirst({ where: { id: clerkId }, select: { id: true } });
  if (!user) return new Response("Not found", { status: 404 });

  const ctx = await buildUserContext(user.id);
  const systemPrompt = contextToSystemPrompt(ctx, ANALYSIS_ROLE);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: systemPrompt,
          messages: [{ role: "user", content: "Gere minha análise de desempenho." }],
        });
        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
