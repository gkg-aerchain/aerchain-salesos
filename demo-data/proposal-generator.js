// Sample files for Proposal Generator module
// Each entry represents a saved proposal document

export const proposalGeneratorFiles = [
  {
    id: "pg-001",
    name: "Larsen & Toubro — Full Suite Proposal",
    description: "Enterprise proposal for L&T's procurement transformation. Full Suite + Aiera AI deployment covering $1.9B in spend across construction, engineering, and heavy industry verticals.",
    status: "submitted",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-05T14:30:00Z",
    client: "Larsen & Toubro",
    value: 1200000,
    stage: "Negotiation",
    contact: "Priya Sharma",
    tags: ["enterprise", "full-suite", "construction"],
    data: {
      proposalTitle: "Aerchain Strategic Sourcing Suite — Enterprise Proposal",
      client: "Larsen & Toubro",
      value: 1200000,
      summary: "AI-generated proposal for full-suite procurement platform deployment, tailored for large Indian enterprises with $1B+ spend under management.",
      sections: [
        {
          heading: "Executive Summary",
          content: `Aerchain proposes a comprehensive procurement transformation for Larsen & Toubro, leveraging our AI-powered Strategic Sourcing Suite to deliver 15-22% cost savings on indirect spend within the first 12 months.

Our platform processes $20B+ in spend across 40+ enterprise deployments, with proven results at Tata Steel (18% savings), JSW Group (21% savings), and Adani Ports (16% savings). The Aiera AI engine provides real-time market intelligence, automated RFQ generation, and predictive supplier risk scoring.`
        },
        {
          heading: "Proposed Solution",
          content: `Tier: Full Suite + Aiera AI
Modules included:
• Strategic Sourcing — automated RFI/RFQ/RFP workflows with AI-scored vendor evaluation
• Contract Lifecycle Management — end-to-end CLM with e-signature and obligation tracking
• Supplier Experience Management (SXM) — onboarding, qualification, performance scorecards
• Spend Analytics — AI-powered classification, tail spend identification, savings opportunity mapping
• Aiera AI — conversational procurement assistant, market intelligence, negotiation coaching

Deployment: Cloud-hosted (AWS Mumbai region), SSO integration, dedicated success manager
Timeline: 8-week implementation, 4-week parallel run, go-live in Q2 2026`
        },
        {
          heading: "Commercial Terms",
          content: `Year 1 License: $1,200,000
Year 2 License: $1,320,000 (10% escalation)
Year 3 License: $1,452,000 (10% escalation)
Total 3-Year Value: $3,972,000

Payment: Quarterly in advance
Implementation Fee: $150,000 (one-time)
Support: 24/7 enterprise support included
SLA: 99.9% uptime guarantee with financial penalties

Volume discount available for 3-year commitment: 5% off total contract value`
        },
        {
          heading: "ROI Projection",
          content: `Based on L&T's disclosed spend of $1.9B across 2,400 suppliers:

• Projected Year 1 savings: $285M-$418M (15-22% of addressable spend)
• Platform ROI: 237x-348x return on Y1 license investment
• Process efficiency: 60% reduction in sourcing cycle time (avg 45 days → 18 days)
• Supplier consolidation: 15-20% reduction in active supplier base
• Compliance improvement: 95%+ contract compliance (vs industry avg 72%)

Payback period: < 45 days from go-live`
        },
      ],
      activeProposals: [
        { client: "Larsen & Toubro", value: 1200000, stage: "Negotiation", status: "In Review", submittedDate: "2026-03-05", contact: "Priya Sharma" },
      ],
    }
  },
  {
    id: "pg-002",
    name: "Bajaj Auto — Sourcing Module Proposal",
    description: "Mid-market proposal for Bajaj Auto's sourcing modernization. Modular approach starting with Strategic Sourcing + Analytics, with expansion path to Full Suite.",
    status: "draft",
    createdAt: "2026-03-12T10:15:00Z",
    updatedAt: "2026-03-13T17:45:00Z",
    client: "Bajaj Auto",
    value: 890000,
    stage: "Proposal",
    contact: "Meera Joshi",
    tags: ["mid-market", "modular", "automotive"],
    data: {
      proposalTitle: "Aerchain Sourcing Modernization — Bajaj Auto",
      client: "Bajaj Auto",
      value: 890000,
      summary: "Phased procurement modernization starting with Strategic Sourcing and Spend Analytics, with clear expansion path to Full Suite + Aiera AI.",
      sections: [
        {
          heading: "Executive Summary",
          content: `Bajaj Auto's procurement team currently manages $1.3B in annual spend across 1,800+ suppliers using a combination of SAP MM and manual processes. This proposal outlines a phased modernization approach, starting with Aerchain's Strategic Sourcing and Spend Analytics modules.

Phase 1 (this proposal) targets immediate wins: automated RFQ workflows, AI-powered spend classification, and tail spend identification. Conservative estimate: 12-18% savings on addressable indirect spend within 9 months.`
        },
        {
          heading: "Phase 1 — Sourcing + Analytics",
          content: `Modules:
• Strategic Sourcing — automated RFI/RFQ/RFP with AI vendor scoring
• Spend Analytics — classification, savings mapping, tail spend identification

Timeline: 6-week implementation, 2-week parallel run
Go-live: Q2 2026

Year 1: $890,000
Year 2: $979,000 (10% escalation)

Key deliverables:
• Full spend cube built from SAP MM extract + AP data
• Top 50 sourcing events automated in first 90 days
• Savings dashboard with real-time tracking`
        },
        {
          heading: "Phase 2 — Expansion Path",
          content: `After Phase 1 stabilization (6 months post go-live), recommended expansion:

• CLM Module: +$180,000/yr — contract repository, e-sign, obligation tracking
• SXM Module: +$150,000/yr — supplier onboarding, qualification, scorecards
• Aiera AI: +$120,000/yr — conversational assistant, market intelligence

Full Suite value at scale: $1,340,000/yr
Estimated total savings at Full Suite: $195M-$286M annually`
        },
        {
          heading: "Why Aerchain",
          content: `• Purpose-built for Indian enterprise procurement (not a Western tool adapted)
• Aiera AI trained on Indian market data, supplier databases, and regulatory frameworks
• 40+ enterprise deployments including Tata Steel, Reliance, JSW, Adani
• AWS Mumbai hosting — data sovereignty compliance
• Dedicated CSM with automotive industry experience
• 99.9% SLA with contractual penalties

Competitor comparison:
• vs SAP Ariba: 40% lower TCO, 3x faster implementation
• vs Coupa: Native India market intelligence, Hindi/regional language support
• vs Jaggaer: Superior AI capabilities, modern UX`
        },
      ],
      activeProposals: [
        { client: "Bajaj Auto", value: 890000, stage: "Proposal", status: "Draft", submittedDate: "2026-03-13", contact: "Meera Joshi" },
      ],
    }
  }
];

// Legacy flat format for backward compatibility with existing views
export const proposalGeneratorDummy = {
  data: {
    activeProposals: [
      { client: "Mahindra & Mahindra",  value: 750000,  stage: "Proposal",    status: "Submitted",  submittedDate: "2026-03-10", contact: "Rajesh Kumar" },
      { client: "Larsen & Toubro",      value: 1200000, stage: "Negotiation", status: "In Review",  submittedDate: "2026-03-05", contact: "Priya Sharma" },
      { client: "Reliance Industries",  value: 2000000, stage: "Proposal",    status: "Draft",      submittedDate: "2026-03-12", contact: "Amit Patel" },
      { client: "Adani Ports",          value: 680000,  stage: "Closed Won",  status: "Submitted",  submittedDate: "2026-02-28", contact: "Sneha Gupta" },
      { client: "Tata Steel",           value: 1450000, stage: "Negotiation", status: "In Review",  submittedDate: "2026-03-01", contact: "Vikram Singh" },
      { client: "JSW Group",            value: 1850000, stage: "Proposal",    status: "Submitted",  submittedDate: "2026-03-08", contact: "Ananya Desai" },
      { client: "Infosys Ltd",          value: 520000,  stage: "Closed Lost", status: "Rejected",   submittedDate: "2026-02-15", contact: "Karthik Nair" },
      { client: "Bajaj Auto",           value: 890000,  stage: "Proposal",    status: "Draft",      submittedDate: "2026-03-13", contact: "Meera Joshi" },
      { client: "Wipro Ltd",            value: 380000,  stage: "Closed Won",  status: "Submitted",  submittedDate: "2026-02-20", contact: "Rohan Kapoor" },
      { client: "Hindustan Unilever",   value: 1100000, stage: "Negotiation", status: "In Review",  submittedDate: "2026-03-03", contact: "Divya Menon" },
    ],
    total: 10,
    totalValue: 10820000,
    ...proposalGeneratorFiles[0].data,
  },
  syncedAt: "2026-03-14T10:00:00Z",
  lastSynced: "2026-03-14T10:00:00Z",
  status: "🟢 Fresh",
};
