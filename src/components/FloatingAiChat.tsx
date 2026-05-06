"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendAiMessage } from "@/app/actions";
import { Sparkles, Send, Loader2, X, Bot, User, ChevronDown, Minimize2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim() || isPending) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const history = [...messages, userMsg];
      const reply = await sendAiMessage(history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (!open) setUnread((n) => n + 1);
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 h-[440px] glass-card rounded-2xl border border-primary/20 glow-neon flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="gradient-neon px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-black" />
              <span className="font-bold text-black text-sm">IA Tutor</span>
              <span className="text-[10px] bg-black/15 text-black px-1.5 py-0.5 rounded-full font-medium">Claude</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-black/60 hover:text-black transition-colors">
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-4">
                <div className="p-3 rounded-xl gradient-neon animate-float">
                  <Bot className="h-6 w-6 text-black" />
                </div>
                <p className="text-xs text-foreground font-medium">Olá! Como posso ajudar?</p>
                <div className="space-y-1.5 w-full">
                  {["Explique o Art. 5º CF", "O que é a contrapositiva?", "Dicas de Português"].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-xs glass border-white/8 hover:border-primary/30 rounded-lg px-2.5 py-2 transition-all text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "gradient-purple" : "gradient-neon"}`}>
                    {msg.role === "user" ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-black" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "gradient-purple text-white rounded-tr-sm" : "glass border-white/8 text-foreground/90 rounded-tl-sm"}`}>
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                </div>
              ))
            )}
            {isPending && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-lg gradient-neon flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-black" />
                </div>
                <div className="glass border-white/8 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/5 p-3 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <button type="submit" disabled={!input.trim() || isPending} className="gradient-neon text-black p-2 rounded-lg disabled:opacity-40 hover:opacity-90">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${open ? "gradient-neon rotate-0" : "gradient-neon glow-neon animate-pulse-neon"}`}
      >
        {open ? <ChevronDown className="h-6 w-6 text-black" /> : <Sparkles className="h-6 w-6 text-black" />}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 h-5 w-5 gradient-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
