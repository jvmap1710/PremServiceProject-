import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Calendar, Clock, User, Phone, MapPin, Building2, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { PackageForm } from "./PackageForm";
import { ClientForm } from "../ClientForm";
import { syncPackageStatuses } from "@/actions/package";
import { PackagesList } from "./PackagesList";

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  // Sync package statuses for this client before fetching data
  await syncPackageStatuses(params.id);

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true, role: true } },
      packages: {
        orderBy: { validFrom: "desc" },
        include: {
          sroRules: true,
        },
      },
    },
  });

  const tasUsers = await prisma.user.findMany({
    where: { role: { in: ["TAS", "ADMIN"] } },
    select: { id: true, name: true, role: true }
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/clients"
          className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">Client</span>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{client.name}</span>
        </div>
      </div>

      {/* Client Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
        <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{client.name}</h1>
                <ClientForm tasUsers={tasUsers} initialData={client} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Code: {client.code}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className={`text-[10px] font-black uppercase tracking-widest ${client.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col pr-4">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Owner (TAS)</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {client.owner?.name || "Unassigned"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Contact Person (PIC)</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.picName || <span className="italic font-medium text-slate-400">Not updated</span>}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Contact Phone</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.picContact || <span className="italic font-medium text-slate-400">Not updated</span>}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Headquarters Address</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{client.address || <span className="italic font-medium text-slate-400">Not updated</span>}</p>
          </div>
        </div>
      </div>

      {/* Premium Section */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center justify-between px-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Premium Package Management
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configure service packages and work quotas</p>
          </div>
          <PackageForm clientId={client.id} />
        </div>

        <PackagesList packages={client.packages} clientId={client.id} />
      </div>
    </div>
  );
}


