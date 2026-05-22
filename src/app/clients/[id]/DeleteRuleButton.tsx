"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSRORule } from "@/actions/package";

export function DeleteRuleButton({ id, packageId }: { id: string; packageId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this rule? The corresponding hours will be deducted from the total Quota.")) return;
    
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
      title="Delete rule"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
