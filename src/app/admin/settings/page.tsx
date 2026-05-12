"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Clock, Banknote, ShieldCheck, Info, Loader2 } from "lucide-react";
import { getFinancialSettings, updateFinancialSettings } from "@/actions/analytics";
import { toast } from "react-hot-toast";

export default function GlobalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    standardMonthlyHours: 176,
    revenueMode: "PACKAGE",
    revenuePerSroHour: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getFinancialSettings();
        setSettings({
          standardMonthlyHours: data.standardMonthlyHours,
          revenueMode: data.revenueMode,
          revenuePerSroHour: data.revenuePerSroHour
        });
      } catch (err) {
        toast.error("Không thể tải cấu hình hệ thống");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateFinancialSettings({
        standardMonthlyHours: settings.standardMonthlyHours,
        revenueMode: settings.revenueMode,
        revenuePerSroHour: settings.revenuePerSroHour
      });
      if (result.success) {
        toast.success("Đã cập nhật cấu hình hệ thống");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cấu hình hệ thống</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Thiết lập các tham số vận hành và tài chính toàn cục</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu cấu hình
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Giờ định mức */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Giờ công định mức</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Standard Hours</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <input 
                type="number"
                value={settings.standardMonthlyHours}
                onChange={(e) => setSettings({ ...settings, standardMonthlyHours: parseInt(e.target.value) || 0 })}
                className="w-full bg-transparent text-2xl font-black text-slate-900 dark:text-slate-100 outline-none"
              />
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Giờ / tháng (Mặc định: 176h)</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              * Con số này dùng để tính toán giá trị giờ làm việc của nhân sự dựa trên lương tháng.
            </p>
          </div>
        </div>

        {/* Chế độ doanh thu */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <Banknote className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Mô hình doanh thu</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Calculation Mode</p>
            </div>
          </div>

          <div className="space-y-4">
            <select
              value={settings.revenueMode}
              onChange={(e) => setSettings({ ...settings, revenueMode: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            >
              <option value="PACKAGE">Theo giá trị Gói (Subscription)</option>
              <option value="SRO_HOURS">Theo giờ SRO thực tế</option>
            </select>

            {settings.revenueMode === "SRO_HOURS" && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase block mb-1">Đơn giá mỗi giờ SRO (VNĐ)</label>
                <input 
                  type="number"
                  value={settings.revenuePerSroHour}
                  onChange={(e) => setSettings({ ...settings, revenuePerSroHour: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xl font-black text-indigo-700 dark:text-indigo-300 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/30 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-tight">Lưu ý quan trọng</p>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 leading-relaxed mt-1">
            Các thay đổi về giờ định mức và mô hình doanh thu sẽ ảnh hưởng trực tiếp đến toàn bộ các báo cáo tài chính, báo cáo hiệu năng và biểu đồ xu hướng ngay lập tức. Hãy đảm bảo bạn đã tham vấn bộ phận kế toán trước khi điều chỉnh.
          </p>
        </div>
      </div>
    </div>
  );
}
