/**
 * Meridian's document set — the evidence base for the demo.
 *
 * Eight documents, pre-chunked. Real ingestion (upload → parse → chunk → embed)
 * is Phase 2; seeding chunks directly lets the scoring loop be exercised end to
 * end without standing up the parser first.
 *
 * Three things here are deliberate rather than incidental:
 *
 *   1. **`ops-notes` contradicts `sop-intake`.** The SOP says three approval
 *      steps; the working notes say the third was dropped "months ago". Real
 *      client documents disagree, and an evidence system that only works on
 *      consistent inputs is not an evidence system.
 *   2. **`whiteboard-flow` is a photo.** Schema v1.1 made non-text media
 *      first-class (`doc_type: whiteboard_photo`) after the Phase 0 dogfood
 *      checkpoint. Its `content` here stands in for what vision extraction will
 *      produce in Phase 2, so downstream evidence links behave identically.
 *   3. **`requested-payroll-export` has no content.** It is a document discovery
 *      asked for that does not exist yet — the `requested` lifecycle state, also
 *      from the v1.1 amendments. It is deliberately excluded from the agent's
 *      evidence set; it exists to be visibly missing.
 */

export type DocType =
  | "sop"
  | "process_doc"
  | "transcript"
  | "ticket_export"
  | "spreadsheet"
  | "policy"
  | "whiteboard_photo";

export type DocStatus = "requested" | "processed";

export interface SeedChunk {
  /** Stable id. This is the string the agent cites in `evidenceIds`. */
  id: string;
  /** Ordinal within the document, for display. */
  index: number;
  content: string;
}

export interface SeedDocument {
  id: string;
  fileName: string;
  docType: DocType;
  status: DocStatus;
  /** Short note on provenance, shown in the evidence drawer. */
  provenance: string;
  /** Flags a document whose structure or quality is poor. Surfaced in the UI. */
  isMessy?: boolean;
  chunks: SeedChunk[];
}

export const MERIDIAN_DOCUMENTS: SeedDocument[] = [
  {
    id: "doc-sop-intake",
    fileName: "SOP-Work-Order-Intake-rev4.pdf",
    docType: "sop",
    status: "processed",
    provenance: "Provided by Dana Ruiz. Last revised March 2023.",
    chunks: [
      {
        id: "chunk-sop-01",
        index: 1,
        content: `3.1 Client Request Intake. All client maintenance requests arrive through the shared mailbox (service@meridianfs.com) or by phone to the dispatch line. The receiving dispatcher records the request in the Intake Log and assigns a provisional priority (P1 emergency / P2 same-week / P3 scheduled).`,
      },
      {
        id: "chunk-sop-02",
        index: 2,
        content: `3.2 Work Order Creation. The dispatcher re-enters the request into ServiceTitan as a work order, selecting the property, the trade, and the priority. Required fields: property ID, contact name, contact phone, description of fault, access instructions, and PO number where the client contract requires one.`,
      },
      {
        id: "chunk-sop-03",
        index: 3,
        content: `3.3 Approval. Work orders above $2,500 estimated value require three approvals before scheduling: (a) the regional dispatch lead, (b) the account manager for that property, and (c) the VP of Field Operations. Approvals are recorded by email and attached to the work order.`,
      },
      {
        id: "chunk-sop-04",
        index: 4,
        content: `3.4 Scheduling. Once approved, the dispatcher assigns a technician based on trade certification, current location, and outstanding workload. Scheduling should occur within four business hours of intake for P2 requests and within thirty minutes for P1.`,
      },
      {
        id: "chunk-sop-05",
        index: 5,
        content: `5.2 Completion and Invoicing. On completion the technician records labour hours, parts used, and completion notes in the ServiceTitan mobile app before leaving site. Billing runs a weekly export of completed work orders for invoicing. Work orders lacking completion notes are held back pending technician follow-up.`,
      },
    ],
  },
  {
    id: "doc-ops-notes",
    fileName: "dispatch process notes (working).docx",
    docType: "process_doc",
    status: "processed",
    provenance:
      "Informal working document maintained by the dispatch team. No revision history. Mixed authorship.",
    isMessy: true,
    chunks: [
      {
        id: "chunk-ops-01",
        index: 1,
        content: `ok so the actual process (not what the SOP says)

emails come into service@ — someone has to watch it all day. Dana usually. If she's out it's whoever. We miss stuff on Mondays because there's like 200 emails from the weekend.`,
      },
      {
        id: "chunk-ops-02",
        index: 2,
        content: `re-keying: everything in the email has to get typed into ServiceTitan by hand. property ID is the worst because clients never give it, you have to look it up from the address, and half the addresses are formatted differently than what's in the system. figure 8-12 min per work order, more if it's a new contact.

we do maybe 180-220 of these a week across all three regions.`,
      },
      {
        id: "chunk-ops-03",
        index: 3,
        content: `approvals — the 3-step thing in the SOP hasn't been real for a while. Marcus stopped signing off on individual WOs months ago, it was too slow, now it's just the dispatch lead + AM. Nobody updated the SOP. If someone asks, the answer is "two approvals."`,
      },
      {
        id: "chunk-ops-04",
        index: 4,
        content: `PO numbers: about 40% of our contracts need a PO on the invoice. It's in the contract but nobody in dispatch has the contracts, so we either guess or email the AM and wait. This is why invoices bounce.`,
      },
      {
        id: "chunk-ops-05",
        index: 5,
        content: `NE region (Tom's) still uses the old scheduler for anything recurring. They send us a spreadsheet on Fridays and we re-enter it. Don't ask.`,
      },
    ],
  },
  {
    id: "doc-tickets",
    fileName: "Support-Tickets-Q2-2026-export.csv",
    docType: "ticket_export",
    status: "processed",
    provenance: "ServiceTitan export, 1 Apr – 30 Jun 2026. 4,118 rows. Summarised by category.",
    chunks: [
      {
        id: "chunk-tix-01",
        index: 1,
        content: `Category summary, Q2 2026 (4,118 total client-initiated contacts):
- "Status of my request" — 1,247 (30.3%)
- New service request — 1,102 (26.8%)
- Invoice query / dispute — 611 (14.8%)
- Reschedule request — 508 (12.3%)
- Complaint: technician did not arrive in window — 289 (7.0%)
- Other — 361 (8.8%)`,
      },
      {
        id: "chunk-tix-02",
        index: 2,
        content: `"Status of my request" contacts: median 2.4 contacts per underlying work order. Mean handle time 6.2 minutes. 94% are answered by a dispatcher reading the work order status out of ServiceTitan and relaying it verbally or by email. There is no client-facing status view.`,
      },
      {
        id: "chunk-tix-03",
        index: 3,
        content: `Invoice query / dispute breakdown (611): missing or incorrect PO number term 244 (39.9%); disputed labour hours 141; disputed parts 97; wrong property billed 71; other 58. Average days to resolution: 11.4.`,
      },
      {
        id: "chunk-tix-04",
        index: 4,
        content: `Of 4,118 contacts, 3,301 (80.2%) arrived by phone to the dispatch line during business hours. Peak volume Monday 08:00–11:00, which is 3.1x the weekly hourly mean.`,
      },
    ],
  },
  {
    id: "doc-standup",
    fileName: "Ops-Standup-Transcript-2026-05-14.txt",
    docType: "transcript",
    status: "processed",
    provenance: "Weekly operations standup. Auto-transcribed, lightly corrected. Participants: Ruiz, Bell, Raghavan, Okafor.",
    chunks: [
      {
        id: "chunk-tr-01",
        index: 1,
        content: `RUIZ: The Monday backlog is the thing I'd fix first. We come in and there's a wall of email and by the time we've dug out it's Tuesday afternoon. Anything that arrived Saturday is effectively two days late before a tech is even assigned.

BELL: What's the actual number on that.

RUIZ: On a normal Monday, between six and eight of us are doing nothing but intake until about eleven.`,
      },
      {
        id: "chunk-tr-02",
        index: 2,
        content: `RAGHAVAN: I want to talk about the unbilled work again. We closed Q1 with about $310,000 of completed work orders that never got invoiced, and most of them are missing completion notes or a PO. It's not that the work didn't happen. It's that we can't prove it happened in a form the client will pay against.

BELL: How much of that eventually gets recovered?

RAGHAVAN: Maybe half. The rest ages out past the contract window and we write it off.`,
      },
      {
        id: "chunk-tr-03",
        index: 3,
        content: `OKAFOR: I'll say it again — I'm not moving the Northeast onto ServiceTitan recurring until the scheduling logic handles our multi-site contracts. It doesn't. We tried in January and it double-booked four crews in a week.

BELL: Noted. That's a configuration problem, not a reason to stay on two systems forever.`,
      },
      {
        id: "chunk-tr-04",
        index: 4,
        content: `RUIZ: The other thing is the status calls. A third of everything we pick up is somebody asking where their technician is. If a client could just see that themselves, I get two dispatchers back.

RAGHAVAN: Clients have asked for that. It's in three of the renewal conversations this quarter.`,
      },
      {
        id: "chunk-tr-05",
        index: 5,
        content: `BELL: On attrition — first-year is running 38%. Exit interviews keep saying the same two things: the first two weeks are chaotic, and they don't get straight answers about scheduling. The onboarding checklist exists but nobody's using it consistently across regions.`,
      },
    ],
  },
  {
    id: "doc-escalations",
    fileName: "Client-Escalation-Log-2026.xlsx",
    docType: "spreadsheet",
    status: "processed",
    provenance: "Maintained by account management. Free-text, inconsistent categorisation.",
    isMessy: true,
    chunks: [
      {
        id: "chunk-esc-01",
        index: 1,
        content: `Escalations YTD 2026: 87 logged. Top recurring themes by free-text review: "no update / no communication" (31), "tech no-show or outside window" (19), "invoice wrong" (17), "repeat visit for same fault" (12), uncategorised (8).`,
      },
      {
        id: "chunk-esc-02",
        index: 2,
        content: `Note column excerpt, 2026-03-02, Brightline Properties: "Third time this quarter they've called us before we called them. Client said 'I shouldn't have to chase you to find out if someone is coming.' At renewal risk — $410k ARR."`,
      },
      {
        id: "chunk-esc-03",
        index: 3,
        content: `Note column excerpt, 2026-04-19, Kestrel REIT: "Invoice rejected for missing PO for the fourth month running. AP contact says they will not process without it. ~$62k outstanding across 9 invoices."`,
      },
    ],
  },
  {
    id: "doc-onboarding",
    fileName: "Technician-Onboarding-Checklist-v2.pdf",
    docType: "policy",
    status: "processed",
    provenance: "HR, revised 2025. Adoption varies by region.",
    chunks: [
      {
        id: "chunk-onb-01",
        index: 1,
        content: `Week 1: safety orientation (mandatory, 4h), PPE issue, vehicle assignment, ServiceTitan mobile app setup and login verification, ride-along with assigned mentor technician (3 days).`,
      },
      {
        id: "chunk-onb-02",
        index: 2,
        content: `Week 2: trade-specific certification review, first supervised solo assignments, completion-note standards training, timesheet and expense process. Mentor signs off on readiness before unsupervised assignment.`,
      },
      {
        id: "chunk-onb-03",
        index: 3,
        content: `Note appended 2025-11: "Mentor sign-off is not happening consistently in NE and Southwest. Roughly a third of new technicians are taking unsupervised assignments in week 2 without a recorded sign-off." — HR audit`,
      },
    ],
  },
  {
    id: "doc-whiteboard",
    fileName: "whiteboard-dispatch-flow-2026-05-14.jpg",
    docType: "whiteboard_photo",
    status: "processed",
    provenance:
      "Photo taken during the 14 May standup. Text below is the extracted transcription (vision extraction is Phase 2; transcribed here for the seed).",
    chunks: [
      {
        id: "chunk-wb-01",
        index: 1,
        content: `[Whiteboard transcription] Boxes left to right: "EMAIL / PHONE" → "INTAKE LOG (manual)" → "RE-KEY into ST" → "APPROVE (2 not 3!)" → "ASSIGN TECH" → "ON SITE" → "NOTES?" → "BILLING EXPORT (weekly)".

Annotations: red circle around "RE-KEY into ST" with "8-12 min x 200/wk" written beside it. Red circle around "NOTES?" with "← leakage starts here" and an arrow to "$310k Q1". Question mark beside "BILLING EXPORT (weekly)" with "why weekly?" underlined twice.`,
      },
    ],
  },
  {
    id: "doc-requested-payroll",
    fileName: "(requested) technician payroll & utilisation export FY25",
    docType: "spreadsheet",
    status: "requested",
    provenance:
      "Requested from Priya Raghavan on 2026-05-16 to establish loaded hourly cost. Not yet received.",
    chunks: [],
  },
];

/** Every chunk the agent is allowed to cite — i.e. from processed documents only. */
export const MERIDIAN_EVIDENCE = MERIDIAN_DOCUMENTS.filter(
  (d) => d.status === "processed",
).flatMap((doc) =>
  doc.chunks.map((c) => ({
    id: c.id,
    sourceLabel: `${doc.fileName} · chunk ${c.index}`,
    content: c.content,
  })),
);

/** Look up a chunk and its parent document by chunk id, for the evidence drawer. */
export function findChunk(
  chunkId: string,
): { document: SeedDocument; chunk: SeedChunk } | null {
  for (const document of MERIDIAN_DOCUMENTS) {
    const chunk = document.chunks.find((c) => c.id === chunkId);
    if (chunk) return { document, chunk };
  }
  return null;
}
