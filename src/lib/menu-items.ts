import { LayoutDashboard, Users, FileText, BarChart3, Settings, Mail } from "lucide-react";

export const menuItems = [
  {
    title: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "TAS", "IMP_ENGINEER", "MANAGER"],
  },
  {
    title: "Khách hàng",
    href: "/clients",
    icon: Users,
    roles: ["ADMIN", "TAS", "MANAGER"],
  },
  {
    title: "Yêu cầu dịch vụ",
    href: "/requests",
    icon: FileText,
    roles: ["ADMIN", "TAS", "IMP_ENGINEER", "MANAGER"],
  },
  {
    title: "Báo cáo & Thống kê",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "TAS", "MANAGER"],
  },
  {
    title: "Người dùng",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
    isCategory: true,
  },
  {
    title: "Cấu hình Email",
    href: "/admin/settings/email",
    icon: Mail,
    roles: ["ADMIN"],
  },
];
