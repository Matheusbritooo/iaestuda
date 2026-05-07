import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const ANALYSIS_ROLE = `Você é o Analista de Performance IA da plataforma IAEstuda.
Analise os dados do aluno e produza um relatório com:

1. **Diagnóstico Geral** (2-3 linhas)
2. **Ponto Crítico**: o que mais precisa de atenção agora
3. **Pontos Fortes**: o que está indo bem
4. **Recomendação da Semana**: 1 ação concreta para os próximos 7 dias

Use dados reais, evite frases genéricas. Máximo 200 palavras.`;

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response("ANTHROPIC_API_KEY não configurada", { status: 500 });

    const clerkUser = await currentUser();
    if (!clerkUser) return new Response("Não autenticado", { status: 401 });

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: clerkUser.id }, ...(email ? [{ email }] : [])] },
      select: { id: true },
    });

    let systemPrompt: string;
    if (dbUser) {
      const ctx = await buildUserContext(dbUser.id);
      systemPrompt = contextToSystemPrompt(ctx, ANALYSIS_ROLE);
    } else {
      systemPrompt = `${ANALYSIS_ROLE}\nAluno: ${clerkUser.firstName ?? "Aluno"}. Dados ainda sendo carregados.`;
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
            messages: [{ role: "user", content: "Gere minha análise de desempenho agora." }],
          });
          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
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
