/**
 * Meridian Field Services — the demo engagement.
 *
 * Fictional. A ~400-person mid-market facilities services company, chosen
 * because it is the kind of client an FDE actually meets: not a tech company,
 * running on a mix of a real field-service platform, a decade of spreadsheets,
 * and institutional knowledge held by four people who have been there forever.
 *
 * The narrative is kept internally consistent across every document in
 * `./documents.ts` — the same names, systems, and numbers recur, and the
 * documents disagree with each other in the specific ways real client documents
 * disagree. That inconsistency is deliberate: a demo built on tidy data proves
 * nothing about handling messy data.
 */

export const MERIDIAN_ORG = {
  slug: "meridian-field-services",
  name: "Meridian Field Services",
  sizeBand: "mid_market" as const,
  headcount: 412,
  profile: `Meridian Field Services provides commercial facilities maintenance — HVAC, electrical, plumbing, and janitorial — to roughly 340 commercial properties across three metro regions. Founded 1998, family-owned until a 2023 private-equity recapitalisation.

Roughly 290 of its 412 staff are field technicians. The remainder sit in dispatch (14), account management (22), billing and AP (11), procurement (6), safety and compliance (5), HR and recruiting (8), and leadership and support functions.

Systems: ServiceTitan for work orders and scheduling (adopted 2021, partially configured), NetSuite for finance, a shared Outlook mailbox for client intake, and an unusually large amount of institutional process living in spreadsheets on a shared drive. Two regions were acquired in 2024 and still run partly on their prior scheduling tool.

The PE sponsor has asked for a 300bp margin improvement over eight quarters without headcount reduction in the field, which is the pressure behind this engagement.`,
} as const;

/**
 * Objectives leadership actually stated, from the offsite. These are the basis
 * for every `strategicAlignment` score — the agent is told to score alignment
 * against *these*, not against a generic notion of business value.
 */
export const MERIDIAN_OBJECTIVES = [
  "Improve gross margin by 300bp over eight quarters without reducing field headcount",
  "Cut the time between a client request arriving and a technician being scheduled",
  "Reduce revenue leakage from work performed but never invoiced",
  "Make the two 2024-acquired regions operate on the same process as the core business",
  "Reduce first-year technician attrition, currently 38%",
] as const;

export const MERIDIAN_STAKEHOLDERS = [
  {
    name: "Dana Ruiz",
    title: "Director of Dispatch Operations",
    notes:
      "Owns intake and scheduling. Ten years at Meridian. The person everyone calls when the process breaks.",
  },
  {
    name: "Marcus Bell",
    title: "VP Field Operations",
    notes: "Owns the technician workforce across all three regions. Sponsor of this engagement.",
  },
  {
    name: "Priya Raghavan",
    title: "Controller",
    notes: "Owns billing, AP, and the revenue-leakage problem. Deeply sceptical of software projects.",
  },
  {
    name: "Tom Okafor",
    title: "Regional Manager, Northeast (acquired 2024)",
    notes: "Still runs the legacy scheduling tool. Resistant to the ServiceTitan migration.",
  },
  {
    name: "Sarah Lindqvist",
    title: "Chief Operating Officer",
    notes: "Reports to the PE sponsor. Wants a defensible plan, not a technology wish list.",
  },
] as const;
