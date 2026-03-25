import { useState, useRef, useEffect, useCallback } from "react";
import { Settings, MessageSquare, Save, RotateCcw, Send, ChevronRight, ChevronDown, Check, X, Eye, Edit3, Loader } from "lucide-react";
import { T } from "../lib/theme.js";

// ─── Pricing Logic Editor + AI Chat Panel ──────────────────────────────────
// Two modes: Direct markdown editing OR AI-assisted modification
// Reads/writes pricing-logic.md as the single source of truth

const STORAGE_KEY = "aerchain-pricing-logic";
const CHAT_STORAGE_KEY = "aerchain-pricing-chat";

/** Load pricing logic from localStorage (persisted across sessions) */
function loadLogic() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch { /* ignore */ }
  return null;
}

/** Save pricing logic to localStorage */
function saveLogic(content) {
  try {
    localStorage.setItem(STORAGE_KEY, content);
  } catch { /* ignore */ }
}

/** Load chat history */
function loadChat() {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

/** Save chat history */
function saveChat(messages) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50))); // keep last 50
  } catch { /* ignore */ }
}


export default function PricingLogicEditor({ defaultLogic, onLogicChange, onProcessWithClaude }) {
  const [logic, setLogic] = useState(() => loadLogic() || defaultLogic || "");
  const [originalLogic] = useState(defaultLogic || "");
  const [editing, setEditing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(() => loadChat());
  const [chatProcessing, setChatProcessing] = useState(false);
  const [pendingDiff, setPendingDiff] = useState(null);
  const [saved, setSaved] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  const editorRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Notify parent when logic changes
  useEffect(() => {
    if (onLogicChange) onLogicChange(logic);
  }, [logic, onLogicChange]);

  const handleSave = useCallback(() => {
    saveLogic(logic);
    setSaved(true);
    if (onLogicChange) onLogicChange(logic);
  }, [logic, onLogicChange]);

  const handleReset = useCallback(() => {
    if (window.confirm("Reset pricing logic to default? This cannot be undone.")) {
      setLogic(originalLogic);
      saveLogic(originalLogic);
      setSaved(true);
    }
  }, [originalLogic]);

  const handleEditorChange = useCallback((e) => {
    setLogic(e.target.value);
    setSaved(false);
  }, []);

  // ─── AI Chat ──────────────────────────────────────────────────────────
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatProcessing) return;

    const userMsg = { role: "user", content: chatInput.trim(), ts: Date.now() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatProcessing(true);

    try {
      // Build the prompt for Claude — ask it to modify pricing logic
      const prompt = [
        "You are modifying the Aerchain pricing logic configuration.",
        "Below is the CURRENT pricing logic (in markdown):",
        "",
        "```markdown",
        logic,
        "```",
        "",
        "The user wants to make this change:",
        `"${userMsg.content}"`,
        "",
        "Return ONLY the modified markdown — the COMPLETE updated pricing-logic.md content.",
        "Do NOT include ```markdown fences in your response.",
        "Do NOT explain what you changed — just return the updated markdown.",
        "If the request is unclear, return the original unchanged with a comment at the top: <!-- UNCLEAR: [explanation] -->"
      ].join("\n");

      if (onProcessWithClaude) {
        const result = await onProcessWithClaude(prompt, "pricing-logic-edit");
        if (result && typeof result === "string") {
          // Clean up any markdown fences Claude might add
          let cleaned = result.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:markdown)?\n?/, "").replace(/\n?```$/, "");
          }

          setPendingDiff(cleaned);
          const assistantMsg = {
            role: "assistant",
            content: "I've prepared the updated pricing logic. Review the changes below and accept or reject.",
            ts: Date.now(),
            hasDiff: true,
          };
          const updated = [...newMessages, assistantMsg];
          setChatMessages(updated);
          saveChat(updated);
        } else {
          throw new Error("No response from Claude");
        }
      } else {
        // Fallback — no Claude available
        const assistantMsg = {
          role: "assistant",
          content: "Claude API is not connected. Please edit the pricing logic directly using the editor.",
          ts: Date.now(),
        };
        const updated = [...newMessages, assistantMsg];
        setChatMessages(updated);
        saveChat(updated);
      }
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: `Error: ${err.message || "Failed to process request"}. Try editing the logic directly.`,
        ts: Date.now(),
        isError: true,
      };
      const updated = [...newMessages, errorMsg];
      setChatMessages(updated);
      saveChat(updated);
    } finally {
      setChatProcessing(false);
    }
  }, [chatInput, chatMessages, chatProcessing, logic, onProcessWithClaude]);

  const acceptDiff = useCallback(() => {
    if (pendingDiff) {
      setLogic(pendingDiff);
      saveLogic(pendingDiff);
      setPendingDiff(null);
      setSaved(true);

      const msg = { role: "system", content: "Changes accepted and saved.", ts: Date.now() };
      const updated = [...chatMessages, msg];
      setChatMessages(updated);
      saveChat(updated);
    }
  }, [pendingDiff, chatMessages]);

  const rejectDiff = useCallback(() => {
    setPendingDiff(null);
    const msg = { role: "system", content: "Changes rejected. Pricing logic unchanged.", ts: Date.now() };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveChat(updated);
  }, [chatMessages]);

  // ─── Render ───────────────────────────────────────────────────────────
  const headerStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", cursor: "pointer", userSelect: "none",
    borderBottom: collapsed ? "none" : `1px solid ${T.border}`,
  };

  const btnStyle = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
    background: active ? T.accent : "transparent",
    color: active ? "#fff" : T.muted,
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div style={{
      background: T.bgCard, borderRadius: 10,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={headerStyle} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {collapsed ? <ChevronRight size={14} color={T.muted} /> : <ChevronDown size={14} color={T.muted} />}
          <Settings size={14} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Pricing Logic</span>
          {!saved && <span style={{ fontSize: 10, color: T.warn, fontWeight: 500 }}>unsaved</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          <button style={btnStyle(chatOpen)} onClick={() => { setChatOpen(!chatOpen); setCollapsed(false); }}>
            <MessageSquare size={11} /> AI Chat
          </button>
          <button style={btnStyle(editing)} onClick={() => { setEditing(!editing); setCollapsed(false); }}>
            {editing ? <Eye size={11} /> : <Edit3 size={11} />}
            {editing ? "Preview" : "Edit"}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ display: "flex", minHeight: 400, maxHeight: 600 }}>
          {/* Editor / Preview Panel */}
          <div style={{
            flex: chatOpen ? "1 1 55%" : "1 1 100%",
            display: "flex", flexDirection: "column",
            borderRight: chatOpen ? `1px solid ${T.border}` : "none",
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex", gap: 6, padding: "8px 12px",
              borderBottom: `1px solid ${T.border}`,
              background: T.bg,
            }}>
              <button style={btnStyle(false)} onClick={handleSave} disabled={saved}>
                <Save size={11} /> {saved ? "Saved" : "Save"}
              </button>
              <button style={btnStyle(false)} onClick={handleReset}>
                <RotateCcw size={11} /> Reset
              </button>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: T.muted, alignSelf: "center" }}>
                {logic.split("\n").length} lines
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
              {editing ? (
                <textarea
                  ref={editorRef}
                  value={logic}
                  onChange={handleEditorChange}
                  spellCheck={false}
                  style={{
                    width: "100%", height: "100%", resize: "none",
                    padding: 16, border: "none", outline: "none",
                    background: "transparent", color: T.text,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: 11.5, lineHeight: 1.6, tabSize: 2,
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <div style={{
                  padding: 16, fontSize: 12, lineHeight: 1.7,
                  color: T.text, whiteSpace: "pre-wrap",
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: 11.5,
                }}>
                  {logic || "No pricing logic loaded. Click Edit to add content."}
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Panel */}
          {chatOpen && (
            <div style={{
              flex: "1 1 45%", display: "flex", flexDirection: "column",
              background: T.bg,
            }}>
              {/* Chat Header */}
              <div style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <MessageSquare size={12} color={T.accent} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Modify with AI</span>
              </div>

              {/* Chat Messages */}
              <div style={{
                flex: 1, overflow: "auto", padding: 12,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {chatMessages.length === 0 && (
                  <div style={{ color: T.muted, fontSize: 11, textAlign: "center", padding: 20, lineHeight: 1.6 }}>
                    Ask Claude to modify the pricing logic.<br />
                    <span style={{ fontSize: 10 }}>
                      e.g. "Reduce strategic sourcing per-txn cost to $40"<br />
                      or "Add a $2B spend tier at $1.4M"
                    </span>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}>
                    <div style={{
                      padding: "8px 12px", borderRadius: 10,
                      background: msg.role === "user" ? T.accent
                        : msg.role === "system" ? `${T.success}22`
                        : msg.isError ? `${T.error}22`
                        : T.bgCard,
                      color: msg.role === "user" ? "#fff"
                        : msg.isError ? T.error
                        : T.text,
                      fontSize: 11, lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>

                    {/* Accept/Reject buttons for diffs */}
                    {msg.hasDiff && pendingDiff && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={acceptDiff} style={{
                          ...btnStyle(false),
                          borderColor: T.success, color: T.success,
                        }}>
                          <Check size={11} /> Accept
                        </button>
                        <button onClick={rejectDiff} style={{
                          ...btnStyle(false),
                          borderColor: T.error, color: T.error,
                        }}>
                          <X size={11} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {chatProcessing && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 12px", color: T.muted, fontSize: 11,
                  }}>
                    <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                    Processing...
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{
                padding: 10, borderTop: `1px solid ${T.border}`,
                display: "flex", gap: 6,
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChatSend()}
                  placeholder="Describe the change you want..."
                  disabled={chatProcessing}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: T.bgCard,
                    color: T.text, fontSize: 11, outline: "none",
                  }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatProcessing || !chatInput.trim()}
                  style={{
                    ...btnStyle(!chatProcessing && chatInput.trim()),
                    padding: "8px 12px",
                    opacity: chatProcessing || !chatInput.trim() ? 0.5 : 1,
                  }}
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spin animation for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
