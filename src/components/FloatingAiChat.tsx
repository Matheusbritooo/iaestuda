"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Loader2, X, Bot, User, Minimize2 } from "lucide-react";
import { AGENTS } from "@/lib/agents";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_STARTERS = [
  "Como estou me saindo?",
  "O que devo estudar agora?",
  "Me dê uma dica rápida",
];

export default function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          agentId: "tutor",
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }

      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Erro ao conectar com a IA." };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming, open]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 glass-card rounded-2xl border border-primary/15 glow-neon flex flex-col overflow-hidden shadow-2xl" style={{ height: "440px" }}>
          <div className="gradient-neon px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-black" />
              <span className="font-bold text-black text-sm">IA Tutor</span>
              <span className="text-[9px] bg-black/15 text-black px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-black/60 hover:text-black">
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-3xl animate-float">🎓</div>
                <p className="text-xs text-foreground font-medium">Olá! Pergunte qualquer coisa sobre concursos.</p>
                <div className="space-y-1.5 w-full">
                  {QUICK_STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full text-left text-xs glass border-white/7 hover:border-primary/30 rounded-lg px-2.5 py-2 transition-all text-muted-foreground hover:text-foreground">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 text-xs ${msg.role === "user" ? "gradient-purple" : "gradient-neon"}`}>
                    {msg.role === "user" ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-black" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "gradient-purple text-white rounded-tr-sm" : "glass border-white/7 text-foreground/90 rounded-tl-sm"}`}>
                    {msg.content ? (
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    ) : (
                      <div className="flex items-center gap-1">
                        {[0, 150, 300].map((delay) => (
                          <div key={delay} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/5 p-3 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                disabled={isStreaming}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <button type="submit" disabled={!input.trim() || isStreaming}
                className="gradient-neon text-black p-2 rounded-lg disabled:opacity-40 hover:opacity-90">
                {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative h-13 w-13 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 gradient-neon glow-neon animate-pulse-neon`}
        style={{ height: "52px", width: "52px" }}
      >
        {open ? <X className="h-5 w-5 text-black" /> : <Sparkles className="h-5 w-5 text-black" />}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 h-5 w-5 gradient-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
