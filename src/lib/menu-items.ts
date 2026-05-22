import { LayoutDashboard, Users, FileText, BarChart3, Settings, Mail } from "lucide-react";

export const menuItems = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "TAS", "IMP_ENGINEER", "MANAGER"],
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["ADMIN", "TAS", "MANAGER"],
  },
  {
    title: "Service Requests",
    href: "/requests",
    icon: FileText,
    roles: ["ADMIN", "TAS", "IMP_ENGINEER", "MANAGER"],
  },
  {
    title: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "TAS", "MANAGER"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
    isCategory: true,
  },
  {
    title: "Email Settings",
    href: "/admin/settings/email",
    icon: Mail,
    roles: ["ADMIN"],
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];
