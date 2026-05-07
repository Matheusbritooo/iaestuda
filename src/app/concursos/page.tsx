import { getOrCreateDbUser } from "@/lib/user";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Users, Calendar, ChevronRight, Star, Zap } from "lucide-react";
import Link from "next/link";

const CONCURSOS = [
  {
    id: "inss", name: "INSS", orgao: "Instituto Nacional do Seguro Social",
    vagas: "7.932", nivel: "Médio/Superior", proximaProva: "2026",
    materias: ["Português", "Matemática", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática", "Previdência Social"],
    destaque: true, color: "border-primary/30 bg-primary/5",
  },
  {
    id: "pf", name: "Polícia Federal", orgao: "Departamento de Polícia Federal",
    vagas: "1.500+", nivel: "Superior", proximaProva: "2025/2026",
    materias: ["Português", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática", "Legislação Penal"],
    destaque: false, color: "border-secondary/20 bg-secondary/5",
  },
  {
    id: "trt", name: "TRT / TRF", orgao: "Tribunais Regionais do Trabalho/Federal",
    vagas: "500+", nivel: "Médio/Superior", proximaProva: "2025/2026",
    materias: ["Português", "Matemática", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática"],
    destaque: false, color: "border-blue-400/20 bg-blue-400/5",
  },
  {
    id: "receita", name: "Receita Federal", orgao: "Secretaria da Receita Federal",
    vagas: "699", nivel: "Superior", proximaProva: "2026",
    materias: ["Português", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Direito Tributário", "Contabilidade"],
    destaque: false, color: "border-amber-400/20 bg-amber-400/5",
  },
  {
    id: "prp", name: "PRF", orgao: "Polícia Rodoviária Federal",
    vagas: "2.000+", nivel: "Superior", proximaProva: "2025/2026",
    materias: ["Português", "Matemática", "Raciocínio Lógico", "Direito Constitucional", "Legislação de Trânsito", "Informática"],
    destaque: false, color: "border-orange-400/20 bg-orange-400/5",
  },
  {
    id: "caixa", name: "Caixa Econômica", orgao: "Caixa Econômica Federal",
    vagas: "3.000+", nivel: "Médio/Superior", proximaProva: "2025/2026",
    materias: ["Português", "Matemática", "Raciocínio Lógico", "Atualidades", "Informática", "Conhecimentos Bancários"],
    destaque: false, color: "border-violet-400/20 bg-violet-400/5",
  },
];

export default async function ConcursosPage() {
  await getOrCreateDbUser();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader active="concursos" />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-primary font-medium border-neon">
            <Target className="h-3.5 w-3.5" /> Escolha seu objetivo
          </div>
          <h1 className="text-3xl font-bold">Qual concurso você vai <span className="text-gradient-neon">vencer?</span></h1>
          <p className="text-muted-foreground">Selecione seu concurso e estude com conteúdo direcionado ao seu objetivo.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {CONCURSOS.map((c) => (
            <Card key={c.id} className={`glass-card border hover:scale-[1.01] transition-all cursor-pointer group ${c.color}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-lg">{c.name}</h2>
                      {c.destaque && <Badge className="gradient-neon text-black border-0 text-[10px] font-bold">Em alta</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.orgao}</p>
                  </div>
                  <Star className={`h-4 w-4 shrink-0 mt-0.5 ${c.destaque ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Users, label: "Vagas", value: c.vagas },
                    { icon: BookOpen, label: "Nível", value: c.nivel.split("/")[0] },
                    { icon: Calendar, label: "Previsão", value: c.proximaProva },
                  ].map((s) => (
                    <div key={s.label} className="glass rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {c.materias.slice(0, 4).map((m) => (
                    <Badge key={m} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{m}</Badge>
                  ))}
                  {c.materias.length > 4 && (
                    <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">+{c.materias.length - 4}</Badge>
                  )}
                </div>

                <Link href="/aprender">
                  <div className="flex items-center justify-between w-full gradient-neon text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity mt-1">
                    <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Estudar agora</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
