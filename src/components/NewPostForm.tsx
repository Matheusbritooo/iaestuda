"use client";

import { useState, useTransition } from "react";
import { createForumPost } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export default function NewPostForm({ subjects }: { subjects: string[] }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("Geral");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    startTransition(async () => {
      const id = await createForumPost(title, content, subject);
      if (id) router.push(`/comunidade/${id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl border-white/5 p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Matéria relacionada</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
        >
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Título da pergunta</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Qual a diferença entre sujeito oculto e indeterminado?"
          maxLength={150}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
        <p className="text-[10px] text-muted-foreground text-right">{title.length}/150</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descreva sua dúvida</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Explique sua dúvida em detalhes. Quanto mais contexto, melhor a resposta da comunidade e da IA."
          maxLength={1000}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right">{content.length}/1000</p>
      </div>

      <button
        type="submit"
        disabled={!title.trim() || !content.trim() || isPending}
        className="w-full gradient-neon glow-neon text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isPending ? "Publicando..." : "Publicar pergunta"}
      </button>

      <p className="text-[10px] text-muted-foreground text-center">
        A IA responderá automaticamente com uma explicação especializada.
      </p>
    </form>
  );
}
