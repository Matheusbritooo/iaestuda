import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import { getAgent, type AgentId } from "@/lib/agents";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        "IA não configurada. Chave ANTHROPIC_API_KEY ausente.",
        { status: 500 }
      );
    }

    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return new Response("Não autenticado. Faça login.", { status: 401 });
    }

    const dbUser = await prisma.user.findFirst({
      where: { id: clerkId },
      select: { id: true },
    });

    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      agentId?: AgentId;
    };

    const agent = getAgent(body.agentId ?? "tutor");

    let systemPrompt: string;
    try {
      if (dbUser) {
        const ctx = await buildUserContext(dbUser.id);
        systemPrompt = contextToSystemPrompt(ctx, agent.role);
      } else {
        systemPrompt = buildBasePrompt(agent.role);
      }
    } catch {
      systemPrompt = buildBasePrompt(agent.role);
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
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`Erro ao chamar a IA: ${err instanceof Error ? err.message : "desconhecido"}`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return new Response(
      `Erro: ${err instanceof Error ? err.message : "interno"}`,
      { status: 500 }
    );
  }
}

function buildBasePrompt(role: string): string {
  return `Você é o IAestuda AI — tutor especialista em concursos públicos brasileiros.
${role}

Especialidades: Português, Direito Constitucional, Direito Administrativo,
Raciocínio Lógico, Matemática, Informática, Atualidades.
Concursos: INSS, TRF, PF, Receita Federal, PRF, Caixa, BB.

Regras:
- Responda SEMPRE em português brasileiro
- Seja didático, específico e use exemplos práticos
- Estruture respostas com tópicos e bullet points
- Use mnemônicos quando ajudar a memorizar
- Cite a banca relevante (CESPE, FCC, VUNESP)
- Máximo 400 palavras`;
}
