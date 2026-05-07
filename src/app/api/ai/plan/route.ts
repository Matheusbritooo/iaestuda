import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const PLANNER_ROLE = `Você é o Planejador Inteligente da plataforma IAEstuda.
Crie um cronograma semanal detalhado para o aluno.

Formato:
📅 CRONOGRAMA SEMANAL — [Nome]
Concurso: [nome] | [N] semanas para a prova

SEG | [Matéria] — [tópico específico] | [H]h
TER | [Matéria] — [tópico específico] | [H]h
QUA | [Matéria] — [tópico específico] | [H]h
QUI | [Matéria] — [tópico específico] | [H]h
SEX | [Matéria] — [tópico específico] | [H]h
SAB | Revisão + Simulado | 3h
DOM | Descanso ativo (leitura leve)

⚡ PRIORIDADE: [matéria mais urgente e motivo]
🎯 META: [meta específica da semana]

Priorize matérias com menor taxa de acerto.`;

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
      systemPrompt = contextToSystemPrompt(ctx, PLANNER_ROLE);
    } else {
      systemPrompt = `${PLANNER_ROLE}\nAluno: ${clerkUser.firstName ?? "Aluno"}`;
    }

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            system: systemPrompt,
            messages: [{ role: "user", content: "Crie meu cronograma semanal de estudos." }],
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
