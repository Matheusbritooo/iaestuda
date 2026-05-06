"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendAiMessage } from "@/app/actions";
import { Sparkles, Send, Loader2, User, Bot } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function AiChat({ starters }: { starters: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || isPending) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const history = [...messages, userMsg];
      const reply = await sendAiMessage(history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    });
  }

  return (
    <div className="flex-1 flex flex-col glass-card rounded-2xl border-white/5 overflow-hidden min-h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
            <div className="p-4 rounded-2xl gradient-neon glow-neon animate-float">
              <Bot className="h-8 w-8 text-black" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Olá! Sou o seu tutor de IA.</p>
              <p className="text-sm text-muted-foreground mt-1">Escolha uma sugestão ou faça sua pergunta:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm glass border-white/8 hover:border-primary/30 hover:bg-primary/5 rounded-xl p-3 transition-all text-foreground/80 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "user" ? "gradient-purple" : "gradient-neon"}`}>
                {msg.role === "user"
                  ? <User className="h-4 w-4 text-white" />
                  : <Bot className="h-4 w-4 text-black" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "gradient-purple text-white rounded-tr-sm"
                  : "glass border-white/8 text-foreground/90 rounded-tl-sm"
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
          ))
        )}

        {isPending && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-xl gradient-neon flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-black" />
            </div>
            <div className="glass border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa sobre concursos..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="gradient-neon glow-neon text-black p-2.5 rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2 flex items-center justify-center gap-1">
          <Sparkles className="h-2.5 w-2.5" /> Powered by Claude · Anthropic
        </p>
      </div>
    </div>
  );
}
