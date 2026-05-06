import { auth } from "@clerk/nextjs/server";
import LandingPage from "@/components/LandingPage";
import DashboardPage from "@/components/DashboardPage";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) return <DashboardPage />;
  return <LandingPage />;
}
