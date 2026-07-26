import {
  Activity,
  Calendar,
  ClipboardList,
  Headphones,
  History,
  LayoutDashboard,
  MessageSquare,
  Package,
  Pill,
  Settings,
  Shield,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import type { SidebarLink } from "@/components/ui/Sidebar";

export const patientNavLinks: SidebarLink[] = [
  { href: "/patient/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/patient/consultation", label: "Consultation", icon: <Stethoscope className="h-4 w-4" /> },
  { href: "/patient/ai-suite", label: "Clinical AI Suite", icon: <Activity className="h-4 w-4" /> },
  { href: "/patient/booking", label: "Book Specialist", icon: <Calendar className="h-4 w-4" /> },
  { href: "/patient/pharmacy", label: "E-Pharmacy", icon: <Pill className="h-4 w-4" /> },
  { href: "/patient/wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
  { href: "/patient/history", label: "Medical History", icon: <History className="h-4 w-4" /> },
  { href: "/patient/profile", label: "Profile", icon: <Settings className="h-4 w-4" /> },
];

export const doctorNavLinks: SidebarLink[] = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/doctor/appointments", label: "Appointments", icon: <Calendar className="h-4 w-4" /> },
  { href: "/doctor/wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
  { href: "/doctor/research-chat", label: "Research Chat", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/doctor/profile", label: "Profile", icon: <Settings className="h-4 w-4" /> },
];

export const pharmacyNavLinks: SidebarLink[] = [
  { href: "/pharmacy/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/pharmacy/catalogue", label: "Catalogue", icon: <Package className="h-4 w-4" /> },
  { href: "/pharmacy/orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/pharmacy/wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
  { href: "/pharmacy/profile", label: "Profile", icon: <Settings className="h-4 w-4" /> },
];

export const adminNavLinks: SidebarLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/support", label: "Support", icon: <Headphones className="h-4 w-4" /> },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: <Shield className="h-4 w-4" /> },
  { href: "/admin/profile", label: "Profile", icon: <Settings className="h-4 w-4" /> },
];
