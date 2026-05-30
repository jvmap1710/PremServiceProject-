import { prisma } from "@/lib/prisma";
import { RequestList } from "./RequestList";
import { auth } from "@/auth";

export const revalidate = 0;

export default async function RequestsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string, search?: string, status?: string, mine?: string }> 
}) {
  const session = await auth();
  const userId = session?.user?.id;
  
  const params = await searchParams;
  
  const page = parseInt(params.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = params.search || "";
  const status = params.status || "ALL";
  const mine = params.mine === "true";

  const where: any = {
    AND: [
      search ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ]
      } : {},
      status !== "ALL" ? { status } : {},
      mine && userId ? {
        OR: [
          { assigneeId: userId },
          { assigneeIds: { contains: userId } },
          { client: { ownerId: userId } }
        ]
      } : {}
    ]
  };

  const [requests, totalCount] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      skip,
      take: limit,
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
        },
        slaLines: {
          orderBy: { createdAt: 'asc' }
        }
      }
    }),
    prisma.serviceRequest.count({ where })
  ]);

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    include: {
      owner: { select: { id: true, name: true } },
      packages: {
        include: { sroRules: true }
      }
    }
  });

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] }
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' }
  });

  return (
    <RequestList 
      requests={requests} 
      clients={clients} 
      currentUser={session?.user} 
      users={users} 
      pagination={{
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }}
    />
  );
}
