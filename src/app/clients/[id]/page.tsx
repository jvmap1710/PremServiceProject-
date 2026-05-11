import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, Calendar, Clock, User, Phone, MapPin, Building2, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { PackageForm } from "./PackageForm";
import { RuleForm } from "./RuleForm";
import { DeleteRuleButton } from "./DeleteRuleButton";
import { ClientForm } from "../ClientForm";
import { syncPackageStatuses } from "@/actions/package";

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
          <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">Khách hàng</span>
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
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Mã: {client.code}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className={`text-[10px] font-black uppercase tracking-widest ${client.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {client.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
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
                {client.owner?.name || "Chưa gán"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Người liên hệ (PIC)</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.picName || <span className="italic font-medium text-slate-400">Chưa cập nhật</span>}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Số điện thoại liên hệ</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.picContact || <span className="italic font-medium text-slate-400">Chưa cập nhật</span>}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Địa chỉ trụ sở</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{client.address || <span className="italic font-medium text-slate-400">Chưa cập nhật</span>}</p>
          </div>
        </div>
      </div>

      {/* Premium Section */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center justify-between px-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Quản lý Gói Premium
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cấu hình các gói dịch vụ và định mức công việc</p>
          </div>
          <PackageForm clientId={client.id} />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
          {client.packages.length === 0 ? (
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-16 rounded-[40px] border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <Package className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Chưa có gói dịch vụ</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Hãy khởi tạo gói Premium đầu tiên để bắt đầu quản lý yêu cầu định mức.</p>
              </div>
              <PackageForm clientId={client.id} />
            </div>
          ) : (
            client.packages.map((pkg) => (
              <div key={pkg.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group/pkg hover:shadow-xl dark:hover:shadow-indigo-900/10 transition-all duration-500">
                <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                        {pkg.name}
                      </h3>
                      {pkg.isActive ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Hết hạn
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-w-0">
                        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Hiệu lực</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            {new Date(pkg.validFrom).toLocaleDateString("vi-VN")} - {new Date(pkg.validTo).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-w-0">
                        <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Tổng Quota</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            {pkg.monthlyQuota || 0}h / tháng
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-w-0">
                        <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <ShieldCheck className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Giá gói / năm</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pkg.monthlyPrice || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 opacity-0 group-hover/pkg:opacity-100 transition-opacity ml-4 shrink-0">
                    <PackageForm clientId={client.id} initialData={pkg} />
                  </div>
                </div>

                <div className="p-8 md:p-10 flex-1 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full shrink-0" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">Danh mục Standard Requests</h4>
                    </div>
                    <div className="shrink-0">
                      <RuleForm packageId={pkg.id} />
                    </div>
                  </div>

                  {pkg.sroRules.length === 0 ? (
                    <div className="p-10 rounded-[24px] border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa cấu hình danh mục nào.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {pkg.sroRules.map(rule => (
                        <li key={rule.id} className="p-6 rounded-[28px] bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative group/rule hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all duration-300 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-black text-slate-800 dark:text-slate-200 text-sm flex-1 min-w-0 leading-snug tracking-tight">{rule.taskName}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/rule:opacity-100 transition-all translate-x-2 group-hover/rule:translate-x-0 shrink-0">
                              <RuleForm packageId={pkg.id} initialData={rule} />
                              <DeleteRuleButton id={rule.id} packageId={pkg.id} />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2.5 items-center">
                            <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                              {rule.requestsPerMonth || 0} req / tháng
                            </span>
                            <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              Est: {rule.estimateHours || 0}h / req
                            </span>
                            <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm">
                              Total: {Math.round((rule.estimateHours || 0) * (rule.requestsPerMonth || 0))}h
                            </span>
                          </div>

                          {(rule.scope || rule.exclusions) && (
                            <div className="mt-2 space-y-2.5 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                              {rule.scope && (
                                <div className="flex gap-3">
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 shrink-0">Scope:</span>
                                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rule.scope}</span>
                                </div>
                              )}
                              {rule.exclusions && (
                                <div className="flex gap-3">
                                  <span className="text-[10px] font-black text-red-400 dark:text-red-500/80 uppercase tracking-widest mt-1 shrink-0">Excl:</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">{rule.exclusions}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


