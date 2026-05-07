import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const ROLE = `Você é o Planejador Inteligente da plataforma IAEstuda.
Crie um cronograma semanal otimizado baseado nos dados do aluno.

Formato exato:
📅 CRONOGRAMA — [Nome] | [Concurso] | [N] semanas

SEG │ [Matéria prioritária]  │ 2h │ [tópico específico]
TER │ [Matéria]              │ 2h │ [tópico específico]
QUA │ [Matéria prioritária]  │ 2h │ [tópico específico]
QUI │ [Matéria]              │ 2h │ [tópico específico]
SEX │ [Matéria]              │ 2h │ [tópico específico]
SAB │ Revisão + Simulado     │ 4h │ [matérias da semana]
DOM │ Descanso ativo         │  —  │ Leitura leve

⚡ PRIORIDADE DESTA SEMANA:
[matéria com menor taxa de acerto] — motivo: [por quê urgente]

🎯 META MENSURÁVEL:
[algo específico que pode ser medido ao final da semana]

💡 DICA ESTRATÉGICA:
[1 insight baseado nos dados do aluno]

Priorize matérias com menor taxa de acerto e maior peso no concurso.`;

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
        systemPrompt = `${ROLE}\nCrie um cronograma padrão para INSS.`;
      }
    } catch {
      systemPrompt = `${ROLE}`;
    }

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 700,
            system: systemPrompt,
            messages: [{ role: "user", content: "Crie meu cronograma semanal personalizado." }],
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
