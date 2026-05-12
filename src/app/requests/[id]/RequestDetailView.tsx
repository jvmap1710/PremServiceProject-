"use client";

import { 
  Calendar as CalendarIcon, User, Package, Tag, ArrowLeft, Clock, CheckCircle2, 
  ListChecks, Plus, Trash2, CheckSquare, Square, MessageSquare, AlertTriangle, 
  Send, UserCheck, ShieldAlert, AlignLeft, ExternalLink,
  History, Timer, Paperclip, Upload, FileText, Image as ImageIcon, Edit2
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import { useState, useTransition, useMemo, useEffect } from "react";

import { useSession } from "next-auth/react";
import { createSubTask, updateSubTask, deleteSubTask } from "@/actions/subtask";
import { updateServiceRequest, updateRequestStatus } from "@/actions/request";
import { addComment, deleteComment } from "@/actions/comment";
import { getPackageUsage } from "@/actions/package";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { addWorkLog, deleteWorkLog, updateWorkLog, logTasTime } from "@/actions/worklog";
import { deleteAttachment } from "@/actions/attachment";
import { getAuditLogs } from "@/actions/audit";
import { toast } from "react-hot-toast";

export interface SubTask {
  id: string;
  content: string;
  description: string | null;
  isDone: boolean;
  status: string;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  userEmail: string | null;
  createdAt: Date | string;
}

export interface WorkLog {
  id: string;
  hours: number;
  description: string | null;
  subTaskId: string | null;
  serviceRequestItemId: string | null;
  userId: string | null;
  logDate: Date | string;
  groupId?: string | null;
  sroNames?: string;
  serviceRequestItem?: {
    sroRule?: {
      taskName: string;
    };
  } | null;
  user?: { name: string } | null;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  fileType: string | null;
  size: number | null;
  createdAt: Date | string;
  user?: { name: string } | null;
}

export interface Package {
  id: string;
  name: string;
  sroRules?: SRORule[];
}

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  userRequirement: string | null;
  description: string;
  status: string;
  type: string;
  priority: string;
  deadline: Date | string | null | undefined;
  clientId: string;
  packageId: string;
  assigneeId: string | null;
  createdById: string | null;
  raiseDate: Date | string;
  items: SROItem[];
  subTasks: SubTask[];
  client: Client;
  package: Package;
  assignee: User | null | undefined;
  creator: User | null | undefined;
  comments?: Comment[];
  workLogs?: WorkLog[];
  attachments?: Attachment[];
}

export interface Client {
  id: string;
  name: string;
  code: string;
  ownerId: string | null;
  packages?: Package[];
}

export interface User {
  id: string;
  name: string;
  role: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  user: { name: string; role: string } | null;
  createdAt: Date | string;
}

export interface SRORule {
  id: string;
  taskName: string;
  estimateHours: number;
}

export interface SROItem {
  id?: string;
  sroRuleId: string;
  quantity: number;
  sroRule?: SRORule;
}

export interface StatResults {
  totalUsed: number;
  limit: number;
  percent: number;
}

export function RequestDetailView({ 
  request, 
  clients,
  users = [],
  isModal = false,
  onSaved
}: { 
  request: ServiceRequest, 
  clients: Client[],
  users?: User[],
  isModal?: boolean,
  onSaved?: (updatedRequest: ServiceRequest) => void
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isReadOnly = (session?.user as any)?.role === "MANAGER";
  const [isPending, startTransition] = useTransition();
  
  // Inline edit states
  const [title, setTitle] = useState(request.title);
  const [userRequirement, setUserRequirement] = useState(request.userRequirement || "");
  const [description, setDescription] = useState(request.description || "");
  const [type, setType] = useState(request.type || "TASK");
  const [priority, setPriority] = useState(request.priority || "MEDIUM");
  const [deadline, setDeadline] = useState(request.deadline ? format(new Date(request.deadline), 'yyyy-MM-dd') : "");
  const [assigneeId, setAssigneeId] = useState(request.assigneeId || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
 
  // Subtask & Comment states
  const [newSubTask, setNewSubTask] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>(request.subTasks || []);
  const [comments, setComments] = useState<Comment[]>(request.comments || []);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null);
  const [editForm, setEditForm] = useState({ content: "", description: "" });
 
  // Log Time states
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(request.workLogs || []);
  const [logForm, setLogForm] = useState({ hours: "", description: "", subTaskId: "", serviceRequestItemId: "" });
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [tasLogForm, setTasLogForm] = useState({ hours: "", description: "" });
  const [isLoggingTas, setIsLoggingTas] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeInfoTab, setActiveInfoTab] = useState<"DISCUSSION" | "EVIDENCE" | "AUDIT">("DISCUSSION");
 
  // Sync state when props change (after router.refresh)
  useEffect(() => {
    setSubTasks(request.subTasks || []);
    setComments(request.comments || []);
    setWorkLogs(request.workLogs || []);
    setAttachments(request.attachments || []);
    setSroItems(request.items || []);
    
    // Fetch audit logs
    const fetchLogs = async () => {
      const logs = await getAuditLogs(request.id);
      setAuditLogs(logs as unknown as AuditLog[]);
    };
    fetchLogs();
  }, [request]);


  // Edit WorkLog state
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [logEditForm, setLogEditForm] = useState({ hours: "", description: "", subTaskId: "", serviceRequestItemId: "" });

  // Evidence / Attachment states
  const [attachments, setAttachments] = useState<Attachment[]>(request.attachments || []);
  const [isUploading, setIsUploading] = useState(false);

  // Quick SRO Edit states
  const [isEditingSRO, setIsEditingSRO] = useState(false);
  const [sroItems, setSroItems] = useState<SROItem[]>(request.items || []);

  const [usageStats, setUsageStats] = useState<StatResults | null>(null);


  const PRIORITY_LEVELS = [
    { value: "LOW", label: "Thấp", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700", icon: Clock },
    { value: "MEDIUM", label: "Trung bình", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900/30", icon: Tag },
    { value: "HIGH", label: "Cao", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-900/30", icon: AlertTriangle },
    { value: "URGENT", label: "Khẩn cấp", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900/30", icon: ShieldAlert },
  ];

  // Memoize available rules from clients list based on packageId
  const availableRules = useMemo<SRORule[]>(() => {
    if (!request.packageId) return [];
    for (const client of clients) {
      const pkg = client.packages?.find((p: Package) => p.id === request.packageId);
      if (pkg?.sroRules) return pkg.sroRules;
    }
    return request.package?.sroRules || [];
  }, [clients, request.packageId, request.package?.sroRules]);


  const handleFieldChange = (field: string, value: string) => {
    if (field === "title") setTitle(value);
    if (field === "userRequirement") setUserRequirement(value);
    if (field === "description") setDescription(value);
    if (field === "type") setType(value);
    if (field === "priority") setPriority(value);
    if (field === "deadline") setDeadline(value);
    if (field === "assigneeId") setAssigneeId(value);
    setHasChanges(true);
  };

  const handleSaveMainInfo = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("userRequirement", userRequirement);
    formData.append("description", description);
    formData.append("status", request.status);
    formData.append("type", type);
    formData.append("priority", priority);
    formData.append("deadline", deadline);
    formData.append("assigneeId", assigneeId);
    formData.append("clientId", request.clientId);
    formData.append("packageId", request.packageId);
    formData.append("sroItems", JSON.stringify(sroItems));
    
    startTransition(async () => {
      const result = await updateServiceRequest(request.id, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã lưu thay đổi");
        setHasChanges(false);
        const updatedSnapshot = {
          ...request,
          title,
          userRequirement,
          description,
          type,
          priority,
          deadline: deadline ? new Date(deadline) : undefined,
          assigneeId: assigneeId || null,
          items: request.package?.sroRules
            ? sroItems.map((si: SROItem) => ({
                ...si,
                sroRule: request.package?.sroRules?.find((r: SRORule) => r.id === si.sroRuleId)
              }))
            : request.items,
          assignee: assigneeId
            ? users.find((u: User) => u.id === assigneeId) || request.assignee
            : undefined,
        };
        onSaved?.(updatedSnapshot);
        router.refresh();
      }
      setIsSaving(false);
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === request.status) return;
    
    startTransition(async () => {
      const result = await updateRequestStatus(request.id, newStatus);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã cập nhật trạng thái");
        onSaved?.({ ...request, status: newStatus });
        router.refresh();
      }
    });
  };

  const syncSROsWithServer = async (newSroItems: SROItem[]) => {
    const formData = new FormData();
    formData.append("sroItems", JSON.stringify(newSroItems));
    const result = await updateServiceRequest(request.id, formData);
    if (result?.error) toast.error("Lỗi: " + result.error);
    else {
      toast.success("Đã cập nhật SRO");
      router.refresh();
    }
  };

  const addSroItem = (ruleId: string) => {
    const newList = [...sroItems, { sroRuleId: ruleId, quantity: 1 }];
    setSroItems(newList);
    syncSROsWithServer(newList);
  };

  const removeSroItem = (index: number) => {
    const newList = sroItems.filter((_: SROItem, i: number) => i !== index);
    setSroItems(newList);
    syncSROsWithServer(newList);
  };

  const updateSroQuantity = (index: number, delta: number) => {
    const newList = sroItems.map((item: SROItem, i: number) =>
      i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setSroItems(newList);
    syncSROsWithServer(newList);
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTask.trim()) return;
    setIsAddingSubTask(true);
    startTransition(async () => {
      const result = await createSubTask(request.id, newSubTask);
      if (result.success) {
        setSubTasks([...subTasks, result.subTask]);
        setNewSubTask("");
        toast.success("Đã thêm đầu việc");
        router.refresh();
      } else toast.error(result.error || "Lỗi không xác định");
      setIsAddingSubTask(false);
    });
  };

  const handleOpenEditSubTask = (st: SubTask) => {
    setEditingSubTask(st);
    setEditForm({ content: st.content, description: st.description || "" });
  };

  const handleSaveSubTaskEdit = async () => {
    if (!editingSubTask || !editForm.content.trim()) return;
    const result = await updateSubTask(editingSubTask.id, request.id, editForm);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã cập nhật đầu việc");
      setEditingSubTask(null);
      router.refresh();
    }
  };

  const handleToggleSubTask = async (subTask: SubTask) => {
    const newDone = !subTask.isDone;
    const result = await updateSubTask(subTask.id, request.id, { isDone: newDone, status: newDone ? "DONE" : "TODO" });
    if (result.error) toast.error(result.error);
    else {
      toast.success(newDone ? "Đã xong đầu việc" : "Đã mở lại đầu việc");
      router.refresh();
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    if (!confirm("Xóa đầu việc này?")) return;
    const result = await deleteSubTask(subTaskId, request.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Đã xóa đầu việc");
      router.refresh();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setIsSubmitting(true);
    const authorName = session?.user?.name || "Hệ thống";
    const result = await addComment(request.id, commentContent, authorName); 
    if (result.success) {
      setCommentContent("");
      toast.success("Đã thêm bình luận");
      router.refresh(); 
    } else toast.error(result.error || "Lỗi không xác định");
    setIsSubmitting(false);
  };

  const handleAddWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(logForm.hours);
    if (isNaN(hours) || hours <= 0) return;

    // Strict validation: Require SRO mapping
    if (!request.items || request.items.length === 0) {
      toast.error("Ticket này chưa khai báo hạng mục SRO");
      return;
    }

    if (!logForm.serviceRequestItemId) {
      toast.error("Vui lòng chọn hạng mục SRO");
      return;
    }

    setIsLoggingTime(true);
    const result = await addWorkLog(request.id, hours, logForm.description, logForm.subTaskId, logForm.serviceRequestItemId);
    if (result.success) {
      setLogForm({ hours: "", description: "", subTaskId: "", serviceRequestItemId: "" });
      toast.success("Đã ghi nhận thời gian làm việc");
      router.refresh();
    } else toast.error(result.error || "Lỗi không xác định");
    setIsLoggingTime(false);
  };
  
  const handleTasLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(tasLogForm.hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Số giờ không hợp lệ");
      return;
    }
    
    setIsLoggingTas(true);
    try {
      console.log("DEBUG - Calling logTasTime action...");
      const result = await logTasTime(request.id, hours, tasLogForm.description);
      if (result.success) {
        setTasLogForm({ hours: "", description: "" });
        toast.success(`Đã tự động chia đều ${hours}h cho ${result.count} hạng mục SRO`);
        router.refresh();
      } else {
        toast.error(result.error || "Lỗi khi log time TAS");
      }
    } catch (error: any) {
      console.error("DEBUG - Client-side error in handleTasLogTime:", error);
      toast.error("Lỗi hệ thống: " + (error.message || "Không thể kết nối đến máy chủ"));
    } finally {
      setIsLoggingTas(false);
    }
  };

  const handleDeleteWorkLog = async (logId: string) => {
    try {
      setIsLoggingTime(true);
      const result = await deleteWorkLog(logId, request.id);
      
      if (result.success) {
        setWorkLogs((prev: WorkLog[]) => prev.filter((l: WorkLog) => l.id !== logId));
        toast.success("Đã xóa log time");
        router.refresh();
      } else {
        toast.error("Lỗi: " + (result.error || "Không thể xóa"));
      }
    } catch (err: any) {
      toast.error("Lỗi hệ thống: " + err.message);
    } finally {
      setIsLoggingTime(false);
    }
  };

  const handleEditWorkLog = (log: WorkLog) => {
    setEditingWorkLog(log);
    setLogEditForm({ hours: log.hours.toString(), description: log.description || "", subTaskId: log.subTaskId || "", serviceRequestItemId: log.serviceRequestItemId || "" });
  };

  const handleSaveWorkLogEdit = async () => {
    if (!editingWorkLog) return;
    const result = await updateWorkLog(editingWorkLog.id, request.id, parseFloat(logEditForm.hours), logEditForm.description, logEditForm.subTaskId, logEditForm.serviceRequestItemId);
    if (result.success) {
      setEditingWorkLog(null);
      toast.success("Đã cập nhật log time");
      router.refresh();
    } else toast.error(result.error || "Lỗi không xác định");
  };

  const handleQuickLog = (itemId: string, taskName?: string) => {
    setLogForm(prev => ({ ...prev, serviceRequestItemId: itemId, subTaskId: "", description: taskName ? `Thực hiện ${taskName}` : prev.description }));
    document.getElementById("log-time-section")?.scrollIntoView({ behavior: 'smooth' });
    (document.getElementById("log-hours-input") as HTMLInputElement)?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requestId", request.id);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        // Manually update local state for instant feedback
        setAttachments(prev => [data.attachment, ...prev]);
        toast.success("Đã tải tệp lên");
        router.refresh();
      } else {
        toast.error("Lỗi upload: " + (data.error || "Không rõ nguyên nhân"));
      }
    } catch (error: any) { 
      console.error("Upload error:", error);
      toast.error("Lỗi khi tải file: " + error.message); 
    }
    finally { 
      setIsUploading(false); 
      // Reset input to allow re-uploading same file if needed
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm("Xóa bằng chứng này? Hành động này sẽ được ghi vào lịch sử xử lý.")) return;
    setIsUploading(true);
    const result = await deleteAttachment(id, request.id);
    if (result.success) {
      setAttachments(prev => prev.filter(a => a.id !== id));
      toast.success("Đã xóa bằng chứng");
      // Refresh audit logs
      const logs = await getAuditLogs(request.id);
      setAuditLogs(logs);
      router.refresh();
    } else toast.error(result.error);
    setIsUploading(false);
  };

  const sroActualHours = useMemo(() => {
    const map: Record<string, number> = {};
    workLogs.forEach((log: WorkLog) => {
      if (log.serviceRequestItemId) {
        map[log.serviceRequestItemId] = (map[log.serviceRequestItemId] || 0) + log.hours;
      }
    });
    return map;
  }, [workLogs]);

  const totalLoggedHours = useMemo(() => workLogs.reduce((sum: number, log: WorkLog) => sum + log.hours, 0), [workLogs]);

  // Group workLogs by groupId for UI display
  const displayedLogs = useMemo(() => {
    const grouped: WorkLog[] = [];
    const seenGroups = new Set<string>();

    workLogs.forEach(log => {
      if (log.groupId) {
        if (!seenGroups.has(log.groupId)) {
          // Find all logs in this group and sum their hours
          const groupLogs = workLogs.filter(l => l.groupId === log.groupId);
          const totalHours = groupLogs.reduce((sum, l) => sum + l.hours, 0);
          
          // Collect unique SRO names
          const uniqueSroNames = Array.from(new Set(
            groupLogs
              .map(l => l.serviceRequestItem?.sroRule?.taskName)
              .filter(Boolean)
          )).join(", ");

          grouped.push({
            ...log,
            hours: totalHours,
            sroNames: uniqueSroNames
          });
          seenGroups.add(log.groupId);
        }
      } else {
        grouped.push(log);
      }
    });
    return grouped.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
  }, [workLogs]);

  const isOverdue = deadline && new Date(deadline) < new Date() && request.status !== "DONE";

  return (
    <div className={`${isModal ? 'max-w-full' : 'max-w-7xl mx-auto'} animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12`}>
      {/* 1. TOP NAVIGATION & GLOBAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {!isModal && (
            <Link href="/requests" className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest uppercase">{request.code}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yêu cầu dịch vụ</span>
             </div>
             <div className="flex items-center gap-2">
                <select disabled={isReadOnly} value={request.status} onChange={(e) => handleStatusUpdate(e.target.value)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${request.status === "TODO" ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" : request.status === "IN_PROGRESS" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"}`}>
                   <option value="TODO">Cần làm</option>
                   <option value="IN_PROGRESS">Đang xử lý</option>
                   <option value="DONE">Hoàn thành</option>
                </select>
                <select disabled={isReadOnly} value={type} onChange={(e) => handleFieldChange("type", e.target.value)} className={`bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border border-slate-100 dark:border-slate-700 transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                   <option value="TASK">Công việc</option>
                   <option value="BUG">Lỗi/Bug</option>
                   <option value="FEATURE">Tính năng</option>
                   <option value="URGENT">Khẩn cấp</option>
                </select>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <User className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tạo bởi: {request.creator?.name || 'Hệ thống'}</span>
                </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && !isReadOnly ? (
            <button onClick={handleSaveMainInfo} disabled={isSaving} className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95">
              {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              {isReadOnly ? "Chế độ chỉ xem" : "Đã lưu tự động"}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          {/* A. TITLE & DESCRIPTION */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
            <input readOnly={isReadOnly} value={title} onChange={(e) => handleFieldChange("title", e.target.value)} className={`w-full text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-100 dark:placeholder:text-slate-800 ${isReadOnly ? 'cursor-default' : ''}`} placeholder="Nhập tiêu đề yêu cầu..." />
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nội dung yêu cầu</label></div>
                <textarea readOnly={isReadOnly} value={userRequirement} onChange={(e) => handleFieldChange("userRequirement", e.target.value)} className={`w-full bg-slate-50/50 dark:bg-slate-950/50 p-6 rounded-3xl text-sm font-medium border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[120px] leading-relaxed ${isReadOnly ? 'cursor-default' : ''}`} placeholder="Khách hàng yêu cầu những gì..." />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phân tích & Giải pháp</label></div>
                <textarea readOnly={isReadOnly} value={description} onChange={(e) => handleFieldChange("description", e.target.value)} className={`w-full bg-slate-50/50 dark:bg-slate-950/50 p-6 rounded-3xl text-sm font-medium border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all min-h-[150px] leading-relaxed ${isReadOnly ? 'cursor-default' : ''}`} placeholder="Chi tiết các bước xử lý kỹ thuật..." />
              </div>
            </div>
          </div>

          {/* B. OPERATIONAL TABS (SRO & SUBTASKS) */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
               <button className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b-2 border-indigo-600 flex items-center gap-3"><ListChecks className="w-4 h-4" />To-do List</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Định mức SRO (Budget)</span></div>
                   {!isReadOnly && (
                     <button onClick={() => setIsEditingSRO(!isEditingSRO)} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">{isEditingSRO ? "Xong" : "Quản lý SRO"}</button>
                   )}
                </div>
                {isEditingSRO && (
                  <select className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl text-xs font-bold outline-none mb-4" onChange={(e) => { if (e.target.value) { addSroItem(e.target.value); e.target.value = ""; } }}>
                    <option value="">+ Thêm loại SRO...</option>
                    {availableRules.map((rule: SRORule) => <option key={rule.id} value={rule.id}>{rule.taskName} ({rule.estimateHours}h)</option>)}
                  </select>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sroItems.map((item: SROItem, idx: number) => {
                    const rule = availableRules.find((r: SRORule) => r.id === item.sroRuleId);
                    const actualHours = item.id ? (sroActualHours[item.id] || 0) : 0;
                    const budgetHours = (rule?.estimateHours || 0) * item.quantity;
                    const isOverBudget = actualHours > budgetHours;
                    const progress = Math.min(100, (actualHours / budgetHours) * 100);

                    return (
                      <div key={idx} className="flex flex-col p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-[24px] border border-slate-100 dark:border-slate-800 group/sro transition-all hover:border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{rule?.taskName || "Unknown SRO"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-black uppercase tracking-tight ${isOverBudget ? 'text-rose-500' : 'text-emerald-600'}`}>{actualHours.toFixed(2)}h</span>
                              <span className="text-[10px] font-black text-slate-300">/ {budgetHours.toFixed(2)}h</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {isEditingSRO ? (
                               <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100">
                                  <button onClick={() => updateSroQuantity(idx, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400">-</button>
                                  <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                                  <button onClick={() => updateSroQuantity(idx, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400">+</button>
                                  <button onClick={() => removeSroItem(idx)} className="ml-2 text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                               </div>
                             ) : !isReadOnly && (
                               <button 
                                 onClick={() => handleQuickLog(item.id || "", rule?.taskName)} 
                                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/sro:opacity-100 transition-all"
                               >
                                 LOG TIME
                               </button>
                             )}
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`} 
                              style={{ width: `${progress}%` }} 
                           />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div className="space-y-4">
                 {subTasks.map((st: SubTask) => (
                    <div key={st.id} className="flex items-center gap-4 group">
                      <button onClick={() => handleToggleSubTask(st)} className={`shrink-0 transition-all ${st.isDone ? 'text-emerald-500' : 'text-slate-200 hover:text-indigo-500'}`}>{st.isDone ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}</button>
                      <div className="flex-1 flex items-center justify-between min-w-0">
                         <div className="flex flex-col min-w-0"><span onClick={() => !st.isDone && handleOpenEditSubTask(st)} className={`text-sm font-bold cursor-pointer transition-all ${st.isDone ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600'}`}>{st.content}</span>{st.description && <span className="text-[10px] text-slate-400 font-medium truncate">{st.description}</span>}</div>
                         <button onClick={() => handleDeleteSubTask(st.id)} className="p-2 text-slate-100 dark:text-slate-800 hover:text-red-500 group-hover:text-slate-300 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                 ))}
                 {!isReadOnly && (
                   <form onSubmit={handleAddSubTask} className="relative mt-6">
                      <input value={newSubTask} onChange={(e) => setNewSubTask(e.target.value)} placeholder="Thêm nhiệm vụ mới..." className="w-full bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 p-4 pl-6 pr-14 rounded-3xl text-sm font-bold outline-none focus:border-indigo-300 transition-all" />
                      <button type="submit" disabled={isAddingSubTask || !newSubTask.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-30"><Plus className="w-5 h-5" /></button>
                   </form>
                 )}
               </div>
            </div>
          </div>
 
          {/* C. LOG TIME AREA */}
          <div id="log-time-section" className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lịch sử Log Time</h3><span className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full">{totalLoggedHours.toFixed(2)}h Total</span></div>
            {!isReadOnly && (
              <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Dành cho DEV: Ghi nhận công việc chi tiết</span>
                </div>
                <form onSubmit={handleAddWorkLog} className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      id="log-hours-input" 
                      type="number" 
                      step="0.5" 
                      value={logForm.hours} 
                      onChange={(e) => setLogForm(prev => ({ ...prev, hours: e.target.value }))} 
                      placeholder="Số giờ" 
                      className="w-24 bg-white dark:bg-slate-950 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-2xl text-sm font-black outline-none transition-all focus:ring-2 focus:ring-emerald-500/20" 
                    />
                    <select 
                      value={logForm.serviceRequestItemId ? `sro_${logForm.serviceRequestItemId}` : logForm.subTaskId ? `st_${logForm.subTaskId}` : ""} 
                      onChange={(e) => { 
                        const val = e.target.value; 
                        if (val.startsWith("st_")) setLogForm(prev => ({ ...prev, subTaskId: val.replace("st_", ""), serviceRequestItemId: "" })); 
                        else if (val.startsWith("sro_")) setLogForm(prev => ({ ...prev, serviceRequestItemId: val.replace("sro_", ""), subTaskId: "" })); 
                        else setLogForm(prev => ({ ...prev, subTaskId: "", serviceRequestItemId: "" })); 
                      }} 
                      className="flex-1 bg-white dark:bg-slate-950 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-2xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Phân loại SRO (Bắt buộc)</option>
                      {request.items?.map((it: SROItem) => <option key={it.id} value={`sro_${it.id}`}>SRO: {it.sroRule?.taskName}</option>)}
                      {subTasks.map((st: SubTask) => <option key={st.id} value={`st_${st.id}`}>Task: {st.content}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <input 
                      value={logForm.description} 
                      onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))} 
                      placeholder="Mô tả công việc đã làm..." 
                      className="w-full bg-white dark:bg-slate-950 border border-emerald-100 dark:border-emerald-800/50 p-3 pr-12 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" 
                    />
                    <button type="submit" disabled={isLoggingTime || !logForm.hours} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-30"><Send className="w-4 h-4" /></button>
                  </div>
                </form>
              </div>
            )}

            {/* TAS QUICK LOG OVERHEAD */}
            {(session?.user as any)?.role === "TAS" || (session?.user as any)?.role === "ADMIN" ? (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Dành riêng cho TAS: Log meeting/Feedback</span>
                </div>
                <form onSubmit={handleTasLogTime} className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.5" 
                      value={tasLogForm.hours} 
                      onChange={(e) => setTasLogForm(prev => ({ ...prev, hours: e.target.value }))} 
                      placeholder="Số giờ" 
                      className="w-20 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 p-2.5 rounded-xl text-sm font-black outline-none"
                    />
                    <input 
                      value={tasLogForm.description} 
                      onChange={(e) => setTasLogForm(prev => ({ ...prev, description: e.target.value }))} 
                      placeholder="Mô tả nội dung meeting/feedback..." 
                      className="flex-1 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 p-2.5 rounded-xl text-[11px] font-bold outline-none" 
                    />
                    <button 
                      type="submit" 
                      disabled={isLoggingTas || !tasLogForm.hours} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isLoggingTas ? "..." : "SPLIT LOG"}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 italic px-1">* Hệ thống sẽ tự động chia đều số giờ này cho tất cả SRO hiện có trong ticket.</p>
                </form>
              </div>
            ) : null}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-slate-400"><History className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Lịch sử ghi nhận</span></div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {displayedLogs.map((log: WorkLog) => (
                  <div key={log.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 relative group transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black text-emerald-600">{log.hours} giờ</span>
                      <div className="flex flex-col items-end relative">
                        <span 
                          suppressHydrationWarning 
                          className="text-[9px] font-bold text-slate-400 uppercase"
                        >
                          {format(new Date(log.logDate), 'dd/MM HH:mm')}
                        </span>
                        
                        {/* Premium Action Buttons - Positioned right below date */}
                        <div className="flex items-center gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-all duration-300">
                          {deletingId === log.id ? (
                            <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteWorkLog(log.id); setDeletingId(null); }}
                                className="text-[9px] font-black text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md border border-rose-100"
                              >
                                XÁC NHẬN?
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                className="text-[9px] font-black text-slate-400 hover:bg-slate-50 px-2 py-1 rounded-md"
                              >
                                HỦY
                              </button>
                            </div>
                          ) : (
                            <>
                              {!log.groupId && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditWorkLog(log); }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingId(log.id); }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{log.description}</p>
                    <div className="flex items-center gap-2">
                      {log.subTaskId && <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 px-2 py-0.5 rounded-lg border border-indigo-100">Task: {subTasks.find((st: SubTask) => st.id === log.subTaskId)?.content}</span>}
                      {log.serviceRequestItemId && <span className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-2 py-0.5 rounded-lg border border-blue-100">{log.groupId ? `SRO: [${log.sroNames || "Nhiều hạng mục"}]` : `SRO: ${log.serviceRequestItem?.sroRule?.taskName}`}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* D. DISCUSSION & EVIDENCE */}
          <div className="grid grid-cols-1 gap-8">
             {/* INFO TABS NAVIGATION */}
             <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-4 border border-slate-100 dark:border-slate-800">
                <button onClick={() => setActiveInfoTab("DISCUSSION")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeInfoTab === "DISCUSSION" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><MessageSquare className="w-3.5 h-3.5" />Thảo luận</button>
                <button onClick={() => setActiveInfoTab("EVIDENCE")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeInfoTab === "EVIDENCE" ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><Paperclip className="w-3.5 h-3.5" />Bằng chứng</button>
                <button onClick={() => setActiveInfoTab("AUDIT")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeInfoTab === "AUDIT" ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><History className="w-3.5 h-3.5" />Lịch sử</button>
             </div>

             {/* Discussion Card */}
             {activeInfoTab === "DISCUSSION" && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-5 bg-blue-600 rounded-full" /><MessageSquare className="w-4 h-4 text-blue-600" />THẢO LUẬN & GHI CHÚ</h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-black">{comments.length} Bình luận</span>
                </div>
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {comments.length === 0 ? <div className="text-center py-12 text-slate-400"><MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" /><p className="text-sm font-medium">Chưa có bình luận nào</p></div> : comments.map((comment: Comment) => (
                      <div key={comment.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2"><div className="flex justify-between items-center"><span className="text-xs font-black text-slate-900 dark:text-slate-100">{comment.authorName}</span><span className="text-[10px] text-slate-400 font-bold">{format(new Date(comment.createdAt), 'HH:mm dd/MM/yyyy')}</span></div><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{comment.content}</p></div>
                  ))}
                </div>
                {!isReadOnly && (
                  <form onSubmit={handleAddComment} className="relative p-6 pt-0">
                    <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 pr-16 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[80px]" placeholder="Nhập bình luận hoặc ghi chú mới..." />
                    <button type="submit" disabled={isSubmitting || !commentContent.trim()} className="absolute right-10 bottom-10 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"><Send className="w-4 h-4" /></button>
                  </form>
                )}
              </div>
             )}

             {/* Evidence Card */}
             {activeInfoTab === "EVIDENCE" && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-purple-100/50 dark:border-purple-900/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-purple-50/50 dark:bg-purple-950/30 border-b border-purple-100/50 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-5 bg-purple-600 rounded-full" /><Paperclip className="w-4 h-4" />BẰNG CHỨNG (EVIDENCE)</h3>
                  {!isReadOnly && (
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase cursor-pointer hover:bg-purple-700 transition-all"><Upload className="w-3 h-3" />{isUploading ? "Đang tải..." : "Tải lên"}<input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} /></label>
                  )}
                </div>
                <div className="p-6">
                  {attachments.length === 0 ? <div className="text-center py-8 text-slate-400"><p className="text-xs italic">Chưa có bằng chứng đính kèm</p></div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {attachments.map((file: Attachment) => (
                        <div key={file.id} className="relative group/att">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-300 transition-all group overflow-hidden h-full">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 shrink-0 overflow-hidden">
                              {file.fileType?.includes("image") ? (
                                <img src={file.url} alt={file.filename} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{file.filename}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-black">{format(new Date(file.createdAt), 'dd/MM HH:mm')}</span>
                            </div>
                          </a>
                          {!isReadOnly && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleDeleteAttachment(file.id); }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/att:opacity-100 transition-opacity hover:bg-rose-600 z-10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>}
                </div>
              </div>
             )}

             {/* Audit Trail Card */}
             {activeInfoTab === "AUDIT" && (
               <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-b border-emerald-100/50 flex items-center justify-between">
                   <h3 className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-5 bg-emerald-600 rounded-full" /><History className="w-4 h-4" />LỊCH SỬ XỬ LÝ (AUDIT TRAIL)</h3>
                </div>
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 italic text-xs">Chưa có lịch sử xử lý.</div>
                  ) : (
                    auditLogs.map((log: AuditLog) => (
                      <div key={log.id} className="flex gap-4 items-start relative pb-4 before:content-[''] before:absolute before:left-[7px] before:top-4 before:bottom-0 before:w-[1px] before:bg-slate-100 dark:before:bg-slate-800 last:pb-0 last:before:hidden">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 mt-1 shrink-0 ${log.action === 'UPLOAD_EVIDENCE' ? 'bg-purple-500' : log.action === 'DELETE_EVIDENCE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase">{log.user?.name || "Hệ thống"}</span>
                             <span className="text-[8px] font-bold text-slate-400">{format(new Date(log.createdAt), 'HH:mm dd/MM/yyyy')}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">{log.details}</span>
                          <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5">{log.action}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest block border-l-4 border-blue-600 pl-3">ĐỘ ƯU TIÊN</label>
              <div className="grid grid-cols-1 gap-2">
                {PRIORITY_LEVELS.map((level) => (
                  <button key={level.value} onClick={() => handleFieldChange("priority", level.value)} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${priority === level.value ? `${level.border} ${level.bg} ${level.color} ring-4 ring-blue-500/5` : 'border-slate-50 dark:border-slate-950 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:bg-slate-100'}`}>
                    <level.icon className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-tight">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest block border-l-4 border-emerald-500 pl-3">NGƯỜI XỬ LÝ</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100">
                <UserCheck className="w-5 h-5 text-slate-400" />
                <select value={assigneeId} onChange={(e) => handleFieldChange("assigneeId", e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-full cursor-pointer">
                  <option value="">Chưa phân công</option>
                  {users.map((u: User) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest block border-l-4 border-purple-500 pl-3">HẠN HOÀN THÀNH</label>
              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isOverdue ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-slate-50 dark:bg-slate-950 border-slate-100'}`}>
                <CalendarIcon className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                <div className="flex flex-col flex-1">
                  <input type="date" value={deadline} onChange={(e) => handleFieldChange("deadline", e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-full cursor-pointer" />
                  {isOverdue && <span className="text-[8px] font-black text-red-600 uppercase tracking-tight">Quá hạn</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white space-y-6 shadow-xl">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><Package className="w-6 h-6 text-blue-400" /></div><div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gói Premium</h4><p className="text-sm font-bold truncate">{request.package.name}</p></div></div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Khách hàng</span><span className="text-white">{request.client.name}</span></div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Ngày gửi</span><span className="text-white">{format(new Date(request.raiseDate), 'dd/MM/yyyy')}</span></div>
              {request.creator && (
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Người tạo</span><span className="text-white">{request.creator.name}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={!!editingSubTask} onClose={() => setEditingSubTask(null)} title="CHỈNH SỬA ĐẦU VIỆC" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề</label><input value={editForm.content} onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-bold outline-none" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</label><textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm min-h-[120px] outline-none" /></div>
          <div className="flex gap-3 pt-2"><button onClick={handleSaveSubTaskEdit} className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase">Lưu</button><button onClick={() => setEditingSubTask(null)} className="flex-1 bg-slate-50 text-slate-500 py-3.5 rounded-2xl text-[10px] font-black uppercase">Hủy</button></div>
        </div>
      </Modal>

      <Modal isOpen={!!editingWorkLog} onClose={() => setEditingWorkLog(null)} title="SỬA GIỜ LÀM VIỆC" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số giờ</label><input type="number" step="0.5" value={logEditForm.hours} onChange={(e) => setLogEditForm(prev => ({ ...prev, hours: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-bold outline-none" /></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng mục</label>
              <select 
                value={logEditForm.serviceRequestItemId ? `sro_${logEditForm.serviceRequestItemId}` : logEditForm.subTaskId ? `st_${logEditForm.subTaskId}` : ""} 
                onChange={(e) => { 
                  const val = e.target.value; 
                  if (val.startsWith("st_")) {
                    setLogEditForm(prev => ({ ...prev, subTaskId: val.replace("st_", ""), serviceRequestItemId: "" }));
                  } else if (val.startsWith("sro_")) {
                    setLogEditForm(prev => ({ ...prev, serviceRequestItemId: val.replace("sro_", ""), subTaskId: "" }));
                  } else {
                    setLogEditForm(prev => ({ ...prev, subTaskId: "", serviceRequestItemId: "" }));
                  }
                }} 
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none"
              >
                <option value="">-- Cả yêu cầu --</option>
                {request.items?.map((item: SROItem) => (
                  <option key={item.id} value={`sro_${item.id}`}>🏷️ {item.sroRule?.taskName}</option>
                ))}
                {subTasks.map((st: SubTask) => (
                  <option key={st.id} value={`st_${st.id}`}>📌 {st.content}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</label><textarea value={logEditForm.description} onChange={(e) => setLogEditForm(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm min-h-[100px] outline-none" /></div>
          <div className="flex gap-3 pt-2"><button onClick={handleSaveWorkLogEdit} className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase">Lưu</button><button onClick={() => setEditingWorkLog(null)} className="flex-1 bg-slate-50 text-slate-500 py-3.5 rounded-2xl text-[10px] font-black uppercase">Hủy</button></div>
        </div>
      </Modal>
    </div>
  );
}
