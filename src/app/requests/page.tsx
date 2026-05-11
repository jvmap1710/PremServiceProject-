import { prisma } from "@/lib/prisma";
import { RequestList } from "./RequestList";
import { auth } from "@/auth";

export default async function RequestsPage() {
  const session = await auth();
  
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { raiseDate: "desc" },
    include: {
      client: true,
      package: true,
      assignee: true,
      creator: { select: { name: true } },
      workLogs: true,
      items: {
        include: {
          sroRule: true
        }
      }
    }
  });

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    include: {
      owner: { select: { id: true, name: true } },
      packages: {
        include: { sroRules: true }
      }
    }
  });

  // Lấy TOÀN BỘ danh sách user để đảm bảo không bị sót role nào
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] }
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' }
  });
  console.log("DEBUG - Fetched Users for Request Form:", users);

  return <RequestList requests={requests} clients={clients} currentUser={session?.user} users={users} />;
}
