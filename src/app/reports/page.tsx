import { prisma } from "@/lib/prisma";
import { ReportDashboard } from "./components/ReportDashboard";

import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await auth();
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });

  const allUsers = await prisma.user.findMany({
    where: {
      role: { in: ["TAS", "IMP_ENGINEER", "DEV", "MANAGER", "ADMIN"] }
    },
    select: { id: true, name: true, role: true }
  });

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      <ReportDashboard clients={clients} users={allUsers} userRole={session?.user?.role} />
    </main>
  );
}
