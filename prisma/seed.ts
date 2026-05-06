import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });

const LESSONS: Record<string, { title: string; topic: string; type: string; duration: number; content: string }[]> = {
  Português: [
    {
      title: "Introdução à Morfologia", topic: "Morfologia", type: "video", duration: 12,
      content: `MORFOLOGIA — Estudo das classes de palavras

As 10 classes gramaticais:

1. SUBSTANTIVO — nomeia seres, objetos, sentimentos
   Comum: casa, livro | Próprio: Brasil, Pedro
   Concreto: mesa, carro | Abstrato: amor, paz

2. ADJETIVO — caracteriza o substantivo
   Primitivo: bonito | Derivado: engraçado
   Simples: verde | Composto: verde-escuro

3. ARTIGO — determina o substantivo
   Definidos: o, a, os, as
   Indefinidos: um, uma, uns, umas

4. NUMERAL — indica quantidade, ordem ou fração
   Cardinal: um, dois | Ordinal: primeiro, segundo

5. PRONOME — substitui ou acompanha o substantivo
   Pessoal: eu, tu, ele | Possessivo: meu, teu
   Demonstrativo: este, esse, aquele

6. VERBO — ação, estado ou fenômeno
   Regulares: amar, comer | Irregulares: ser, ir

7. ADVÉRBIO — modifica verbo, adjetivo ou outro advérbio
   INVARIÁVEL: não flexiona em gênero/número
   "menos", "alerta", "pseudo" → invariáveis

8. PREPOSIÇÃO — liga palavras (de, em, para, com, por)

9. CONJUNÇÃO — une orações
   Coord.: e, mas, ou | Subord.: porque, embora, se

10. INTERJEIÇÃO — expressa emoção (Ah! Ufa! Eba!)`,
    },
    {
      title: "Sujeito: tipos e concordância", topic: "Sintaxe", type: "reading", duration: 15,
      content: `SUJEITO — ser sobre o qual se faz uma declaração

TIPOS:
• Simples: "O candidato foi aprovado." (1 núcleo)
• Composto: "Pedro e Ana passaram." (2+ núcleos)
• Oculto/Elíptico: "Estudamos muito." (identificado pelo verbo → nós)
• Indeterminado: "Precisa-se de servidores." (não é possível identificar)
• Inexistente: verbos impessoais

VERBOS IMPESSOAIS (sem sujeito):
• Fenômenos da natureza: chover, nevar, gear
• Haver (= existir): "Houve problemas." (NUNCA "houveram")
• Fazer (tempo): "Faz dois anos." (NUNCA "fazem")

CONCORDÂNCIA VERBAL:
Sujeito simples → verbo concorda em pessoa e número
"O aluno estudou." / "Os alunos estudaram."

Sujeito composto pré-verbal → verbo no plural
"Pedro e Maria foram aprovados."

Sujeito composto pós-verbal → concorda com o 1º ou vai ao plural
"Passou o candidato e a examinadora." (singular com o 1º)
"Passaram o candidato e a examinadora." (plural também correto)

PEGADINHAS FREQUENTES:
"Existem soluções" → sujeito: "soluções" (existir é pessoal)
"Há muitas vagas" → sem sujeito (haver impessoal)
"Faz anos que estudamos" → sem sujeito (fazer impessoal)`,
    },
    {
      title: "Concordância Verbal — Casos especiais", topic: "Sintaxe", type: "video", duration: 18,
      content: `CONCORDÂNCIA VERBAL — CASOS ESPECIAIS

1. EXPRESSÕES PARTITIVAS (a maioria de, a maior parte de, a metade de)
→ Verbo pode ir ao singular (com o núcleo da expressão) OU ao plural (com o complemento)
"A maioria dos candidatos passou." ✓
"A maioria dos candidatos passaram." ✓

2. COLETIVO + COMPLEMENTO
→ Verbo no singular, concordando com o coletivo
"O grupo de alunos estudou muito."

3. SUJEITO: QUE / QUEM (pronomes relativos)
→ O verbo concorda com o antecedente
"Fui eu que resolvi." / "Fui eu quem resolveu."
→ Ambas as formas são aceitas

4. PORCENTAGEM
Com artigo antes do numeral → concorda com numeral
"Os 30% dos candidatos foram aprovados."
Sem artigo → pode concordar com o complemento
"30% da turma foi/foram aprovada(s)."

5. PRONOMES INDEFINIDOS (cada, nenhum, alguém, ninguém, tudo)
→ Verbo no singular
"Ninguém foi reprovado." / "Cada um fez sua parte."

6. EXPRESSÃO "UM DOS QUE"
→ Verbo no plural (concordância com "os que")
"Ela é uma das que mais estudaram."

DICA: O verbo NUNCA concorda com adjunto adnominal ou complemento nominal.
"Um bando de ladrões assaltou o banco." (não "assaltaram")`,
    },
    {
      title: "Exercícios de Concordância", topic: "Sintaxe", type: "exercise", duration: 20,
      content: `EXERCÍCIOS COMENTADOS — CONCORDÂNCIA

Q1. "_____ três dias que não chove."
A) Faz ✓ | B) Fazem | C) Faz-se | D) Fazem-se
→ FAZER indicando tempo decorrido é IMPESSOAL → singular

Q2. "Houve/Houveram muitos problemas na seleção."
A) Houve ✓ | B) Houveram
→ HAVER no sentido de EXISTIR é sempre impessoal → singular

Q3. "A maioria dos aprovados _____ cumpriu/cumpriram a meta."
A) Cumpriu ✓ | B) Cumpriram ✓
→ Com expressões partitivas, AMBAS as formas são corretas.

Q4. "_____ muita gente no local."
A) Havia ✓ | B) Haviam
→ Havia (há + ia) = haver impessoal → singular

Q5. "Os documentos, bem como o requerimento, _____ entregue(s)."
A) foi | B) foram ✓
→ Sujeito composto por MAIS DE UM elemento → plural

Q6. "Nenhum dos candidatos _____ ao local."
A) compareceu ✓ | B) compareceram
→ "Nenhum" é pronome indefinido → verbo no singular (com "nenhum")
→ Mas: com "nenhum dos + plural" há tendência ao singular`,
    },
  ],
  "Direito Constitucional": [
    {
      title: "Fundamentos da República — Art. 1º ao 4º", topic: "Princípios Fundamentais", type: "video", duration: 15,
      content: `TÍTULO I — DOS PRINCÍPIOS FUNDAMENTAIS

ART. 1º — FUNDAMENTOS (memorize: SOCIP ou SO-CI-DI-VA-PLU)
S — Soberania
O — Cidadania
C — Dignidade da pessoa humana
I — Valores sociais do trabalho e da livre iniciativa
D — Pluralismo político

Forma de governo: REPÚBLICA
Sistema de governo: PRESIDENCIALISMO
Forma de Estado: FEDERAÇÃO (união indissolúvel)
Regime: DEMOCRÁTICO DE DIREITO

Todo poder emana do povo (soberania popular — parágrafo único)

ART. 2º — SEPARAÇÃO DOS PODERES
Legislativo | Executivo | Judiciário
→ Independentes E harmônicos entre si

ART. 3º — OBJETIVOS FUNDAMENTAIS
I — Construir sociedade livre, justa e solidária
II — Garantir o desenvolvimento nacional
III — Erradicar a pobreza e reduzir desigualdades
IV — Promover o bem de todos SEM preconceitos

ART. 4º — RELAÇÕES INTERNACIONAIS
Independência nacional | Prevalência dos DH | Autodeterminação
Não-intervenção | Igualdade entre Estados | Defesa da paz
Solução pacífica de conflitos | Repúdio ao terrorismo e racismo
Cooperação | Concessão de asilo político

→ Brasil busca integração da América Latina (§ único)`,
    },
    {
      title: "Direitos Individuais — Art. 5º CF/88", topic: "Direitos Fundamentais", type: "reading", duration: 25,
      content: `ART. 5º — O MAIS COBRADO EM CONCURSOS

CAPUT: Todos são iguais perante a lei...
→ Aplica-se a: BRASILEIROS + ESTRANGEIROS RESIDENTES
→ 5 direitos básicos: Vida · Liberdade · Igualdade · Segurança · Propriedade

INCISOS ESSENCIAIS:

I — Igualdade entre homens e mulheres (direitos e obrigações)
II — Legalidade: ninguém obrigado a fazer/deixar de fazer sem lei
IV — Livre manifestação do pensamento (VEDADO anonimato)
VI — Liberdade de consciência e crença
IX — Livre expressão intelectual, artística, científica
X — Inviolabilidade: intimidade, vida privada, honra, imagem
XI — Inviolabilidade do lar
    Regra: INVIOLÁVEL
    Exceções: consentimento | flagrante delito | desastre | socorro
              + mandado judicial (SOMENTE DE DIA)
XII — Sigilo das comunicações (exceto por ordem judicial penal)
XXXVII — VEDADO tribunal de exceção
XXXVIII — Tribunal do júri:
    • Plenitude de defesa
    • Sigilo das votações
    • Soberania dos veredictos
    • Competência: crimes DOLOSOS contra a VIDA
XXXIX — Não há crime sem lei anterior que o defina (legalidade penal)
XL — Lei penal NÃO retroage, SALVO para beneficiar
XLII — Racismo: inafiançável + IMPRESCRITÍVEL
XLIII — Hediondos, tortura, tráfico, terrorismo: inafiançáveis, sem graça/anistia
LVII — Presunção de inocência (até trânsito em julgado)

§1º — Aplicação IMEDIATA dos direitos fundamentais
§3º — Tratados de DH com quórum de EC = status constitucional`,
    },
    {
      title: "Organização do Estado — Federalismo", topic: "Organização do Estado", type: "video", duration: 20,
      content: `ORGANIZAÇÃO DO ESTADO BRASILEIRO

ENTES FEDERATIVOS:
• União Federal
• Estados (26 + DF)
• Municípios
• Distrito Federal (não pode ser dividido em municípios)

ART. 21 — COMPETÊNCIA EXCLUSIVA DA UNIÃO (não delegável)
→ Política exterior, declarar guerra, moeda, energia nuclear,
   serviços postais, seguro desemprego, imigração

ART. 22 — COMPETÊNCIA LEGISLATIVA PRIVATIVA DA UNIÃO
→ Pode ser DELEGADA a Estados por Lei Complementar
→ Direito civil, penal, processual, trabalhista, eleitoral,
   trânsito, águas, telecomunicações, informática

ART. 23 — COMPETÊNCIA COMUM (todos os entes)
→ Zelar pela CF | Saúde | Meio ambiente | Cultura | Patrimônio

ART. 24 — COMPETÊNCIA CONCORRENTE (União + Estados + DF)
→ Municípios NÃO participam da competência concorrente
→ Direito tributário, financeiro, urbanístico, previdenciário,
   econômico, penitenciário | Produção e consumo | Educação

REGRA DO ART. 24:
• União → normas gerais
• Estado → normas suplementares
• Se a União for omissa: Estado pode legislar plenamente
• Se a União legislar posteriormente: lei estadual fica SUSPENSA
  (não é revogada, apenas suspensa) no que contrariar`,
    },
    {
      title: "Remédios Constitucionais", topic: "Garantias Fundamentais", type: "exercise", duration: 18,
      content: `REMÉDIOS CONSTITUCIONAIS — QUADRO COMPARATIVO

HABEAS CORPUS (HC)
Protege: liberdade de LOCOMOÇÃO
Contra: ameaça ou violência
Quem impetra: QUALQUER PESSOA (sem advogado)
Exemplo: preso sem flagrante nem mandado

MANDADO DE SEGURANÇA (MS)
Protege: direito LÍQUIDO E CERTO não amparado por HC/HD
Contra: ato ilegal/abusivo de AUTORIDADE PÚBLICA
Prazo: 120 dias do ato
Quem: pessoa física ou jurídica, com advogado
Atenção: direito deve ser certo (provado de plano)

HABEAS DATA (HD)
Protege: acesso/retificação de dados do PRÓPRIO IMPETRANTE
Onde: bancos de dados de entidades governamentais ou públicas
Quem: somente o TITULAR dos dados

MANDADO DE INJUNÇÃO (MI)
Quando: falta de norma regulamentadora torna inviável
         o exercício de direito constitucional
Efeito: STF pode dar efeito inter partes ou erga omnes

AÇÃO POPULAR (AP)
Quem: CIDADÃO (pessoa física no gozo dos direitos políticos)
Finalidade: anular ato lesivo ao patrimônio público,
            moralidade administrativa, meio ambiente, patrimônio cultural
Gratuita: autor ISENTO de custas, salvo má-fé

Q1. Quem pode impetrar HC?
R: QUALQUER PESSOA, sem necessidade de advogado.

Q2. Qual o prazo do MS?
R: 120 dias, contados da ciência do ato impugnado.

Q3. A AP pode ser proposta por pessoa jurídica?
R: NÃO. Somente cidadão (pessoa física com direitos políticos).`,
    },
  ],
  "Raciocínio Lógico": [
    {
      title: "Proposições e Conectivos Lógicos", topic: "Lógica Proposicional", type: "video", duration: 14,
      content: `LÓGICA PROPOSICIONAL

PROPOSIÇÃO: frase declarativa com valor V ou F
"O Brasil é sul-americano." → V (proposição)
"Feche a porta!" → Não é proposição (imperativo)
"x + 2 = 5" → Não é proposição (valor indefinido)

CONECTIVOS E TABELAS-VERDADE:

¬ NEGAÇÃO: inverte o valor — ¬V=F | ¬F=V

∧ CONJUNÇÃO "e": V somente quando AMBAS V
V∧V=V | V∧F=F | F∧V=F | F∧F=F

∨ DISJUNÇÃO "ou" (inclusivo): F somente quando AMBAS F
V∨V=V | V∨F=V | F∨V=V | F∨F=F

→ CONDICIONAL "se...então": F somente quando V→F
V→V=V | V→F=F ← ÚNICO FALSO
F→V=V | F→F=V

↔ BICONDICIONAL: V quando IGUAIS
V↔V=V | V↔F=F | F↔V=F | F↔F=V

EQUIVALÊNCIAS FUNDAMENTAIS:
~(p→q) ≡ p∧~q ← negação da condicional
p→q ≡ ~q→~p ← CONTRAPOSITIVA (sempre equivalente)
~(p∧q) ≡ ~p∨~q ← De Morgan
~(p∨q) ≡ ~p∧~q ← De Morgan
p→q ≡ ~p∨q`,
    },
    {
      title: "Quantificadores e Negação", topic: "Lógica de Predicados", type: "reading", duration: 12,
      content: `QUANTIFICADORES LÓGICOS

∀ UNIVERSAL "todo, qualquer, nenhum"
"Todo servidor é honesto." = ∀x: servidor(x) → honesto(x)
Negação: "Algum servidor NÃO é honesto." = ∃x: ~honesto(x)

∃ EXISTENCIAL "algum, existe, pelo menos um"
"Algum servidor é honesto." = ∃x: honesto(x)
Negação: "Nenhum servidor é honesto." = ∀x: ~honesto(x)

REGRA DA NEGAÇÃO:
~(Todo A é B) = Algum A não é B
~(Nenhum A é B) = Algum A é B
~(Algum A é B) = Nenhum A é B
~(Algum A não é B) = Todo A é B

NEGAÇÃO COM CONECTIVOS (De Morgan):
~(p∧q) = ~p∨~q
~(p∨q) = ~p∧~q

EXEMPLO PRÁTICO:
Enunciado: "Todos os aprovados estudaram e nenhum desistiu."
= (∀x: aprovado→estudou) ∧ (∀x: aprovado→~desistiu)

Negação: "Algum aprovado não estudou OU algum aprovado desistiu."
= (∃x: ~estudou) ∨ (∃x: desistiu)

CONJUNTOS — FÓRMULA DA UNIÃO:
|A∪B| = |A| + |B| - |A∩B|
Não pertencem a nenhum = Total - |A∪B|`,
    },
    {
      title: "Exercícios de Lógica", topic: "Lógica Proposicional", type: "exercise", duration: 25,
      content: `EXERCÍCIOS COMENTADOS

Q1. p=V, q=F. Calcule (p→q)∧(~p∨q):
p→q = V→F = F
~p∨q = F∨F = F
F∧F = FALSO ✓

Q2. Negação de "Se Pedro estudar, então passará":
~(p→q) ≡ p∧~q
→ "Pedro estudará E não passará" ✓

Q3. Qual equivale a p→q?
a) q→p (conversa) ✗
b) ~p→~q (inversa) ✗
c) ~q→~p (contrapositiva) ✓ ← SEMPRE equivalente
d) p∧~q (negação) ✗

Q4. 40 pessoas: 25 falam inglês, 18 espanhol, 10 os dois.
Quantas não falam nenhum?
|A∪B| = 25+18-10 = 33
Nenhum = 40-33 = 7 ✓

Q5. "Nenhum candidato é desonesto" é equivalente a:
a) "Algum candidato é desonesto" ✗
b) "Todos os candidatos são honestos" ✓
c) "Nenhum candidato é honesto" ✗
→ Nenhum A é B ≡ Todo A é não-B

Q6. A contrapositiva de "Se chover, o jogo será cancelado":
p: "Chover" | q: "Jogo cancelado"
Contrapositiva: ~q→~p
→ "Se o jogo não for cancelado, não choveu" ✓`,
    },
  ],
};

const QUESTIONS = {
  Português: [
    {
      topic: "Concordância Verbal",
      content: 'Assinale a alternativa em que a concordância verbal está CORRETA.',
      banca: "CESPE", difficulty: "medium", year: 2023,
      explanation: 'HAVER no sentido de existir é IMPESSOAL, ficando sempre no singular. "Houveram problemas" está errado; "Houve problemas" é o correto.',
      options: [
        { letter: "A", text: "Houve muitos candidatos no concurso.", isCorrect: true },
        { letter: "B", text: "Houveram muitos candidatos no concurso.", isCorrect: false },
        { letter: "C", text: "Haviam poucos candidatos inscritos.", isCorrect: false },
        { letter: "D", text: "Fizeram dois anos que não havia concurso.", isCorrect: false },
        { letter: "E", text: "Existia várias vagas disponíveis.", isCorrect: false },
      ],
    },
    {
      topic: "Sintaxe",
      content: 'Em relação ao sujeito, marque a alternativa com uso CORRETO:',
      banca: "FCC", difficulty: "easy", year: 2022,
      explanation: '"Chover" é verbo impessoal (fenômeno da natureza), logo a oração não tem sujeito. Orações sem sujeito: verbos de fenômenos da natureza, haver (existir), fazer (tempo), ser (tempo/distância).',
      options: [
        { letter: "A", text: "Em 'Choveu ontem', o sujeito é 'ontem'.", isCorrect: false },
        { letter: "B", text: "Em 'Choveu ontem', a oração não tem sujeito.", isCorrect: true },
        { letter: "C", text: "Em 'Choveu ontem', o sujeito é oculto.", isCorrect: false },
        { letter: "D", text: "Em 'Choveu ontem', o sujeito é indeterminado.", isCorrect: false },
        { letter: "E", text: "Em 'Choveu ontem', o sujeito é composto.", isCorrect: false },
      ],
    },
    {
      topic: "Ortografia e Pontuação",
      content: 'Assinale a alternativa com uso CORRETO da vírgula, conforme a norma culta:',
      banca: "CESPE", difficulty: "medium", year: 2024,
      explanation: 'Adjuntos adverbiais deslocados (postos no início da oração) devem ser separados por vírgula. Sujeito e predicado NÃO devem ser separados por vírgula.',
      options: [
        { letter: "A", text: "No próximo ano, o concurso será realizado.", isCorrect: true },
        { letter: "B", text: "O candidato, foi aprovado na primeira fase.", isCorrect: false },
        { letter: "C", text: "Pedro estudou muito, porém foi reprovado.", isCorrect: false },
        { letter: "D", text: "Embora cansado foi ao local de prova.", isCorrect: false },
        { letter: "E", text: "A banca realizou provas, de múltipla escolha.", isCorrect: false },
      ],
    },
    {
      topic: "Semântica",
      content: 'Analise o uso de "mesmo" na frase. Em qual alternativa está CORRETO segundo a norma culta?',
      banca: "VUNESP", difficulty: "hard", year: 2023,
      explanation: '"Mesmo" como pronome demonstrativo/enfático é correto. O uso coloquial de "mesmo" por "também" ou como mero intensificador não é aceito pela norma culta. Na alternativa correta, "mesmo" tem valor de pronome demonstrativo.',
      options: [
        { letter: "A", text: "Ele mesmo resolveu a questão, sem auxílio.", isCorrect: true },
        { letter: "B", text: "Fui ao banco, mesmo assim não resolvi.", isCorrect: false },
        { letter: "C", text: "Estava cansado, mesmo assim trabalhou.", isCorrect: false },
        { letter: "D", text: "Ela foi ao mercado, mesmo.", isCorrect: false },
        { letter: "E", text: "O problema é sério, mesmo.", isCorrect: false },
      ],
    },
  ],
  "Direito Constitucional": [
    {
      topic: "Princípios Fundamentais",
      content: "Segundo o art. 1º da CF/88, são fundamentos da República Federativa do Brasil:",
      banca: "CESPE", difficulty: "easy", year: 2023,
      explanation: 'Os fundamentos da República estão no art. 1º da CF/88: Soberania, Cidadania, Dignidade da pessoa humana, Valores sociais do trabalho e da livre iniciativa, e Pluralismo político (mnemônico: SOCIP).',
      options: [
        { letter: "A", text: "Soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político.", isCorrect: true },
        { letter: "B", text: "Soberania, cidadania, separação dos poderes, livre iniciativa e pluralismo político.", isCorrect: false },
        { letter: "C", text: "Democracia, cidadania, dignidade humana, trabalho e pluralismo político.", isCorrect: false },
        { letter: "D", text: "Soberania, igualdade, dignidade, trabalho e legalidade.", isCorrect: false },
        { letter: "E", text: "Federalismo, cidadania, dignidade, livre iniciativa e democracia.", isCorrect: false },
      ],
    },
    {
      topic: "Direitos Individuais",
      content: "De acordo com o art. 5º da CF/88, sobre a inviolabilidade do domicílio, marque a alternativa CORRETA:",
      banca: "FCC", difficulty: "medium", year: 2024,
      explanation: 'Art. 5º, XI: "a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial."',
      options: [
        { letter: "A", text: "A entrada por mandado judicial só pode ocorrer durante o dia.", isCorrect: true },
        { letter: "B", text: "A entrada com mandado judicial pode ocorrer a qualquer hora.", isCorrect: false },
        { letter: "C", text: "Em situação de flagrante delito, a entrada só é permitida durante o dia.", isCorrect: false },
        { letter: "D", text: "A inviolabilidade do lar é absoluta e não admite exceções.", isCorrect: false },
        { letter: "E", text: "A entrada para prestar socorro só é permitida com mandado judicial.", isCorrect: false },
      ],
    },
    {
      topic: "Garantias Fundamentais",
      content: "O habeas data é instrumento constitucional que assegura ao impetrante:",
      banca: "CESPE", difficulty: "medium", year: 2023,
      explanation: 'O habeas data (art. 5º, LXXII) garante o conhecimento de informações relativas à PESSOA DO PRÓPRIO IMPETRANTE, constantes em registros de entidades governamentais ou de caráter público, bem como a retificação de dados.',
      options: [
        { letter: "A", text: "O acesso a informações relativas à própria pessoa, constantes em bancos de dados governamentais ou de caráter público.", isCorrect: true },
        { letter: "B", text: "A proteção da liberdade de locomoção contra ato ilegal ou abusivo.", isCorrect: false },
        { letter: "C", text: "A proteção de direito líquido e certo não amparado por habeas corpus.", isCorrect: false },
        { letter: "D", text: "O acesso a informações sigilosas de terceiros em investigações criminais.", isCorrect: false },
        { letter: "E", text: "A proteção do direito de livre manifestação do pensamento.", isCorrect: false },
      ],
    },
    {
      topic: "Organização do Estado",
      content: "Sobre as competências legislativas no federalismo brasileiro, é CORRETO afirmar:",
      banca: "FCC", difficulty: "hard", year: 2024,
      explanation: 'No art. 24 (competência concorrente), a União legisla sobre normas gerais; os Estados podem suplementar. Se a União for omissa, o Estado pode legislar plenamente. Superveniência de lei federal suspende (não revoga) a lei estadual no que contrariar.',
      options: [
        { letter: "A", text: "Na competência concorrente, a superveniência de lei federal suspende a eficácia da lei estadual no que lhe for contrário.", isCorrect: true },
        { letter: "B", text: "Na competência concorrente, a lei federal revoga definitivamente a lei estadual conflitante.", isCorrect: false },
        { letter: "C", text: "Municípios participam da competência concorrente do art. 24.", isCorrect: false },
        { letter: "D", text: "A competência exclusiva da União pode ser delegada a Estados por lei ordinária.", isCorrect: false },
        { letter: "E", text: "Os Estados não podem legislar sobre matéria de competência privativa da União, mesmo que autorizados por LC.", isCorrect: false },
      ],
    },
  ],
  "Raciocínio Lógico": [
    {
      topic: "Lógica Proposicional",
      content: "Se p é verdadeiro e q é falso, qual é o valor lógico de (p → q) ∨ (¬p ∧ q)?",
      banca: "CESPE", difficulty: "hard", year: 2023,
      explanation: 'p→q: V→F=F. ¬p∧q: F∧F=F. F∨F=FALSO. A condicional só é falsa quando antecedente é V e consequente é F. A disjunção só é falsa quando ambas as parcelas são falsas.',
      options: [
        { letter: "A", text: "Verdadeiro", isCorrect: false },
        { letter: "B", text: "Falso", isCorrect: true },
        { letter: "C", text: "Indeterminado", isCorrect: false },
        { letter: "D", text: "Equivalente a p", isCorrect: false },
        { letter: "E", text: "Equivalente a q", isCorrect: false },
      ],
    },
    {
      topic: "Teoria dos Conjuntos",
      content: "Em uma turma de 50 alunos, 30 estudam Português, 25 estudam Matemática e 10 estudam ambas as matérias. Quantos alunos não estudam nenhuma das duas?",
      banca: "FCC", difficulty: "medium", year: 2022,
      explanation: '|P∪M| = |P| + |M| - |P∩M| = 30 + 25 - 10 = 45. Não estudam nenhuma = 50 - 45 = 5 alunos.',
      options: [
        { letter: "A", text: "3", isCorrect: false },
        { letter: "B", text: "5", isCorrect: true },
        { letter: "C", text: "7", isCorrect: false },
        { letter: "D", text: "10", isCorrect: false },
        { letter: "E", text: "15", isCorrect: false },
      ],
    },
    {
      topic: "Quantificadores",
      content: "A negação da proposição 'Todo servidor público é eficiente e honesto' é:",
      banca: "CESPE", difficulty: "hard", year: 2024,
      explanation: '~(∀x: p∧q) = ∃x: ~(p∧q) = ∃x: ~p∨~q (De Morgan). "Algum servidor público não é eficiente OU não é honesto."',
      options: [
        { letter: "A", text: "Nenhum servidor público é eficiente e honesto.", isCorrect: false },
        { letter: "B", text: "Algum servidor público não é eficiente ou não é honesto.", isCorrect: true },
        { letter: "C", text: "Todo servidor público é ineficiente ou desonesto.", isCorrect: false },
        { letter: "D", text: "Algum servidor público não é eficiente e não é honesto.", isCorrect: false },
        { letter: "E", text: "Nenhum servidor público é eficiente ou honesto.", isCorrect: false },
      ],
    },
  ],
};

const FLASHCARDS_DATA = {
  Português: [
    { q: "O que é sujeito oculto/elíptico?", a: "Sujeito não expresso, identificável pela desinência verbal. Ex: 'Estudamos.' = nós" },
    { q: "Qual a diferença entre 'mau' e 'mal'?", a: "'Mau' é adjetivo (antônimo de bom). 'Mal' é advérbio (antônimo de bem). Dica: se puder substituir por 'bom', use 'mau'." },
    { q: "'Haver' no sentido de existir é pessoal ou impessoal?", a: "IMPESSOAL — sempre singular. 'Houve problemas.' (nunca 'houveram')" },
    { q: "Quando usar vírgula com adjunto adverbial?", a: "Adjunto adverbial deslocado (no início da oração) = vírgula obrigatória. Ex: 'Em 2023, o edital foi publicado.'" },
  ],
  "Direito Constitucional": [
    { q: "Quais são os fundamentos da República? (Art. 1º CF)", a: "SOCIP: Soberania, Cidadania, Dignidade da pessoa humana, Valores sociais do trabalho, Pluralismo político." },
    { q: "Quando pode haver entrada forçada em domicílio com mandado judicial?", a: "SOMENTE DURANTE O DIA. Flagrante, desastre e socorro podem ocorrer a qualquer hora." },
    { q: "O racismo é inafiançável e prescritível ou imprescritível?", a: "IMPRESCRITÍVEL (art. 5º, XLII CF). Um dos poucos crimes imprescritíveis." },
    { q: "O que estabelece o §1º do art. 5º CF?", a: "As normas definidoras dos direitos e garantias fundamentais têm APLICAÇÃO IMEDIATA." },
  ],
  "Raciocínio Lógico": [
    { q: "Quando a condicional p→q é FALSA?", a: "Somente quando p é V e q é F. Nos outros três casos (V→V, F→V, F→F) é verdadeira." },
    { q: "O que é a contrapositiva de p→q?", a: "É ~q→~p. SEMPRE logicamente equivalente à condicional original." },
    { q: "Qual é a negação de 'Todo A é B'?", a: "'Algum A NÃO é B' — negação do quantificador universal." },
    { q: "Fórmula da união de dois conjuntos?", a: "|A∪B| = |A| + |B| - |A∩B|" },
  ],
};

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@iaestuda.com" },
    update: {},
    create: { name: "Matheus", email: "demo@iaestuda.com" },
  });

  const existingPlan = await prisma.studyPlan.findFirst({ where: { userId: user.id } });
  if (existingPlan) {
    console.log("Seed já executado. Delete dev.db para reiniciar.");
    return;
  }

  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      examName: "Concurso INSS 2026",
      examDate: new Date("2026-10-15"),
      subjects: {
        create: [
          { name: "Português", weeklyHours: 4, priority: 1 },
          { name: "Raciocínio Lógico", weeklyHours: 3, priority: 2 },
          { name: "Direito Constitucional", weeklyHours: 4, priority: 1 },
          { name: "Direito Administrativo", weeklyHours: 3, priority: 2 },
          { name: "Informática", weeklyHours: 2, priority: 3 },
        ],
      },
    },
    include: { subjects: true },
  });

  const subjectMap = Object.fromEntries(plan.subjects.map((s) => [s.name, s]));
  const pt = subjectMap["Português"];
  const rl = subjectMap["Raciocínio Lógico"];
  const dc = subjectMap["Direito Constitucional"];

  // Flashcards
  for (const [subjectName, cards] of Object.entries(FLASHCARDS_DATA)) {
    const subject = subjectMap[subjectName];
    if (!subject) continue;
    await prisma.flashcard.createMany({
      data: cards.map((c, i) => ({
        userId: user.id,
        subjectId: subject.id,
        question: c.q,
        answer: c.a,
        nextReview: new Date(Date.now() + i * 3600000),
      })),
    });
  }

  // Lessons
  for (const [subjectName, lessons] of Object.entries(LESSONS)) {
    const subject = subjectMap[subjectName];
    if (!subject) continue;
    for (let i = 0; i < lessons.length; i++) {
      await prisma.lesson.create({ data: { subjectId: subject.id, ...lessons[i], order: i } });
    }
  }

  // Questions
  for (const [subjectName, questions] of Object.entries(QUESTIONS)) {
    const subject = subjectMap[subjectName];
    if (!subject) continue;
    for (const q of questions) {
      await prisma.question.create({
        data: {
          subjectId: subject.id,
          topic: q.topic,
          content: q.content,
          explanation: q.explanation,
          banca: q.banca,
          difficulty: q.difficulty,
          year: q.year,
          options: { create: q.options },
        },
      });
    }
  }

  // Daily goals + sessions (30 days)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sessionSubjects = [pt, rl, dc];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isWeekend = [0, 6].includes(date.getDay());
    const doneMinutes = Math.floor(Math.random() * 80) + (isWeekend ? 30 : 65);
    await prisma.dailyGoal.create({ data: { userId: user.id, date, targetMinutes: 120, doneMinutes, completed: doneMinutes >= 120 } });

    const count = Math.random() > 0.2 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const s = sessionSubjects[Math.floor(Math.random() * sessionSubjects.length)];
      await prisma.studySession.create({ data: { userId: user.id, subjectId: s.id, minutes: Math.floor(Math.random() * 55) + 20, date } });
    }
  }

  console.log("✅ Seed completo:", {
    userId: user.id,
    planId: plan.id,
    subjects: plan.subjects.length,
    lessons: Object.values(LESSONS).flat().length,
    questions: Object.values(QUESTIONS).flat().length,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
