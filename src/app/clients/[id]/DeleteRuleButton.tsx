"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSRORule } from "@/actions/package";

export function DeleteRuleButton({ id, packageId }: { id: string; packageId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa quy tắc này? Số giờ tương ứng sẽ được trừ khỏi tổng Quota.")) return;
    
    setPending(true);
    const result = await deleteSRORule(id, packageId);
    if (result?.error) {
      alert(result.error);
    }
    setPending(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Xóa quy tắc"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
