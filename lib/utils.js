export function extractJSON(text) {
  if (!text) return null;
  const t = text.trim();
  if (t.startsWith("{")) { try { return JSON.parse(t); } catch {} }
  const cb = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) { try { return JSON.parse(cb[1].trim()); } catch {} }
  let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "{") { if (depth === 0) start = i; depth++; }
    else if (t[i] === "}") { depth--; if (depth === 0 && start !== -1) {
      try { return JSON.parse(t.slice(start, i + 1)); } catch { break; }
    }}
  }
  return null;
}

export function isStale(lastSynced, hrs = 4) {
  if (!lastSynced) return true;
  return (Date.now() - new Date(lastSynced).getTime()) / 3600000 > hrs;
}

export function safePersist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn(`localStorage write failed for "${key}":`, e.message); }
}

export function timeAgo(date) {
  if (!date) return "Never";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmt$(n) {
  if (!n || isNaN(n)) return "$—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
