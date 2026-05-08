"use client";

import { useState, useTransition } from "react";
import { voteForumPost } from "@/app/actions";
import { ThumbsUp } from "lucide-react";

export default function VoteButton({ postId, initialVotes, hasVoted }: {
  postId: string;
  initialVotes: number;
  hasVoted: boolean;
}) {
  const [voted, setVoted] = useState(hasVoted);
  const [votes, setVotes] = useState(initialVotes);
  const [isPending, startTransition] = useTransition();

  function handleVote() {
    if (voted) return;
    startTransition(async () => {
      await voteForumPost(postId);
      setVoted(true);
      setVotes((v) => v + 1);
    });
  }

  return (
    <button
      onClick={handleVote}
      disabled={voted || isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        voted
          ? "bg-primary/15 text-primary border border-primary/25 cursor-default"
          : "glass border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30"
      }`}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      <span>{votes}</span>
    </button>
  );
}
