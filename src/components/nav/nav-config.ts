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

// The primary workspace navigation. Dashboard and Opportunities are live; the
// rest are honest "coming in Phase N" stubs until their phase lands (see
// docs/PHASES.md).
//
// Opportunities is deliberately built ahead of Documents and Discovery. Those
// phases feed it, but the evidence-and-inspectable-ROI argument is the thing
// worth proving first — a scored opportunity with a clickable evidence trail
// demonstrates the whole thesis in one screen, and its inputs can be seeded
// while ingestion and interviews are still being built.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, comingInPhase: null },
  { label: "Opportunities", href: "/opportunities", icon: Target, comingInPhase: null },
  { label: "Documents", href: "/documents", icon: FileText, comingInPhase: 2 },
  { label: "Discovery", href: "/discovery", icon: MessagesSquare, comingInPhase: 3 },
  { label: "Deliverables", href: "/deliverables", icon: FileOutput, comingInPhase: 5 },
];
