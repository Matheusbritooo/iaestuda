import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildUserContext, contextToSystemPrompt } from "@/lib/ai-context";
import { getAgent, type AgentId } from "@/lib/agents";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findFirst({ where: { id: clerkId }, select: { id: true } });
  if (!user) return new Response("Not found", { status: 404 });

  const body = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    agentId?: AgentId;
  };

  const agent = getAgent(body.agentId ?? "tutor");
  const ctx = await buildUserContext(user.id);
  const systemPrompt = contextToSystemPrompt(ctx, agent.role);

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
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
