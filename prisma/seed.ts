import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { CONTENT_LIBRARY, DEFAULT_EXAM } from "../src/lib/content-library";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@iaestuda.com" },
    update: {},
    create: { name: "Matheus", email: "demo@iaestuda.com" },
  });

  const existing = await prisma.studyPlan.findFirst({ where: { userId: user.id } });
  if (existing) {
    console.log("Seed já executado. Delete o banco para reiniciar.");
    return;
  }

  // Create plan with all subjects
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      examName: DEFAULT_EXAM.name,
      examDate: DEFAULT_EXAM.examDate,
      subjects: {
        create: CONTENT_LIBRARY.map((s) => ({
          name: s.name,
          weeklyHours: s.weeklyHours,
          priority: s.priority,
        })),
      },
    },
    include: { subjects: true },
  });

  // Populate all subjects with content
  for (const subjectData of CONTENT_LIBRARY) {
    const subject = plan.subjects.find((s) => s.name === subjectData.name);
    if (!subject) continue;

    if (subjectData.flashcards.length > 0) {
      await prisma.flashcard.createMany({
        data: subjectData.flashcards.map((fc) => ({
          userId: user.id,
          subjectId: subject.id,
          question: fc.question,
          answer: fc.answer,
          nextReview: new Date(),
        })),
      });
    }

    for (let i = 0; i < subjectData.lessons.length; i++) {
      await prisma.lesson.create({
        data: { subjectId: subject.id, ...subjectData.lessons[i], order: i },
      });
    }

    for (const q of subjectData.questions) {
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

  // 30 days of activity
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstSubject = plan.subjects[0];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isWeekend = [0, 6].includes(date.getDay());
    const done = Math.floor(Math.random() * 80) + (isWeekend ? 25 : 60);
    await prisma.dailyGoal.create({
      data: { userId: user.id, date, targetMinutes: 120, doneMinutes: done, completed: done >= 120 },
    });
    const count = Math.random() > 0.2 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const s = plan.subjects[Math.floor(Math.random() * 3)];
      await prisma.studySession.create({
        data: { userId: user.id, subjectId: s.id, minutes: Math.floor(Math.random() * 55) + 20, date },
      });
    }
  }

  const totalLessons = CONTENT_LIBRARY.reduce((a, s) => a + s.lessons.length, 0);
  const totalQuestions = CONTENT_LIBRARY.reduce((a, s) => a + s.questions.length, 0);
  const totalFlashcards = CONTENT_LIBRARY.reduce((a, s) => a + s.flashcards.length, 0);

  console.log("✅ Seed completo:", {
    userId: user.id,
    subjects: plan.subjects.length,
    lessons: totalLessons,
    questions: totalQuestions,
    flashcards: totalFlashcards,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
