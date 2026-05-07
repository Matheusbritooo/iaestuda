import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import { getAgent, type AgentId } from "@/lib/agents";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        "IA não configurada. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente.",
        { status: 500 }
      );
    }

    // Get Clerk user (works in Route Handlers)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new Response("Faça login para usar a IA.", { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

    // Find user by ID or email (robustness for keyless mode)
    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: clerkUser.id }, ...(email ? [{ email }] : [])] },
      select: { id: true },
    });

    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      agentId?: AgentId;
    };

    const agent = getAgent(body.agentId ?? "tutor");

    // Build context — fallback to generic if DB user not found
    let systemPrompt: string;
    if (dbUser) {
      try {
        const ctx = await buildUserContext(dbUser.id);
        systemPrompt = contextToSystemPrompt(ctx, agent.role);
      } catch {
        systemPrompt = buildFallbackPrompt(agent.role, clerkUser.firstName ?? "Aluno");
      }
    } else {
      systemPrompt = buildFallbackPrompt(agent.role, clerkUser.firstName ?? "Aluno");
    }

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemPrompt,
            messages: body.messages,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro ao chamar Claude";
          controller.enqueue(encoder.encode(`Erro: ${msg}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return new Response(msg, { status: 500 });
  }
}

function buildFallbackPrompt(agentRole: string, name: string): string {
  return `Você é o IAestuda AI — tutor especialista em concursos públicos brasileiros.
${agentRole}

Aluno: ${name}
Especialidades: Português, Direito Constitucional, Direito Administrativo,
Raciocínio Lógico, Matemática, Informática, Atualidades.

Regras:
- Responda SEMPRE em português brasileiro
- Seja direto, didático e específico
- Use exemplos práticos de questões de concurso
- Estruture respostas com tópicos claros
- Máximo 400 palavras`;
}
