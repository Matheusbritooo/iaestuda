"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Send, Loader2, User, ChevronDown, StopCircle } from "lucide-react";
import { AGENTS, type AgentId, type Agent } from "@/lib/agents";

type Message = { role: "user" | "assistant"; content: string; agentId?: AgentId };

export default function AiChat({ starters }: { starters?: string[] }) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [showAgents, setShowAgents] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text, agentId: selectedAgent.id };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", agentId: selectedAgent.id }]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const token = await getToken();

      const response = await fetch("/api/ai", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          agentId: selectedAgent.id,
        }),
        signal: ac.signal,
      });

      if (!response.body) throw new Error("Sem resposta do servidor");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated, agentId: selectedAgent.id };
          return updated;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `⚠️ ${(err as Error).message || "Erro ao conectar. Tente novamente."}`,
            agentId: selectedAgent.id,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, selectedAgent, isStreaming, getToken]);

  const agentDisplay = AGENTS.find((a) => a.id === selectedAgent.id) ?? AGENTS[0];

  return (
    <div className="flex flex-col glass-card rounded-2xl border-white/5 overflow-hidden" style={{ minHeight: "520px" }}>
      {/* Agent selector */}
      <div className="shrink-0 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowAgents((s) => !s)}
            className="flex items-center gap-2.5 hover:bg-white/5 rounded-xl px-3 py-2 transition-colors"
          >
            <span className="text-xl">{agentDisplay.icon}</span>
            <div className="text-left">
              <p className="text-sm font-semibold">{agentDisplay.name}</p>
              <p className="text-[10px] text-muted-foreground">{agentDisplay.description}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ml-1 ${showAgents ? "rotate-180" : ""}`} />
          </button>

          {showAgents && (
            <div className="absolute top-full left-0 mt-1 w-72 glass-card border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setShowAgents(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${agent.id === selectedAgent.id ? "bg-primary/8 border-l-2 border-primary" : ""}`}
                >
                  <span className="text-lg">{agent.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${agentDisplay.color}`}>
          Ativo
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="text-4xl animate-float">{agentDisplay.icon}</div>
            <div>
              <p className="font-semibold">{agentDisplay.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-xs">{agentDisplay.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {(agentDisplay.starters ?? starters ?? []).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs glass border-white/7 hover:border-primary/30 hover:bg-primary/5 rounded-xl p-3 transition-all text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const agent = AGENTS.find((a) => a.id === msg.agentId);
            return (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === "user" ? "gradient-purple" : "bg-white/8"}`}>
                  {msg.role === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <span>{agent?.icon ?? "🤖"}</span>}
                </div>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "gradient-purple text-white rounded-tr-sm" : "glass border-white/7 text-foreground/90 rounded-tl-sm"}`}>
                  {msg.content ? (
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/5 p-3">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Perguntar ao ${agentDisplay.name}...`}
            disabled={isStreaming}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50 transition-colors"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => { abortRef.current?.abort(); setIsStreaming(false); }}
              className="bg-red-400/10 border border-red-400/20 text-red-400 p-2.5 rounded-xl hover:bg-red-400/20 transition-colors"
              title="Parar"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="gradient-neon glow-neon text-black p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
          {AGENTS.length} agentes especializados · Contexto completo do seu perfil · Claude AI
        </p>
      </div>
    </div>
  );
}
