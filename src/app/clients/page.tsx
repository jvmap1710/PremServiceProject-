import { prisma } from "@/lib/prisma";
import { ClientForm } from "./ClientForm";
import { Building2, Search } from "lucide-react";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true } }
    }
  });

  const tasUsers = await prisma.user.findMany({
    where: { role: { in: ["TAS", "ADMIN"] } },
    select: { id: true, name: true, role: true }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Client Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">List of partners using Premium services</p>
        </div>
        <ClientForm tasUsers={tasUsers} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-slate-100 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">Code</th>
                <th className="px-8 py-5">Client Name</th>
                <th className="px-8 py-5">Account Owner (TAS)</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                    No clients yet.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-xs border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                        {client.code}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <a href={`/clients/${client.id}`} className="flex items-center gap-4 group/link">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover/link:bg-indigo-600 dark:group-hover/link:bg-indigo-500 group-hover/link:text-white transition-all shadow-sm border border-indigo-100/50 dark:border-indigo-900/30">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                          {client.name}
                        </span>
                      </a>
                    </td>
                    <td className="px-8 py-6">
                      {client.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {client.owner.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{client.owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {client.isActive ? (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <ClientForm tasUsers={tasUsers} initialData={client} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

