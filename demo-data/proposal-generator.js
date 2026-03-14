// Dummy data for Proposal Generator sub-app

export const proposalGeneratorDummy = {
  data: {
    activeProposals: [
      { client: "Mahindra & Mahindra",  value: 750000,  stage: "Proposal",    status: "Submitted", submittedDate: "2026-03-10", contact: "Rajesh Kumar" },
      { client: "Larsen & Toubro",      value: 1200000, stage: "Negotiation", status: "In Review", submittedDate: "2026-03-05", contact: "Priya Sharma" },
      { client: "Reliance Industries",  value: 2000000, stage: "Proposal",    status: "Draft",     submittedDate: "2026-03-12", contact: "Amit Patel" },
      { client: "Adani Ports",          value: 680000,  stage: "Closed Won",  status: "Submitted", submittedDate: "2026-02-28", contact: "Sneha Gupta" },
    ],
    total: 4,
    totalValue: 4630000,
  },
  syncedAt: "2026-03-14T10:00:00Z",
  lastSynced: "2026-03-14T10:00:00Z",
  status: "🟢 Fresh",
};
