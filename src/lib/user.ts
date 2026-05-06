import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/entrar");

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { id: clerkUser.id, email, name },
  });

  return user;
}
