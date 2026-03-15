// Aerchain Proposal HTML Template — Iron Mountain style
// All {{PLACEHOLDER}} values get replaced by mergeProposalTemplate()

export const PROPOSAL_FIELDS_DEFAULT = {
  // Header
  clientName: "",
  clientIndustry: "",
  preparedBy: "Aerchain Sales Team",
  preparedDate: new Date().toISOString().slice(0, 10),

  // Executive Summary
  execSummary: "",

  // Current State / Pain Points
  currentChallenges: "",

  // Proposed Solution
  solutionOverview: "",
  modules: "Strategic Sourcing, Contract Lifecycle Management, Spend Analytics, Aiera AI",
  deploymentModel: "Cloud-hosted (AWS Mumbai region)",
  implementationTimeline: "8 weeks",

  // Pricing
  y1License: 0,
  y2License: 0,
  y3License: 0,
  implFee: 0,
  totalContractValue: 0,
  paymentTerms: "Quarterly in advance",

  // ROI
  clientSpend: 0,
  projectedSavingsPercent: "15-22",
  projectedSavingsAmount: 0,
  roiMultiple: "0x",
  cycleTimeReduction: "60%",
  paybackPeriod: "45 days",

  // Why Aerchain
  whyAerchain: "",

  // Next Steps
  nextSteps: "",
};

export function mergeProposalTemplate(fields) {
  const f = { ...PROPOSAL_FIELDS_DEFAULT, ...fields };

  // Derived calculations
  const y1 = Number(f.y1License) || 0;
  const y2 = Number(f.y2License) || y1 * 1.1;
  const y3 = Number(f.y3License) || y1 * 1.21;
  const impl = Number(f.implFee) || 0;
  const tcv = y1 + y2 + y3 + impl;
  const spend = Number(f.clientSpend) || 0;
  const savPct = f.projectedSavingsPercent || "15-22";
  const savLow = spend * (parseFloat(savPct) / 100) || 0;
  const savHigh = spend * (parseFloat(savPct.split("-")[1] || savPct) / 100) || 0;
  const roi = y1 > 0 ? Math.round(savLow / y1) : 0;

  // Bar widths for visual comparison
  const maxVal = Math.max(y1, y2, y3, 1);
  const y1W = Math.round((y1 / maxVal) * 100);
  const y2W = Math.round((y2 / maxVal) * 100);
  const y3W = Math.round((y3 / maxVal) * 100);

  const fmtUSD = (n) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const moduleList = (f.modules || "").split(",").map(m => m.trim()).filter(Boolean);
  const moduleListHTML = moduleList.map(m => `<li>${m}</li>`).join("\n            ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aerchain Proposal — ${f.clientName || "Client"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }

  .page { max-width: 850px; margin: 0 auto; padding: 40px 48px; }

  /* Cover */
  .cover { background: linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #4a2c8a 100%); color: white; padding: 80px 48px; min-height: 400px; display: flex; flex-direction: column; justify-content: center; }
  .cover-badge { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 6px 16px; border-radius: 20px; margin-bottom: 24px; }
  .cover h1 { font-size: 36px; font-weight: 700; margin-bottom: 12px; line-height: 1.2; }
  .cover .subtitle { font-size: 18px; font-weight: 300; opacity: 0.85; margin-bottom: 32px; }
  .cover-meta { display: flex; gap: 32px; font-size: 13px; opacity: 0.7; }
  .cover-meta span { display: flex; align-items: center; gap: 6px; }

  /* Section */
  .section { margin-bottom: 36px; }
  .section-num { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #7c3aed; margin-bottom: 6px; }
  .section h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #1a1a2e; }
  .section p, .section li { font-size: 14px; color: #444; line-height: 1.8; }
  .section ul { padding-left: 20px; margin-top: 8px; }
  .section li { margin-bottom: 6px; }

  /* Pricing table */
  .pricing-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .pricing-table th, .pricing-table td { padding: 12px 16px; text-align: left; font-size: 14px; border-bottom: 1px solid #eee; }
  .pricing-table th { font-weight: 600; color: #7c3aed; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; background: #f8f6ff; }
  .pricing-table .total-row { font-weight: 700; background: #f0ecff; border-top: 2px solid #7c3aed; }
  .pricing-table .total-row td { padding: 14px 16px; }

  /* Bar chart */
  .bar-chart { margin: 20px 0; }
  .bar-row { display: flex; align-items: center; margin-bottom: 10px; }
  .bar-label { width: 80px; font-size: 13px; font-weight: 500; color: #666; }
  .bar-track { flex: 1; height: 28px; background: #f0ecff; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #a855f7); border-radius: 6px; display: flex; align-items: center; padding-left: 12px; font-size: 12px; font-weight: 600; color: white; min-width: 60px; transition: width 0.6s ease; }

  /* ROI highlight */
  .roi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
  .roi-card { background: linear-gradient(135deg, #f8f6ff, #f0ecff); border: 1px solid #e5deff; border-radius: 12px; padding: 20px; text-align: center; }
  .roi-card .value { font-size: 28px; font-weight: 700; color: #7c3aed; }
  .roi-card .label { font-size: 12px; color: #888; margin-top: 4px; }

  /* Footer */
  .footer { border-top: 2px solid #7c3aed; padding-top: 24px; margin-top: 48px; display: flex; justify-content: space-between; align-items: center; }
  .footer-logo { font-size: 18px; font-weight: 700; color: #7c3aed; }
  .footer-text { font-size: 12px; color: #999; }

  /* Print */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { page-break-after: always; }
    .no-print { display: none !important; }
  }

  /* Download button */
  .download-bar { position: fixed; top: 0; left: 0; right: 0; background: #1a1a2e; padding: 10px 24px; display: flex; justify-content: flex-end; gap: 12px; z-index: 100; }
  .download-bar button { padding: 8px 20px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-print { background: #7c3aed; color: white; }
  .btn-print:hover { background: #6d28d9; }
  body { padding-top: 50px; }
</style>
</head>
<body>

<!-- Download bar -->
<div class="download-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
</div>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-badge">Confidential Proposal</div>
  <h1>Strategic Procurement Platform Proposal</h1>
  <div class="subtitle">Prepared for ${f.clientName || "[Client Name]"}</div>
  <div class="cover-meta">
    <span>Prepared by: ${f.preparedBy}</span>
    <span>Date: ${f.preparedDate}</span>
    <span>Industry: ${f.clientIndustry || "Enterprise"}</span>
  </div>
</div>

<div class="page">

  <!-- EXECUTIVE SUMMARY -->
  <div class="section">
    <div class="section-num">01</div>
    <h2>Executive Summary</h2>
    <p>${f.execSummary || "Aerchain proposes a comprehensive procurement transformation for your organization, leveraging our AI-powered Strategic Sourcing Suite to deliver measurable cost savings and operational efficiency."}</p>
  </div>

  <!-- CURRENT CHALLENGES -->
  <div class="section">
    <div class="section-num">02</div>
    <h2>Current Challenges</h2>
    <p>${f.currentChallenges || "Your organization faces challenges in procurement efficiency, supplier management, and spend visibility that limit strategic decision-making and cost optimization."}</p>
  </div>

  <!-- PROPOSED SOLUTION -->
  <div class="section">
    <div class="section-num">03</div>
    <h2>Proposed Solution</h2>
    <p>${f.solutionOverview || "Aerchain's AI-powered procurement platform provides end-to-end sourcing, contract management, and spend analytics."}</p>
    <ul>
      ${moduleListHTML}
    </ul>
    <p style="margin-top:12px"><strong>Deployment:</strong> ${f.deploymentModel}<br>
    <strong>Implementation:</strong> ${f.implementationTimeline}</p>
  </div>

  <!-- COMMERCIAL TERMS -->
  <div class="section">
    <div class="section-num">04</div>
    <h2>Commercial Terms</h2>
    <table class="pricing-table">
      <thead>
        <tr><th>Item</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Year 1 License</td><td>${fmtUSD(y1)}</td></tr>
        <tr><td>Year 2 License</td><td>${fmtUSD(y2)}</td></tr>
        <tr><td>Year 3 License</td><td>${fmtUSD(y3)}</td></tr>
        <tr><td>Implementation Fee (one-time)</td><td>${fmtUSD(impl)}</td></tr>
        <tr class="total-row"><td>Total Contract Value (3-Year)</td><td>${fmtUSD(tcv)}</td></tr>
      </tbody>
    </table>
    <p style="font-size:13px;color:#666;margin-top:8px">Payment terms: ${f.paymentTerms}</p>

    <div class="bar-chart">
      <div class="bar-row"><div class="bar-label">Year 1</div><div class="bar-track"><div class="bar-fill" style="width:${y1W}%">${fmtUSD(y1)}</div></div></div>
      <div class="bar-row"><div class="bar-label">Year 2</div><div class="bar-track"><div class="bar-fill" style="width:${y2W}%">${fmtUSD(y2)}</div></div></div>
      <div class="bar-row"><div class="bar-label">Year 3</div><div class="bar-track"><div class="bar-fill" style="width:${y3W}%">${fmtUSD(y3)}</div></div></div>
    </div>
  </div>

  <!-- ROI PROJECTION -->
  <div class="section">
    <div class="section-num">05</div>
    <h2>ROI Projection</h2>
    <p>Based on disclosed spend of ${fmtUSD(spend)} across your supplier base:</p>
    <div class="roi-grid">
      <div class="roi-card">
        <div class="value">${savLow > 0 ? fmtUSD(savLow) + "–" + fmtUSD(savHigh) : "TBD"}</div>
        <div class="label">Projected Year 1 Savings</div>
      </div>
      <div class="roi-card">
        <div class="value">${roi > 0 ? roi + "x" : f.roiMultiple}</div>
        <div class="label">ROI Multiple</div>
      </div>
      <div class="roi-card">
        <div class="value">${f.paybackPeriod}</div>
        <div class="label">Payback Period</div>
      </div>
    </div>
    <ul>
      <li>Cycle time reduction: ${f.cycleTimeReduction}</li>
      <li>Projected savings: ${savPct}% of addressable spend</li>
    </ul>
  </div>

  <!-- WHY AERCHAIN -->
  <div class="section">
    <div class="section-num">06</div>
    <h2>Why Aerchain</h2>
    <p>${f.whyAerchain || "Aerchain processes $20B+ in spend across 40+ enterprise deployments. Our Aiera AI engine provides real-time market intelligence, automated RFQ generation, and predictive supplier risk scoring — delivering measurable outcomes for India's largest enterprises."}</p>
  </div>

  <!-- NEXT STEPS -->
  <div class="section">
    <div class="section-num">07</div>
    <h2>Next Steps</h2>
    <p>${f.nextSteps || "1. Review and sign-off on commercial terms\\n2. Kick-off implementation planning\\n3. Begin data migration and system integration\\n4. User training and parallel run\\n5. Go-live"}</p>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-logo">aerchain</div>
    <div class="footer-text">Confidential — Prepared for ${f.clientName || "[Client Name]"} — ${f.preparedDate}</div>
  </div>

</div>
</body>
</html>`;
}
