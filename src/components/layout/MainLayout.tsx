import { auth } from "@/auth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { redirect } from "next/navigation";
import { getBoards } from "@/actions/board";

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const boards = await getBoards();

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] dark:bg-slate-950 transition-colors">
      <Sidebar role={(session.user as any).role} initialBoards={boards} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={session.user.name || "User"} userRole={(session.user as any).role || "TAS"} />
        <main className="p-4 md:p-6 lg:p-8 flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
