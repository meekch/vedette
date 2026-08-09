import type { OpportunitySet } from "@/lib/ai/schemas/opportunity";

/**
 * The scored-opportunity snapshot for the Meridian demo.
 *
 * **Provenance, stated plainly:** this snapshot is authored demo data, written
 * against the same schema the Analysis & Scoring Agent emits and citing only
 * chunk ids that exist in `./documents.ts`. It is *not* the recorded output of a
 * model run. `npm run analyze` replaces it with a real one once a chat-model key
 * is configured; until then the demo renders deterministically from this file.
 *
 * Shipping a snapshot rather than calling the model on every page load is also
 * the right production choice for a demo: it costs nothing per viewer, cannot
 * fail in front of an audience, and keeps the deployed site key-free.
 *
 * Every entry here obeys the same rules the agent is held to — no currency
 * figures, evidence ids on anything not marked as an assumption, dimensions
 * omitted rather than guessed. It validates against `opportunitySetSchema`;
 * `tests/seed.test.ts` proves it.
 */
export const MERIDIAN_ANALYSIS: OpportunitySet = {
  opportunities: [
    {
      title: "Structured work-order intake from the shared mailbox",
      processArea: "Dispatch",
      summary:
        "Extract property, contact, fault description, access instructions and priority from inbound request emails, resolve the property ID against the ServiceTitan address book, and present dispatch with a pre-filled work order to confirm rather than type. Dispatchers keep the approve/reject decision.",
      problemStatement:
        "Every inbound request is re-keyed by hand into ServiceTitan. The dispatch team's own working notes put this at 8–12 minutes per work order across 180–220 work orders a week, with property ID lookup called out as the slowest step because client addresses rarely match the system's formatting.",
      scores: [
        {
          key: "impact",
          score: 9,
          rationale:
            "Touches every work order the business creates, and directly relieves the Monday backlog that leaves weekend requests two days late before a technician is assigned.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-ops-02", "chunk-tr-01", "chunk-wb-01"],
        },
        {
          key: "effort",
          score: 5,
          rationale:
            "Email parsing and field extraction are well-trodden, but property-ID resolution against inconsistently formatted addresses is real work, and ServiceTitan write-back needs integration.",
          confidence: 0.6,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "complexity",
          score: 5,
          rationale:
            "The extraction itself is routine. The address-matching problem is the hard part and is explicitly called out as unreliable today.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-ops-02"],
        },
        {
          key: "risk",
          score: 4,
          rationale:
            "A dispatcher confirms every work order before it is created, so an extraction error is caught in the existing workflow rather than reaching a technician.",
          confidence: 0.8,
          isAssumption: false,
          evidenceIds: ["chunk-sop-02"],
        },
        {
          key: "dataAvailability",
          score: 8,
          rationale:
            "The mailbox history and the ServiceTitan property table both already exist and are accessible; this is the same data dispatchers read today.",
          confidence: 0.85,
          isAssumption: false,
          evidenceIds: ["chunk-sop-01", "chunk-ops-02"],
        },
        {
          key: "adoptionLikelihood",
          score: 9,
          rationale:
            "It removes the specific task the dispatch team describes as the worst part of the job, and leaves them in control of the outcome.",
          confidence: 0.85,
          isAssumption: false,
          evidenceIds: ["chunk-ops-02", "chunk-tr-01"],
        },
        {
          key: "strategicAlignment",
          score: 9,
          rationale:
            "Directly serves the stated objective of cutting time between a client request arriving and a technician being scheduled.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-tr-01"],
        },
        {
          key: "timeToValue",
          score: 4,
          rationale:
            "A read-only pilot producing draft work orders for one region could run inside a quarter; full write-back takes longer.",
          confidence: 0.5,
          isAssumption: true,
          evidenceIds: [],
        },
      ],
      roiInputs: {
        hoursPerWeek: 26,
        peopleAffected: 14,
        automationPotential: 0.6,
        adoptionRate: 0.85,
        rampMonths: 3,
        loadedCostBand: "frontline_admin",
        implementationCost: 145000,
        annualRunCost: 28000,
        confidence: 0.7,
        isAssumption: false,
        evidenceIds: ["chunk-ops-02", "chunk-tr-01"],
      },
    },
    {
      title: "Client-facing work order status view",
      processArea: "Client Service",
      summary:
        "Give clients a link showing the current status of their request, the scheduled window, and the assigned technician, updated from ServiceTitan. Deflects the status calls that dispatch currently answers by reading the record aloud.",
      problemStatement:
        "Status enquiries are the single largest category of client contact at 1,247 of 4,118 Q2 contacts, with a median of 2.4 contacts per work order. 94% are answered by a dispatcher reading status out of ServiceTitan. There is no client-facing status view at all.",
      scores: [
        {
          key: "impact",
          score: 8,
          rationale:
            "30.3% of all client contacts, at 6.2 minutes mean handle time. Dispatch leadership estimates it is worth two dispatchers back.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-tix-01", "chunk-tix-02", "chunk-tr-04"],
        },
        {
          key: "effort",
          score: 3,
          rationale:
            "A read-only view over data that already exists in ServiceTitan. No new data capture and no change to the dispatch workflow.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-tix-02"],
        },
        {
          key: "complexity",
          score: 2,
          rationale:
            "Standard read-only integration and a hosted view. Nothing here is novel.",
          confidence: 0.75,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "risk",
          score: 3,
          rationale:
            "Client-visible, so wrong or stale status damages trust — but it exposes the same information dispatch already gives verbally.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-tix-02"],
        },
        {
          key: "dataAvailability",
          score: 9,
          rationale:
            "Status already lives in ServiceTitan and is read from there today on every status call.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-tix-02"],
        },
        {
          key: "adoptionLikelihood",
          score: 8,
          rationale:
            "Clients have asked for it directly — it appears in three renewal conversations this quarter, and an escalation names chasing for updates as a renewal risk.",
          confidence: 0.85,
          isAssumption: false,
          evidenceIds: ["chunk-tr-04", "chunk-esc-02"],
        },
        {
          key: "strategicAlignment",
          score: 7,
          rationale:
            "Serves margin improvement without field headcount reduction by freeing dispatch capacity, and defends at-risk renewal revenue.",
          confidence: 0.75,
          isAssumption: false,
          evidenceIds: ["chunk-esc-02"],
        },
        {
          key: "timeToValue",
          score: 2,
          rationale:
            "Deliverable to a pilot client group within weeks; the underlying data needs no preparation.",
          confidence: 0.7,
          isAssumption: true,
          evidenceIds: [],
        },
      ],
      roiInputs: {
        hoursPerWeek: 9.9,
        peopleAffected: 14,
        automationPotential: 0.55,
        adoptionRate: 0.7,
        rampMonths: 4,
        loadedCostBand: "frontline_admin",
        implementationCost: 62000,
        annualRunCost: 14000,
        confidence: 0.8,
        isAssumption: false,
        evidenceIds: ["chunk-tix-01", "chunk-tix-02"],
      },
    },
    {
      title: "Completion-note capture and billing-readiness check",
      processArea: "Field Operations / Billing",
      summary:
        "Prompt technicians for a structured completion note on site — via voice capture rendered into the required fields — and run a readiness check before the weekly billing export, flagging work orders that will fail to invoice while the technician is still reachable.",
      problemStatement:
        "Meridian closed Q1 with roughly $310,000 of completed but uninvoiced work orders, most missing completion notes or a PO. Around half is eventually recovered; the rest ages past the contract window and is written off. The whiteboard from the May standup marks the completion-note step as where leakage starts.",
      scores: [
        {
          key: "impact",
          score: 10,
          rationale:
            "The Controller quantifies the exposure at ~$310k in a single quarter with roughly half written off. This is the largest single loss named anywhere in the evidence.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-tr-02", "chunk-wb-01"],
        },
        {
          key: "effort",
          score: 6,
          rationale:
            "Requires a change to what technicians do on site, plus a check in the billing pipeline. Field behaviour change is the expensive half.",
          confidence: 0.6,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "complexity",
          score: 5,
          rationale:
            "Voice capture in noisy field conditions and mapping free speech onto required billing fields is genuinely harder than it looks.",
          confidence: 0.55,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "risk",
          score: 5,
          rationale:
            "Completion notes feed invoices a client will dispute, so a fabricated or wrong detail has direct financial and trust consequences. Needs technician confirmation before submission.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-tix-03"],
        },
        {
          key: "dataAvailability",
          score: 6,
          rationale:
            "The SOP defines the required fields and ServiceTitan already holds them; what is missing is the note content itself, which is precisely the gap.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-sop-05"],
        },
        {
          key: "adoptionLikelihood",
          score: 5,
          rationale:
            "Adds a step at the end of a technician's day, which is the classic adoption failure. Mitigated if voice capture is genuinely faster than typing, but that is unproven here.",
          confidence: 0.5,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "strategicAlignment",
          score: 10,
          rationale:
            "Directly serves the stated objective of reducing revenue leakage from work performed but never invoiced.",
          confidence: 0.95,
          isAssumption: false,
          evidenceIds: ["chunk-tr-02"],
        },
        {
          key: "timeToValue",
          score: 5,
          rationale:
            "The billing-readiness check alone could ship early and recover value before any technician-facing change lands.",
          confidence: 0.6,
          isAssumption: true,
          evidenceIds: [],
        },
      ],
      roiInputs: {
        hoursPerWeek: 3.5,
        peopleAffected: 11,
        automationPotential: 0.45,
        adoptionRate: 0.6,
        rampMonths: 6,
        loadedCostBand: "frontline_admin",
        implementationCost: 210000,
        annualRunCost: 46000,
        confidence: 0.55,
        isAssumption: true,
        evidenceIds: [],
      },
    },
    {
      title: "PO number resolution at intake",
      processArea: "Dispatch / Billing",
      summary:
        "Surface the contract's PO requirement and the current PO number to the dispatcher at the moment a work order is created, by extracting PO terms from client contracts into a lookup dispatch can actually see.",
      problemStatement:
        "About 40% of contracts require a PO on the invoice, but dispatch does not hold the contracts — so they guess or email the account manager and wait. Missing or incorrect PO terms account for 244 of 611 Q2 invoice disputes, and one client alone has ~$62k outstanding across nine rejected invoices.",
      scores: [
        {
          key: "impact",
          score: 7,
          rationale:
            "The single largest invoice-dispute cause at 39.9%, with a named $62k exposure at one client and an 11.4-day average resolution time.",
          confidence: 0.9,
          isAssumption: false,
          evidenceIds: ["chunk-tix-03", "chunk-esc-03", "chunk-ops-04"],
        },
        {
          key: "effort",
          score: 4,
          rationale:
            "Contract extraction is a bounded one-time job over a finite contract set, plus a lookup surfaced in the dispatch workflow.",
          confidence: 0.6,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "risk",
          score: 3,
          rationale:
            "A wrong PO produces the same rejected invoice that happens today, caught by the client's AP process. The downside is bounded by the status quo.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-esc-03"],
        },
        {
          key: "dataAvailability",
          score: 5,
          rationale:
            "The contracts exist and state the terms, but they are not accessible to dispatch today, and the evidence does not establish where they are held or in what format.",
          confidence: 0.6,
          isAssumption: false,
          evidenceIds: ["chunk-ops-04"],
        },
        {
          key: "adoptionLikelihood",
          score: 8,
          rationale:
            "Removes a wait-on-someone-else step from dispatch and a recurring dispute from billing. Both affected teams gain.",
          confidence: 0.75,
          isAssumption: false,
          evidenceIds: ["chunk-ops-04"],
        },
        {
          key: "strategicAlignment",
          score: 8,
          rationale:
            "Serves the revenue-leakage objective through a different mechanism than completion notes — invoices that bounce rather than invoices never raised.",
          confidence: 0.8,
          isAssumption: false,
          evidenceIds: ["chunk-tix-03"],
        },
        {
          key: "timeToValue",
          score: 3,
          rationale:
            "Extraction over the top 50 contracts by revenue would cover most exposure within weeks.",
          confidence: 0.55,
          isAssumption: true,
          evidenceIds: [],
        },
      ],
      roiInputs: {
        hoursPerWeek: 6,
        peopleAffected: 11,
        automationPotential: 0.7,
        adoptionRate: 0.8,
        rampMonths: 2,
        loadedCostBand: "frontline_admin",
        implementationCost: 78000,
        annualRunCost: 12000,
        confidence: 0.7,
        isAssumption: false,
        evidenceIds: ["chunk-tix-03", "chunk-ops-04"],
      },
    },
    {
      title: "Northeast recurring-schedule reconciliation",
      processArea: "Dispatch",
      summary:
        "Ingest the Northeast region's weekly recurring-schedule spreadsheet and generate the corresponding ServiceTitan work orders, removing the manual re-entry while the underlying multi-site scheduling configuration is fixed separately.",
      problemStatement:
        "The Northeast region still runs recurring work on its pre-acquisition scheduler and sends dispatch a spreadsheet every Friday, which is re-entered by hand. The region will not migrate until ServiceTitan handles multi-site contracts — an attempt in January double-booked four crews in a week.",
      scores: [
        {
          key: "impact",
          score: 5,
          rationale:
            "Removes a recurring weekly re-entry task, but is scoped to one region and does not resolve the underlying two-system problem.",
          confidence: 0.7,
          isAssumption: false,
          evidenceIds: ["chunk-ops-05", "chunk-tr-03"],
        },
        {
          key: "effort",
          score: 3,
          rationale:
            "A spreadsheet of known shape into an existing API. Among the smallest pieces of work identified here.",
          confidence: 0.65,
          isAssumption: true,
          evidenceIds: [],
        },
        {
          key: "risk",
          score: 6,
          rationale:
            "Automating entry into a scheduler that already double-booked four crews risks amplifying a known failure rather than containing it.",
          confidence: 0.75,
          isAssumption: false,
          evidenceIds: ["chunk-tr-03"],
        },
        {
          key: "dataAvailability",
          score: 8,
          rationale:
            "The spreadsheet already exists on a fixed weekly cadence and is already treated as authoritative.",
          confidence: 0.8,
          isAssumption: false,
          evidenceIds: ["chunk-ops-05"],
        },
        {
          key: "strategicAlignment",
          score: 6,
          rationale:
            "Partially serves the objective of getting acquired regions onto the same process — but as a bridge, and a bridge can entrench the split it spans.",
          confidence: 0.6,
          isAssumption: false,
          evidenceIds: ["chunk-tr-03"],
        },
        {
          key: "timeToValue",
          score: 2,
          rationale:
            "Small, well-defined, and independent of the ServiceTitan configuration work.",
          confidence: 0.7,
          isAssumption: true,
          evidenceIds: [],
        },
      ],
      roiInputs: {
        hoursPerWeek: 5,
        peopleAffected: 2,
        automationPotential: 0.8,
        adoptionRate: 0.9,
        rampMonths: 2,
        loadedCostBand: "frontline_admin",
        implementationCost: 34000,
        annualRunCost: 8000,
        confidence: 0.6,
        isAssumption: true,
        evidenceIds: [],
      },
    },
  ],
  coverageGaps: [
    "Loaded hourly cost is unestablished — the payroll and utilisation export requested from the Controller on 2026-05-16 has not been received, so every ROI figure currently rests on a benchmark rate rather than Meridian's actual cost model.",
    "The $310k Q1 unbilled figure is stated in a standup transcript but not reconciled against a finance report; the split between missing completion notes and missing PO numbers is unknown, and it determines which of those two opportunities is worth more.",
    "Dispatch headcount of 14 is taken from the company profile, but the standup describes 'six to eight of us' on Monday intake — it is unclear whether the intake burden falls on the whole team or a subset.",
    "No evidence establishes what the January ServiceTitan multi-site failure actually was, so the effort to fix it — and therefore whether the Northeast bridge is worth building at all — cannot be scored.",
    "First-year technician attrition of 38% is attributed to a chaotic first two weeks and poor scheduling answers, but no exit-interview data was supplied to confirm the causes or size the opportunity.",
  ],
};
