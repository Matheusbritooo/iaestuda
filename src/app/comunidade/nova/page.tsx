import { getOrCreateDbUser } from "@/lib/user";
import AppLayout from "@/components/AppLayout";
import NewPostForm from "@/components/NewPostForm";
import { MessageSquare } from "lucide-react";

const SUBJECTS = ["Geral", "Português", "Direito Constitucional", "Direito Administrativo", "Raciocínio Lógico", "Matemática", "Informática", "Atualidades"];

export default async function NovaPostPage() {
  await getOrCreateDbUser();
  return (
    <AppLayout active="comunidade">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-secondary" /> Nova pergunta
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Tire sua dúvida com a comunidade ou receba uma resposta da IA</p>
        </div>
        <NewPostForm subjects={SUBJECTS} />
      </div>
    </AppLayout>
  );
}
