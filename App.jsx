import { useState, useEffect } from "react";
import {
  DollarSign, FileText, ChevronRight, Plus, Download,
  Send, Copy, Calculator, Layers, Upload
} from "lucide-react";

const T = {
  bg:        "#0d0a1e",
  bgCard:    "rgba(255,255,255,0.045)",
  bgHover:   "rgba(255,255,255,0.07)",
  bgActive:  "rgba(139,92,246,0.18)",
  border:    "rgba(255,255,255,0.08)",
  borderAcc: "rgba(139,92,246,0.4)",
  text:      "#ffffff",
  muted:     "rgba(255,255,255,0.5)",
  accent:    "#8b5cf6",
  accentBg:  "rgba(139,92,246,0.15)",
  success:   "#10b981",
  warn:      "#f59e0b",
  error:     "#ef4444",
  topbar:    "rgba(13,10,30,0.92)",
  sidebar:   "rgba(255,255,255,0.025)",
};

const MODULES = [
  { id: "pricing-calculator", label: "Pricing Calculator", Icon: DollarSign },
  { id: "proposal-generator", label: "Proposal Generator", Icon: FileText },
];

function AerchainLogo({ height = 18 }) {
  return (
    <svg height={height} viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"block" }}>
      <path d="M3.7951 26.9895C3.61396 27.3937 3.43282 27.6616 3.254 27.7956C3.07286 27.9295 2.80115 27.9977 2.44119 27.9977H0.678569C0.225721 27.9977 0.000457764 27.852 0.000457764 27.5606C0.000457764 27.4478 0.056193 27.2574 0.169986 26.9895L10.3672 5.68021C10.7063 4.98698 10.9547 4.53109 11.1127 4.31959C11.2706 4.10575 11.4633 4 11.6886 4C11.893 4 12.0671 4.10575 12.2134 4.31959C12.3597 4.53344 12.6036 4.98698 12.9426 5.68021L23.242 26.9895C23.3558 27.2574 23.4116 27.4501 23.4116 27.5606C23.4116 27.852 23.1747 27.9977 22.7009 27.9977H20.8036C20.4413 27.9977 20.1766 27.9295 20.0071 27.7956C19.8375 27.6616 19.6518 27.3914 19.4474 26.9895L11.6212 10.2509L3.7951 26.9895Z" fill="white"/>
      <path d="M40.5221 24.8957C40.6359 24.9991 40.6916 25.1989 40.6916 25.495V27.2433C40.6916 27.5418 40.6359 27.7415 40.5221 27.8426C40.4083 27.946 40.2179 27.9977 39.9462 27.9977H27.1062C26.8345 27.9977 26.644 27.946 26.5302 27.8426C26.4165 27.7392 26.3607 27.5394 26.3607 27.2433V4.75433C26.3607 4.45824 26.4165 4.25614 26.5302 4.1551C26.6417 4.0517 26.8345 4 27.1039 4H39.9113C40.183 4 40.3735 4.0517 40.4873 4.1551C40.6011 4.25849 40.6568 4.45824 40.6568 4.75433V6.50269C40.6568 6.80114 40.6011 7.00088 40.4873 7.10193C40.3735 7.20533 40.183 7.25703 39.9113 7.25703H30.153C29.9951 7.25703 29.8883 7.28523 29.8302 7.34162C29.7745 7.39802 29.7466 7.49672 29.7466 7.63302V13.9074C29.7466 14.0672 29.7745 14.1753 29.8302 14.234C29.886 14.2904 29.9928 14.3186 30.153 14.3186H38.7595C39.0312 14.3186 39.2216 14.3703 39.3354 14.4737C39.4492 14.5771 39.5049 14.7769 39.5049 15.0729V16.7861C39.5049 17.061 39.4492 17.2537 39.3354 17.3688C39.2216 17.484 39.0312 17.5404 38.7595 17.5404H30.153C29.9951 17.5404 29.8883 17.5686 29.8302 17.625C29.7745 17.6814 29.7466 17.7801 29.7466 17.9164V24.3623C29.7466 24.4986 29.7745 24.5973 29.8302 24.6537C29.886 24.7101 29.9928 24.7383 30.153 24.7383H39.9438C40.2156 24.7383 40.406 24.79 40.5198 24.8934L40.5221 24.8957Z" fill="white"/>
      <path d="M48.7198 27.8449C48.606 27.9483 48.4156 28 48.1439 28H46.2466C45.9748 28 45.7844 27.9483 45.6706 27.8449C45.5568 27.7415 45.5011 27.5418 45.5011 27.2457V4.75433C45.5011 4.45824 45.5568 4.25614 45.6706 4.1551C45.7844 4.0517 45.9772 4 46.2466 4H52.7188C59.1562 4 62.3749 6.47919 62.3749 11.4399C62.3749 13.0849 61.9685 14.4408 61.1557 15.503C60.3429 16.5652 59.212 17.35 57.7675 17.8506L63.5941 26.9707C63.7753 27.2222 63.8659 27.4384 63.8659 27.6217C63.8659 27.758 63.8031 27.8567 63.6801 27.9131C63.5547 27.9695 63.3689 27.9977 63.1204 27.9977H61.1209C60.7377 27.9977 60.4544 27.9413 60.2733 27.8261C60.0921 27.711 59.8785 27.4619 59.63 27.0718L53.3969 17.061C53.2622 16.8777 53.1926 16.7179 53.1926 16.5816C53.1926 16.3983 53.3621 16.2949 53.7011 16.2738C57.1126 15.9095 58.8172 14.3656 58.8172 11.6444C58.8172 10.0911 58.2807 8.95369 57.2078 8.23225C56.1349 7.51317 54.5813 7.15128 52.5493 7.15128H49.2957C49.1378 7.15128 49.031 7.17948 48.9729 7.23588C48.9172 7.29227 48.8893 7.40272 48.8893 7.56252V27.241C48.8893 27.5394 48.8336 27.7392 48.7198 27.8402V27.8449Z" fill="white"/>
      <path d="M84.5991 22.4471C84.8476 22.2473 85.0404 22.1486 85.1751 22.1486C85.2656 22.1486 85.3562 22.1815 85.4468 22.2473C85.5374 22.3131 85.6163 22.3907 85.6837 22.48L86.666 23.81C86.7798 23.944 86.8355 24.0991 86.8355 24.2753C86.8355 24.3646 86.8007 24.4586 86.7333 24.5573C86.666 24.656 86.5638 24.7618 86.4291 24.8722C85.2308 25.8686 83.8815 26.6394 82.3813 27.1822C80.8788 27.7251 79.3043 27.9977 77.6555 27.9977C75.4423 27.9977 73.415 27.4877 71.5734 26.4678C69.7318 25.448 68.2757 24.0309 67.2028 22.2121C66.1299 20.3956 65.5934 18.3558 65.5934 16.0952C65.5934 13.8345 66.1299 11.7525 67.2028 9.91247C68.2757 8.07246 69.7434 6.62724 71.6082 5.57446C73.4707 4.52639 75.5538 4 77.8575 4C79.4831 4 81.0367 4.27729 82.516 4.83188C83.9953 5.38647 85.3121 6.1408 86.464 7.09253C86.6892 7.24763 86.803 7.41447 86.803 7.59072C86.803 7.74581 86.7357 7.92206 86.5986 8.12181L85.6163 9.41898C85.4352 9.66337 85.254 9.78557 85.0752 9.78557C84.9405 9.78557 84.7478 9.69627 84.4993 9.52002C83.5286 8.78919 82.4766 8.21345 81.3479 7.79046C80.2193 7.36982 79.0326 7.15833 77.7902 7.15833C76.1855 7.15833 74.7247 7.53432 73.4033 8.28865C72.0819 9.04298 71.0369 10.0958 70.2682 11.447C69.4995 12.7982 69.1164 14.328 69.1164 16.0341C69.1164 17.7401 69.4949 19.1689 70.252 20.5225C71.009 21.8737 72.0471 22.9335 73.3685 23.6973C74.6899 24.461 76.1646 24.844 77.7902 24.844C80.3424 24.844 82.6113 24.0474 84.5991 22.4518V22.4471Z" fill="white"/>
      <path d="M109.401 27.8449C109.288 27.9483 109.097 28 108.826 28H106.928C106.657 28 106.466 27.9483 106.352 27.8449C106.238 27.7415 106.183 27.5418 106.183 27.2457V17.6814C106.183 17.5451 106.155 17.4464 106.099 17.39C106.043 17.3336 105.934 17.3054 105.776 17.3054H94.562C94.4041 17.3054 94.2972 17.3336 94.2392 17.39C94.1834 17.4464 94.1556 17.5451 94.1556 17.6814V27.2457C94.1556 27.5441 94.0998 27.7439 93.986 27.8449C93.8722 27.9483 93.6818 28 93.4101 28H91.5128C91.2411 28 91.0507 27.9483 90.9369 27.8449C90.8231 27.7415 90.7673 27.5418 90.7673 27.2457V4.75433C90.7673 4.45824 90.8231 4.25614 90.9369 4.1551C91.0483 4.0517 91.2411 4 91.5105 4H93.4078C93.6795 4 93.8723 4.0517 93.9837 4.1551C94.0975 4.25849 94.1532 4.45824 94.1532 4.75433V13.6677C94.1532 13.804 94.1811 13.9074 94.2369 13.9755C94.2926 14.0437 94.3994 14.0789 94.5596 14.0789H105.774C105.932 14.0789 106.039 14.0437 106.097 13.9755C106.153 13.9074 106.18 13.804 106.18 13.6677V4.75433C106.18 4.45824 106.236 4.25614 106.35 4.1551C106.464 4.0517 106.657 4 106.928 4H108.826C109.095 4 109.288 4.0517 109.401 4.1551C109.515 4.25849 109.571 4.45824 109.571 4.75433V27.2457C109.571 27.5441 109.515 27.7439 109.401 27.8449Z" fill="white"/>
      <path d="M164.252 4.1504C164.366 4.04935 164.558 4 164.828 4H166.725C166.997 4 167.189 4.04935 167.301 4.1504C167.415 4.24909 167.47 4.44414 167.47 4.73318V26.9049C167.47 27.6358 167.245 28.0023 166.792 28.0023C166.611 28.0023 166.421 27.9295 166.216 27.7862C166.012 27.6428 165.731 27.3702 165.369 26.9707L151.614 11.0498V26.9049C151.614 27.194 151.558 27.3867 151.444 27.4877C151.33 27.5864 151.14 27.6381 150.868 27.6381H148.971C148.699 27.6381 148.509 27.5888 148.395 27.4877C148.281 27.389 148.226 27.194 148.226 26.9049V5.09742C148.226 4.72143 148.281 4.44414 148.395 4.26554C148.509 4.0893 148.69 4 148.939 4C149.12 4 149.31 4.07285 149.514 4.2162C149.719 4.35954 149.988 4.63214 150.327 5.03163L164.082 20.9525V4.73083C164.082 4.44414 164.138 4.24909 164.252 4.14805V4.1504Z" fill="white"/>
      <path d="M143.732 18.7083C143.72 18.6519 143.704 18.4944 143.699 18.4193C143.704 18.4357 143.73 18.6754 143.732 18.7083Z" fill="#DC5F40"/>
      <path d="M141.613 11.08C142.698 10.9602 143.483 9.9732 143.364 8.87342C143.246 7.776 142.27 6.98171 141.184 7.10156C140.099 7.22141 139.314 8.20839 139.433 9.30816C139.551 10.4056 140.526 11.1999 141.613 11.08Z" fill="#DC5F40"/>
      <path d="M143.857 20.6254C143.943 16.1699 142.092 10.7674 137.252 13.8364C136.846 13.9962 136.614 13.9398 136.4 13.6343C135.789 12.5158 135.32 11.3713 134.739 10.1964C130.371 -1.17501 125.383 5.32729 120.114 12.0575C108.347 27.4497 113.89 34.2669 132.438 20.75C133.086 20.2847 134.384 19.3118 134.851 19.2719C135.343 19.192 135.548 19.5962 135.919 20.4421C136.279 21.3093 136.878 22.5383 137.426 23.4148C140.592 29.6304 144.098 28.1899 143.859 20.6513V20.6254H143.857ZM129.909 18.3084C127.575 19.7842 125.36 21.5913 122.796 22.6699C121.679 23.1422 120.051 22.6205 119.649 21.7064C119.194 20.2894 120.822 18.2003 121.621 16.7292C122.547 15.0537 123.776 13.5638 124.953 12.0458C126.096 10.5489 127.647 8.32817 129.798 9.2987C131.523 10.2904 132.231 13.0328 133.218 14.6871C133.664 15.4039 133.65 15.9114 132.87 16.3438C131.925 16.9525 130.901 17.6457 129.928 18.299L129.909 18.3107V18.3084ZM142.556 21.2435C142.505 22.0965 142.345 25.323 141.27 23.7861C140.271 21.8874 139.175 19.521 138.197 17.4977C137.817 16.4637 140.192 16.0454 140.81 16.2216C142.535 16.8655 142.596 19.6197 142.556 21.2294V21.2458V21.2435Z" fill="#DC5F40"/>
    </svg>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
      {children}
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: T.muted, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.05)",
  border: `1px solid ${T.border}`, borderRadius: 7, color: T.text,
  fontSize: 13, fontFamily: "'Montserrat',sans-serif", outline: "none",
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function Select({ children, ...props }) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>;
}

function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 80, ...(props.style || {}) }} />;
}

function Btn({ variant = "primary", children, ...props }) {
  const styles = {
    primary: { background: `linear-gradient(135deg,${T.accent},#6d28d9)`, color: "#fff", border: "none" },
    secondary: { background: T.bgCard, color: T.text, border: `1px solid ${T.border}` },
    success: { background: `linear-gradient(135deg,${T.success},#059669)`, color: "#fff", border: "none" },
  };
  return (
    <button {...props} style={{
      padding: "8px 18px", borderRadius: 7, fontSize: 12, fontWeight: 600,
      fontFamily: "'Montserrat',sans-serif", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.2s",
      ...styles[variant], ...(props.style || {})
    }}>
      {children}
    </button>
  );
}

function ModuleCheck({ label, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
      background: checked ? T.accentBg : "rgba(255,255,255,0.03)",
      border: `1px solid ${checked ? T.borderAcc : T.border}`,
      borderRadius: 7, cursor: "pointer", transition: "all 0.15s",
      fontSize: 12, color: checked ? T.text : T.muted
    }}>
      <div style={{
        width: 16, height: 16, border: `1.5px solid ${checked ? T.accent : T.border}`,
        borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, flexShrink: 0, background: checked ? T.accent : "transparent", color: "#fff"
      }}>
        {checked && "\u2713"}
      </div>
      <span>{label}</span>
    </div>
  );
}

function PriceRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: color || T.text }}>{value}</span>
    </div>
  );
}

function PricingCalculatorView() {
  const [modules, setModules] = useState({
    "Source-to-Pay": true, "e-Sourcing": true, "Contract Management": false,
    "Supplier Portal": false, "Spend Analytics": false, "Invoice Automation": false,
    "Catalog Management": false, "AP Automation": false,
  });
  const [companyName, setCompanyName] = useState("");
  const [spend, setSpend] = useState("");
  const [duration, setDuration] = useState("3");
  const [region, setRegion] = useState("India");

  const selectedModules = Object.entries(modules).filter(([, v]) => v).map(([k]) => k);
  const modulePrice = {
    "Source-to-Pay": 80000, "e-Sourcing": 60000, "Contract Management": 55000,
    "Supplier Portal": 35000, "Spend Analytics": 45000, "Invoice Automation": 40000,
    "Catalog Management": 30000, "AP Automation": 50000,
  };

  const baseFee = 120000;
  const modulesTotal = selectedModules.reduce((sum, m) => sum + (modulePrice[m] || 0), 0);
  const implementation = 45000;
  const spendNum = parseFloat(spend.replace(/[^0-9.]/g, "")) || 0;
  const volumeDiscount = spendNum >= 1e9 ? 15000 : spendNum >= 500e6 ? 8000 : 0;
  const year1 = baseFee + modulesTotal + implementation - volumeDiscount;
  const escalation = 0.10;
  const years = parseInt(duration) || 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <SectionTitle>Client Information</SectionTitle>
          <FormGroup label="Company Name">
            <Input placeholder="e.g. Tata Steel" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </FormGroup>
          <FormGroup label="Annual Procurement Spend">
            <Input placeholder="e.g. $2,000,000,000" value={spend} onChange={e => setSpend(e.target.value)} />
          </FormGroup>
          <FormGroup label="Contract Duration">
            <Select value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="1">1 Year</option>
              <option value="3">3 Years</option>
              <option value="5">5 Years</option>
            </Select>
          </FormGroup>
          <FormGroup label="Region">
            <Select value={region} onChange={e => setRegion(e.target.value)}>
              <option>India</option>
              <option>Middle East (GCCC)</option>
              <option>Southeast Asia</option>
              <option>Global</option>
            </Select>
          </FormGroup>
        </Card>
        <Card>
          <SectionTitle>Modules</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(modules).map(([name, checked]) => (
              <ModuleCheck key={name} label={name} checked={checked}
                onToggle={() => setModules(prev => ({ ...prev, [name]: !prev[name] }))} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Pricing Breakdown</div>
        <PriceRow label="Base Platform Fee" value={`$${baseFee.toLocaleString()}`} />
        {selectedModules.map(m => (
          <PriceRow key={m} label={`${m} Module`} value={`$${(modulePrice[m] || 0).toLocaleString()}`} />
        ))}
        <PriceRow label="Implementation & Onboarding" value={`$${implementation.toLocaleString()}`} />
        {volumeDiscount > 0 && (
          <PriceRow label={`Volume Discount (spend > $${spendNum >= 1e9 ? "1B" : "500M"})`} value={`-$${volumeDiscount.toLocaleString()}`} color={T.success} />
        )}

        <div style={{ marginTop: 16, padding: 16, background: T.accentBg, border: `1px solid ${T.borderAcc}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Year 1 Total</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono',monospace" }}>${year1.toLocaleString()}</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 12 }}>
          <thead>
            <tr>
              {["Year", "License", "Escalation", "Total"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: T.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: years }, (_, i) => {
              const yearTotal = Math.round(year1 * Math.pow(1 + escalation, i));
              return (
                <tr key={i}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace" }}>Year {i + 1}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace" }}>${year1.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace", color: i === 0 ? T.muted : T.warn }}>{i === 0 ? "\u2014" : `+${(escalation * 100).toFixed(0)}%`}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>${yearTotal.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary"><Download size={12} /> Export CSV</Btn>
          <Btn variant="primary"><ChevronRight size={12} /> Generate Proposal</Btn>
        </div>
      </Card>
    </div>
  );
}

const PROPOSAL_TYPES = [
  { id: "internal-briefing", label: "Internal Briefing Talk", description: "Generate an internal briefing document for team alignment and stakeholder updates", icon: "\uD83D\uDCCB" },
  { id: "customer-technical", label: "Customer Technical Proposal", description: "Technical solution proposal with architecture, integration details, and implementation plan", icon: "\uD83D\uDD27" },
  { id: "customer-commercial", label: "Customer Technical & Commercial Proposal", description: "Full proposal combining technical solution with pricing, terms, and commercial structure", icon: "\uD83D\uDCC4" },
];

function ProposalTypeSelector({ onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Create a Proposal</div>
        <div style={{ color: T.muted, fontSize: 13 }}>Select the type of proposal you want to generate. Claude will create the output based on your inputs and configured instructions.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {PROPOSAL_TYPES.map(type => (
          <div key={type.id} onClick={() => onSelect(type)} style={{
            background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: 24, cursor: "pointer", transition: "all 0.2s",
            display: "flex", flexDirection: "column", gap: 12
          }} className="list-row">
            <div style={{ fontSize: 28 }}>{type.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{type.label}</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{type.description}</div>
            <div style={{ marginTop: "auto", paddingTop: 12 }}>
              <Btn variant="primary" style={{ fontSize: 11, padding: "6px 14px" }}>
                <Plus size={12} /> Create
              </Btn>
            </div>
          </div>
        ))}
      </div>
      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Layers size={16} color={T.accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Manage Proposal Types</div>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>Add custom proposal types with tailored Claude instructions for your specific needs</div>
        </div>
        <Btn variant="secondary" style={{ fontSize: 11, padding: "6px 14px" }}>
          <Plus size={12} /> Add Type
        </Btn>
      </Card>
    </div>
  );
}

function ProposalGeneratorView() {
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(1);

  if (!selectedType) {
    return <ProposalTypeSelector onSelect={(type) => { setSelectedType(type); setStep(1); }} />;
  }

  const stepLabels = ["Input & Context", "Configure", "Generate", "Review & Export"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setSelectedType(null); setStep(1); }} style={{
          background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 7,
          padding: "6px 12px", color: T.muted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4
        }}>
          \u2190 Back
        </button>
        <span style={{ fontSize: 13, color: T.muted }}>Creating:</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedType.label}</span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {stepLabels.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
            background: step === i + 1 ? T.accentBg : step > i + 1 ? "rgba(16,185,129,0.1)" : T.bgCard,
            border: `1px solid ${step === i + 1 ? T.borderAcc : step > i + 1 ? "rgba(16,185,129,0.3)" : T.border}`,
            borderRadius: 8, fontSize: 12, color: step === i + 1 ? T.text : step > i + 1 ? T.success : T.muted,
            fontWeight: step === i + 1 ? 600 : 400
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: step === i + 1 ? T.accent : step > i + 1 ? T.success : T.bgHover,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff"
            }}>
              {step > i + 1 ? "\u2713" : i + 1}
            </div>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <SectionTitle>Client Details</SectionTitle>
            <FormGroup label="Company / Recipient Name"><Input placeholder="e.g. Tata Steel" /></FormGroup>
            <FormGroup label="Contact Person"><Input placeholder="e.g. Rajesh Kumar" /></FormGroup>
            <FormGroup label="Title / Designation"><Input placeholder="e.g. VP Procurement" /></FormGroup>
            <FormGroup label="Industry">
              <Select>
                <option>Manufacturing</option><option>FMCG</option><option>Pharma</option>
                <option>Oil & Gas</option><option>Metals & Mining</option><option>Automotive</option>
                <option>Technology</option><option>Other</option>
              </Select>
            </FormGroup>
          </Card>
          <Card>
            <SectionTitle>Input & Context</SectionTitle>
            <FormGroup label="Paste context, notes, or brief">
              <TextArea placeholder="Paste any relevant context here \u2014 meeting notes, email threads, RFP requirements, technical specs, etc. This will be used by Claude to generate the proposal." style={{ minHeight: 120 }} />
            </FormGroup>
            <FormGroup label="Attachments">
              <div style={{
                border: `2px dashed ${T.border}`, borderRadius: 8, padding: 24,
                textAlign: "center", color: T.muted, fontSize: 12, cursor: "pointer"
              }}>
                <Upload size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div>Drop files here or click to upload</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>PDF, DOCX, TXT, images \u2014 up to 10MB each</div>
              </div>
            </FormGroup>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <SectionTitle>Proposal Configuration</SectionTitle>
            <FormGroup label="Proposal Template">
              <Select><option>Standard Enterprise</option><option>GCCC / Government</option><option>Mid-Market</option><option>Custom</option></Select>
            </FormGroup>
            <FormGroup label="Tone">
              <Select><option>Professional / Formal</option><option>Consultative</option><option>Technical</option><option>Executive Summary</option></Select>
            </FormGroup>
            <FormGroup label="Output Length">
              <Select><option>Concise (1-2 pages)</option><option>Standard (3-5 pages)</option><option>Detailed (6-10 pages)</option><option>Comprehensive (10+ pages)</option></Select>
            </FormGroup>
            {selectedType.id !== "internal-briefing" && (
              <FormGroup label="Payment Terms">
                <Select><option>Annual Upfront</option><option>Quarterly</option><option>Monthly</option><option>Custom</option></Select>
              </FormGroup>
            )}
          </Card>
          <Card>
            <SectionTitle>Additional Instructions</SectionTitle>
            <FormGroup label="Special instructions for Claude">
              <TextArea placeholder="e.g. Include 90-day pilot clause, reference GCCC compliance, emphasize ROI for CFO audience..." style={{ minHeight: 140 }} />
            </FormGroup>
            <FormGroup label="Sections to include">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Executive Summary", "Solution Overview", "Technical Architecture", "Implementation Timeline", "Pricing & Commercial Terms", "Case Studies & References", "Terms & Conditions"].map(section => (
                  <ModuleCheck key={section} label={section} checked={true} onToggle={() => {}} />
                ))}
              </div>
            </FormGroup>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Layers size={28} color={T.accent} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ready to Generate</div>
          <div style={{ color: T.muted, fontSize: 13, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Claude will process your inputs and generate a {selectedType.label.toLowerCase()} tailored to your specifications.
          </div>
          <Btn variant="primary" style={{ padding: "12px 32px", fontSize: 14 }}>
            <Calculator size={16} /> Generate Proposal
          </Btn>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <SectionTitle>Proposal Preview</SectionTitle>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ textAlign: "center", paddingBottom: 20, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Aerchain Proposal</div>
              <div style={{ color: T.muted, fontSize: 12 }}>Prepared for [Company] \u00B7 March 2026</div>
            </div>
            <div style={{ padding: "16px 0", fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
              <p style={{ color: T.text, fontWeight: 600, marginBottom: 12 }}>Dear [Contact],</p>
              <p style={{ marginBottom: 12 }}>Thank you for your interest in Aerchain&#39;s procurement intelligence platform. Based on our discussions, we are pleased to present this proposal.</p>
              <p style={{ color: T.muted, fontSize: 11, fontStyle: "italic" }}>[ Generated proposal content will appear here ]</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <Btn variant="secondary"><Copy size={12} /> Copy Text</Btn>
            <Btn variant="secondary"><Download size={12} /> Export PDF</Btn>
            <Btn variant="success"><Send size={12} /> Send via Email</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={() => setStep(Math.max(1, step - 1))} style={{ opacity: step === 1 ? 0.4 : 1 }}>
          \u2190 Previous
        </Btn>
        <Btn variant="primary" onClick={() => setStep(Math.min(4, step + 1))} style={{ opacity: step === 4 ? 0.4 : 1 }}>
          Next \u2192
        </Btn>
      </div>
    </div>
  );
}

export default function App({ appName = "Pricing & Proposals" }) {
  const [selected, setSelected] = useState("pricing-calculator");

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #0d0a1e; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      .list-row:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(139,92,246,0.3) !important; }
      select option { background: #1a1530; }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const currentModule = MODULES.find(m => m.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, fontFamily: "'Montserrat',sans-serif", color: T.text, overflow: "hidden" }}>

      {/* TOPBAR */}
      <div style={{ height: 56, background: T.topbar, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(20px)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AerchainLogo height={18} />
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            padding: "3px 9px", background: "hsl(262 60% 50% / .12)", border: "1px solid hsl(262 60% 50% / .18)", borderRadius: 6
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, boxShadow: `0 0 6px ${T.accent}`, display: "inline-block" }} />
            {appName}
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <div style={{ width: 220, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
            <div style={{ color: T.muted, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "6px 8px 4px" }}>WORKSPACE</div>
            {MODULES.map(mod => {
              const isSel = selected === mod.id;
              return (
                <div key={mod.id} onClick={() => setSelected(mod.id)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7,
                  background: isSel ? T.bgActive : "transparent",
                  border: isSel ? `1px solid ${T.borderAcc}` : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.15s", marginBottom: 2
                }}>
                  <mod.Icon size={14} color={isSel ? T.accent : T.muted} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: isSel ? 600 : 400, color: isSel ? T.text : T.muted }}>{mod.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.muted }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace" }}>Aerchain \u00B7 $6M ARR</div>
            <div style={{ marginTop: 2 }}>$20B+ spend managed</div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {currentModule && <currentModule.Icon size={15} color={T.accent} />}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{currentModule?.label}</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              {selected === "pricing-calculator" && <PricingCalculatorView />}
              {selected === "proposal-generator" && <ProposalGeneratorView />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
