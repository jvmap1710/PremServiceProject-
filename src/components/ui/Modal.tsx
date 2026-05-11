"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = "max-w-5xl"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title?: string; 
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] shadow-2xl w-full ${maxWidth} max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-300`}>
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
