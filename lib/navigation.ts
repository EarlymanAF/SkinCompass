import { Calendar, Home, List, Mail, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Start", icon: Home, enabled: true },
  { href: "/compare", label: "Vergleichsportal", icon: Monitor, enabled: false },
  { href: "/calendar", label: "Roadmap", icon: Calendar, enabled: false },
  { href: "/messages", label: "Nachrichten", icon: Mail, enabled: false },
  { href: "/list", label: "Inventar", icon: List, enabled: false },
];
