import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CONTENT_LIBRARY, DEFAULT_EXAM } from "@/lib/content-library";

async function initializeNewUser(userId: string) {
  const plan = await prisma.studyPlan.create({
    data: {
      userId,
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

  for (const subjectData of CONTENT_LIBRARY) {
    const subject = plan.subjects.find((s) => s.name === subjectData.name);
    if (!subject) continue;

    // Flashcards
    if (subjectData.flashcards.length > 0) {
      await prisma.flashcard.createMany({
        data: subjectData.flashcards.map((fc) => ({
          userId,
          subjectId: subject.id,
          question: fc.question,
          answer: fc.answer,
          nextReview: new Date(),
        })),
      });
    }

    // Lessons
    for (let i = 0; i < subjectData.lessons.length; i++) {
      await prisma.lesson.create({
        data: { subjectId: subject.id, ...subjectData.lessons[i], order: i },
      });
    }

    // Questions
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

  // 7 days of sample activity
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sessionSubject = plan.subjects[0];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const mins = Math.floor(Math.random() * 60) + 30;
    await prisma.dailyGoal.create({
      data: { userId, date, targetMinutes: 120, doneMinutes: mins, completed: mins >= 120 },
    });
    await prisma.studySession.create({
      data: { userId, subjectId: sessionSubject.id, minutes: mins, date },
    });
  }
}

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/entrar");

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.name !== name) {
      await prisma.user.update({ where: { email }, data: { name } });
    }
    return existing;
  }

  // New user — create + initialize with full content
  const user = await prisma.user.create({
    data: { id: clerkUser.id, email, name },
  });

  // Initialize asynchronously (don't block the response)
  initializeNewUser(user.id).catch(console.error);

  return user;
}
