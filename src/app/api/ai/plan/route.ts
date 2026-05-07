import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PLANNER_ROLE = `Você é o Planejador Inteligente da plataforma IAEstuda.
Com base nos dados do aluno, crie um cronograma de estudos semanal detalhado.

Formato obrigatório:
📅 CRONOGRAMA SEMANAL — [Nome do Aluno]
Concurso: [nome] | Semanas restantes: [N]

SEG | [Matéria] | [H]h | Foco: [tópico específico]
TER | [Matéria] | [H]h | Foco: [tópico específico]
QUA | [Matéria] | [H]h | Foco: [tópico específico]
QUI | [Matéria] | [H]h | Foco: [tópico específico]
SEX | [Matéria] | [H]h | Foco: [tópico específico]
SAB | Revisão geral | [H]h | [o que revisar]
DOM | Simulado / Descanso | —

⚡ PRIORIDADE DA SEMANA: [matéria mais urgente e por quê]
🎯 META: [meta específica e mensurável]

Adapte ao tempo disponível (2h/dia em dias de semana, 4h no sábado).
Priorize matérias com menor taxa de acerto e maior peso no concurso.`;

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findFirst({ where: { id: clerkId }, select: { id: true } });
  if (!user) return new Response("Not found", { status: 404 });

  const ctx = await buildUserContext(user.id);
  const systemPrompt = contextToSystemPrompt(ctx, PLANNER_ROLE);

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
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
