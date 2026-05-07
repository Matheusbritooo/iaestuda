import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const ROLE = `Você é o Analista de Performance IA da plataforma IAEstuda.
Produza um relatório personalizado com:

1. **Diagnóstico** (2-3 linhas sobre situação atual)
2. **Ponto Crítico** (o que mais precisa de atenção agora e por quê)
3. **Forças** (o que está indo bem — cite dados específicos)
4. **Ação da Semana** (1 tarefa concreta e mensurável)

Seja específico, use dados reais do aluno, máximo 200 palavras.`;

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response("Chave de IA não configurada", { status: 500 });

    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return new Response("Não autenticado", { status: 401 });

    const dbUser = await prisma.user.findFirst({ where: { id: clerkId }, select: { id: true } });

    let systemPrompt: string;
    try {
      if (dbUser) {
        const ctx = await buildUserContext(dbUser.id);
        systemPrompt = contextToSystemPrompt(ctx, ROLE);
      } else {
        systemPrompt = `${ROLE}\nAluno em início de jornada.`;
      }
    } catch {
      systemPrompt = `${ROLE}\nDados sendo carregados.`;
    }

    const client = new Anthropic({ apiKey });
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
            if (event.type === "content_block_delta" && event.delta.type === "text_delta")
              controller.enqueue(encoder.encode(event.delta.text));
          }
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`Erro: ${err instanceof Error ? err.message : "desconhecido"}`));
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Erro", { status: 500 });
  }
}
