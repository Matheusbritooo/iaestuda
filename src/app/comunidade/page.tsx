import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight, Users, Pin, Sparkles, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SUBJECTS_OPTIONS = ["Geral", "Português", "Direito Constitucional", "Direito Administrativo", "Raciocínio Lógico", "Matemática", "Informática", "Atualidades"];

export default async function ComunidadePage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const user = await getOrCreateDbUser();
  const sp = await searchParams;

  const [posts, totalUsers, totalPosts] = await Promise.all([
    prisma.forumPost.findMany({
      where: sp.subject ? { subject: sp.subject } : {},
      include: {
        user: { select: { name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.user.count(),
    prisma.forumPost.count(),
  ]);

  return (
    <AppLayout active="comunidade">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-secondary" />
              <span className="text-gradient-full">Comunidade</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Aprenda com outros candidatos e tire suas dúvidas</p>
          </div>
          <Link href="/comunidade/nova">
            <div className="gradient-neon glow-neon text-black font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:opacity-90">
              <Plus className="h-4 w-4" /> Nova pergunta
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Membros", value: totalUsers.toLocaleString("pt-BR"), color: "text-secondary" },
            { icon: MessageSquare, label: "Discussões", value: totalPosts.toLocaleString("pt-BR"), color: "text-primary" },
            { icon: TrendingUp, label: "Hoje ativos", value: Math.floor(totalUsers * 0.12).toLocaleString("pt-BR"), color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="pt-3 pb-3 flex items-center gap-2.5">
                <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
                <div>
                  <p className={`font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Filters */}
          <aside className="w-44 shrink-0">
            <div className="glass-card rounded-xl p-3 border-white/5 space-y-1 sticky top-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Filtrar por matéria</p>
              {SUBJECTS_OPTIONS.map((sub) => (
                <Link key={sub} href={sub === "Geral" && !sp.subject ? "/comunidade" : `/comunidade?subject=${encodeURIComponent(sub)}`}>
                  <div className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${(sp.subject === sub || (!sp.subject && sub === "Geral")) ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-white/5"}`}>
                    {sub}
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          {/* Posts */}
          <div className="flex-1 space-y-3">
            {posts.length === 0 ? (
              <Card className="glass-card border-dashed border-white/8">
                <CardContent className="py-16 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma discussão ainda.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Seja o primeiro a perguntar!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Link key={post.id} href={`/comunidade/${post.id}`}>
                  <div className={`glass-card border-white/5 rounded-xl p-4 hover:border-white/10 hover:-translate-y-0.5 transition-all group cursor-pointer ${post.pinned ? "border-primary/20 bg-primary/3" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                          <Badge variant="outline" className="text-[10px] border-white/8 text-muted-foreground">{post.subject}</Badge>
                        </div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{post.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{post.content}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{post.user.name.split(" ")[0]}</span>
                          <span>·</span>
                          <span>{format(post.createdAt, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post._count.replies} {post._count.replies === 1 ? "resposta" : "respostas"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
