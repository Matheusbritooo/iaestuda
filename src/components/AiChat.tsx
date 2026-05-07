"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { sendChatMessage } from "@/app/actions";
import { Send, User, ChevronDown, Square } from "lucide-react";
import { AGENTS, type AgentId, type Agent } from "@/lib/agents";

type Message = { role: "user" | "assistant"; content: string; agentId?: AgentId };

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    let i = 0;
    const speed = Math.max(5, Math.min(20, Math.floor(10000 / text.length)));
    const timer = setInterval(() => {
      i += 4;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { setDisplayed(text); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  return <pre className="whitespace-pre-wrap font-sans">{displayed || "​"}</pre>;
}

export default function AiChat({ starters }: { starters?: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [showAgents, setShowAgents] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isPending) return;

    const userMsg: Message = { role: "user", content: text, agentId: selectedAgent.id };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLatestResponse(null);

    startTransition(async () => {
      const reply = await sendChatMessage(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        selectedAgent.id
      );
      const assistantMsg: Message = { role: "assistant", content: reply, agentId: selectedAgent.id };
      setMessages((prev) => [...prev, assistantMsg]);
      setLatestResponse(reply);
    });
  }, [messages, selectedAgent, isPending]);

  const agentDisplay = selectedAgent;

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
            <ChevronDown className={`h-4 w-4 text-muted-foreground ml-1 transition-transform ${showAgents ? "rotate-180" : ""}`} />
          </button>

          {showAgents && (
            <div className="absolute top-full left-0 mt-1 w-72 glass-card border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setShowAgents(false); setMessages([]); }}
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
          {isPending ? "Pensando..." : "Ativo"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isPending ? (
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
                  disabled={isPending}
                  className="text-left text-xs glass border-white/7 hover:border-primary/30 hover:bg-primary/5 rounded-xl p-3 transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const agent = AGENTS.find((a) => a.id === msg.agentId);
              const isLatestAssistant = msg.role === "assistant" && i === messages.length - 1 && latestResponse !== null;
              return (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === "user" ? "gradient-purple" : "bg-white/8"}`}>
                    {msg.role === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <span>{agent?.icon ?? "🤖"}</span>}
                  </div>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "gradient-purple text-white rounded-tr-sm" : "glass border-white/7 text-foreground/90 rounded-tl-sm"}`}>
                    {isLatestAssistant ? (
                      <TypewriterText text={msg.content} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    )}
                  </div>
                </div>
              );
            })}

            {isPending && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                  <span>{agentDisplay.icon}</span>
                </div>
                <div className="glass border-white/7 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">analisando seu perfil...</span>
                  </div>
                </div>
              </div>
            )}
          </>
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
            placeholder={isPending ? "Aguardando resposta..." : `Perguntar ao ${agentDisplay.name}...`}
            disabled={isPending}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="gradient-neon glow-neon text-black p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {isPending ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
          {AGENTS.length} agentes · Contexto completo · Claude AI · Powered by Server Actions
        </p>
      </div>
    </div>
  );
}
