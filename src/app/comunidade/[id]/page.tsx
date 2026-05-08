import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { notFound } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, MessageSquare, CheckCircle2, Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReplyForm from "@/components/ReplyForm";
import VoteButton from "@/components/VoteButton";

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateDbUser();

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      replies: {
        include: { user: { select: { name: true } } },
        orderBy: [{ isAccepted: "desc" }, { upvotes: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!post) notFound();

  const userVote = await prisma.forumVote.findFirst({ where: { userId: user.id, postId: id } });

  return (
    <AppLayout active="comunidade">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/comunidade" className="flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Comunidade
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
        </div>

        {/* Question */}
        <Card className="glass-card border-white/5">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">{post.subject}</Badge>
            </div>
            <h1 className="text-xl font-bold">{post.title}</h1>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">{post.user.name.split(" ")[0]}</span>
                <span>{format(post.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <VoteButton postId={post.id} initialVotes={post.upvotes} hasVoted={!!userVote} />
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {post.replies.length} {post.replies.length === 1 ? "resposta" : "respostas"}
          </h2>

          {post.replies.map((reply) => (
            <div key={reply.id} className={`glass-card rounded-xl p-4 space-y-3 border ${reply.isAccepted ? "border-primary/25 bg-primary/5" : reply.isAI ? "border-secondary/20 bg-secondary/5" : "border-white/5"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${reply.isAI ? "gradient-purple text-white" : "gradient-neon text-black"}`}>
                    {reply.isAI ? <Sparkles className="h-3.5 w-3.5" /> : reply.user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{reply.isAI ? "IA Tutor" : reply.user.name.split(" ")[0]}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{format(reply.createdAt, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reply.isAccepted && (
                    <Badge className="gradient-neon text-black border-0 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Melhor resposta
                    </Badge>
                  )}
                  {reply.isAI && (
                    <Badge className="gradient-purple text-white border-0 text-[10px]">IA</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{reply.upvotes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <ReplyForm postId={post.id} postTitle={post.title} postContent={post.content} subject={post.subject} />
      </div>
    </AppLayout>
  );
}
