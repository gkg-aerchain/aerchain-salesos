// Dummy data for Proposal Generator sub-app

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
    proposalTitle: "Aerchain Strategic Sourcing Suite — Enterprise Proposal",
    summary: "AI-generated proposal for full-suite procurement platform deployment, tailored for large Indian enterprises with $1B+ spend under management.",
    sections: [
      {
        heading: "Executive Summary",
        content: `Aerchain proposes a comprehensive procurement transformation for your organization, leveraging our AI-powered Strategic Sourcing Suite to deliver 15-22% cost savings on indirect spend within the first 12 months.

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
        content: `Based on your disclosed spend of $1.8B across 2,400 suppliers:

• Projected Year 1 savings: $270M-$396M (15-22% of addressable spend)
• Platform ROI: 225x-330x return on Y1 license investment
• Process efficiency: 60% reduction in sourcing cycle time (avg 45 days → 18 days)
• Supplier consolidation: 15-20% reduction in active supplier base
• Compliance improvement: 95%+ contract compliance (vs industry avg 72%)

Payback period: < 45 days from go-live`
      },
    ],
  },
  syncedAt: "2026-03-14T10:00:00Z",
  lastSynced: "2026-03-14T10:00:00Z",
  status: "🟢 Fresh",
};
