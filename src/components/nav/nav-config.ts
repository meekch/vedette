import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  Target,
  FileOutput,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Which phase delivers this surface; null = available now. */
  comingInPhase: number | null;
};

// The primary workspace navigation. Dashboard and Documents get real surfaces
// across Phases 1–2; the rest are honest "coming in Phase N" stubs until their
// phase lands (see docs/PHASES.md).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, comingInPhase: null },
  { label: "Documents", href: "/documents", icon: FileText, comingInPhase: 2 },
  { label: "Discovery", href: "/discovery", icon: MessagesSquare, comingInPhase: 3 },
  { label: "Opportunities", href: "/opportunities", icon: Target, comingInPhase: 4 },
  { label: "Deliverables", href: "/deliverables", icon: FileOutput, comingInPhase: 5 },
];
