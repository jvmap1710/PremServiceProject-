"use client";

import { useState, useEffect } from "react";
import { Mail, Server, Shield, Send, Save, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getEmailSettings, updateEmailSettings, testEmailAction } from "@/actions/settings";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "Premium Service Notifier",
  });
  const [testEmail, setTestEmail] = useState("");
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const result = await getEmailSettings();
      if (result.success && result.settings) {
        setSettings({
          host: result.settings.host,
          port: result.settings.port,
          secure: result.settings.secure,
          user: result.settings.user,
          password: result.settings.password,
          fromEmail: result.settings.fromEmail,
          fromName: result.settings.fromName,
        });
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const result = await updateEmailSettings(settings);
    if (result.success) {
      setStatus({ type: 'success', message: "Email configuration saved successfully!" });
    } else {
      setStatus({ type: 'error', message: result.error || "Error saving configuration." });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail) {
      setStatus({ type: 'error', message: "Please enter an email to test." });
      return;
    }
    setTesting(true);
    setStatus(null);
    const result = await testEmailAction(testEmail);
    if (result.success) {
      setStatus({ type: 'success', message: "Test email sent successfully! Please check your inbox." });
    } else {
      setStatus({ type: 'error', message: result.error || "Failed to send test email." });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Email Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Configure SMTP for system notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">SMTP Configuration</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
                <input 
                  value={settings.host}
                  onChange={(e) => setSettings(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Port</label>
                <input 
                  type="number"
                  value={settings.port}
                  onChange={(e) => setSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-slate-400 dark:text-slate-600" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Use secure connection (SSL/TLS)</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Enable if server requires SSL (usually port 465)</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const newSecure = !settings.secure;
                  setSettings(prev => ({ 
                    ...prev, 
                    secure: newSecure,
                    port: newSecure ? 465 : 587
                  }));
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.secure ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white dark:bg-slate-100 rounded-full transition-all ${settings.secure ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account (Username)</label>
                <input 
                  value={settings.user}
                  onChange={(e) => setSettings(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password (App Password)</label>
                <input 
                  type="password"
                  value={settings.password}
                  onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Email</label>
                <input 
                  value={settings.fromEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                <input 
                  value={settings.fromName}
                  onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-200 dark:focus:border-blue-800 transition-colors"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-100 dark:shadow-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Test Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 h-fit">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Test Connection</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Send a test email to ensure SMTP parameters are correct.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Email</label>
                <input 
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-orange-200 dark:focus:border-orange-800 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>
              <button 
                onClick={handleTest}
                disabled={testing}
                className="w-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all flex items-center justify-center gap-2 border border-orange-100 dark:border-orange-900/30"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test Email
              </button>
            </div>
          </div>

          {status && (
            <div className={`p-6 rounded-[24px] border animate-in zoom-in-95 duration-300 flex gap-4 ${
              status.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tight">{status.type === 'success' ? 'Success' : 'Failed'}</p>
                <p className="text-xs font-medium leading-relaxed">{status.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
