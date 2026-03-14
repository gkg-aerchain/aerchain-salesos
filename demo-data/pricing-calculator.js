// Dummy data for Pricing Calculator sub-app

export const pricingCalculatorDummy = {
  data: {
    standardModel: {
      per1BSpend: 300000,
      yoyEscalation: "10%",
      breakEven: "$500M-$1B",
    },
    recentDeals: [
      { client: "Tata Steel",  y1Amount: 420000, spendUnderMgmt: "$2.1B", modules: "Sourcing, CLM, SXM" },
      { client: "Hindalco",    y1Amount: 285000, spendUnderMgmt: "$1.4B", modules: "Sourcing, Analytics" },
      { client: "JSW Group",   y1Amount: 510000, spendUnderMgmt: "$3.2B", modules: "Full Suite" },
    ],
  },
  syncedAt: "2026-03-14T10:00:00Z",
  lastSynced: "2026-03-14T10:00:00Z",
  status: "🟢 Fresh",
};
