import { Calendar, Home, List, Mail, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Start", icon: Home },
  { href: "/compare", label: "Vergleichsportal", icon: Monitor },
  { href: "/calendar", label: "Roadmap", icon: Calendar },
  { href: "/messages", label: "Nachrichten", icon: Mail },
  { href: "/list", label: "Inventar", icon: List },
];
