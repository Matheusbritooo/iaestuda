"use client";

import { useState, useTransition } from "react";
import { createForumReply } from "@/app/actions";
import { Send, Loader2, Sparkles } from "lucide-react";

export default function ReplyForm({ postId, postTitle, postContent, subject }: {
  postId: string;
  postTitle: string;
  postContent: string;
  subject: string;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      await createForumReply(postId, content, postTitle, postContent, subject);
      setContent("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Sua resposta</span>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-secondary">
          <Sparkles className="h-3 w-3" />
          <span>A IA também responderá</span>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Compartilhe seu conhecimento com a comunidade..."
        maxLength={800}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
      />

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">{content.length}/800</p>
        <button
          type="submit"
          disabled={!content.trim() || isPending}
          className="gradient-neon text-black font-bold px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center gap-2 text-sm"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {isPending ? "Enviando..." : "Responder"}
        </button>
      </div>

      {submitted && (
        <p className="text-xs text-primary font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Resposta enviada! A IA está gerando uma explicação complementar.
        </p>
      )}
    </form>
  );
}
