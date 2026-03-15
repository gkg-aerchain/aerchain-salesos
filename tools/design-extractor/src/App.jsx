import React, { useState, useRef, useCallback } from 'react';
import { generateHTML, generateMarkdown, generateJSON, generateReactTheme } from './lib/generators.js';

const TABS = ['HTML', 'Markdown', 'JSON', 'React'];

export default function App() {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [outputs, setOutputs] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [usage, setUsage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExtract = async () => {
    if (!textInput.trim() && files.length === 0) {
      setError('Please upload files or enter a text description.');
      return;
    }
    setLoading(true);
    setError(null);
    setTokens(null);
    setOutputs(null);

    try {
      const formData = new FormData();
      formData.append('text', textInput);
      formData.append('model', model);
      files.forEach(f => formData.append('files', f));

      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Extraction failed');
      }

      setTokens(data.tokens);
      setUsage(data.usage);
      setOutputs({
        html: generateHTML(data.tokens),
        markdown: generateMarkdown(data.tokens),
        json: generateJSON(data.tokens),
        react: generateReactTheme(data.tokens),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    if (!outputs) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const name = tokens?.meta?.name?.replace(/\s+/g, '-').toLowerCase() || 'design-system';
    zip.file(`${name}-styleguide.html`, outputs.html);
    zip.file(`${name}-spec.md`, outputs.markdown);
    zip.file(`${name}-tokens.json`, outputs.json);
    zip.file(`${name}-theme.jsx`, outputs.react);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-design-system.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const outputKeys = ['html', 'markdown', 'json', 'react'];
  const extensions = { html: '.html', markdown: '.md', json: '.json', react: '.jsx' };
  const currentOutput = outputs ? outputs[outputKeys[activeTab]] : '';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>&#9670;</span> Design Extractor
          </h1>
          <p style={styles.subtitle}>Upload any design input — get a complete design system</p>
        </div>
      </header>

      <main style={styles.main}>
        {/* Input Section */}
        <section style={styles.inputSection}>
          <div style={styles.row}>
            {/* Drop Zone */}
            <div
              style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}) }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.html,.css,.json,.md,.txt,.pdf,.figma"
              />
              <div style={styles.dropIcon}>&#8683;</div>
              <p style={styles.dropText}>Drop files here or click to browse</p>
              <p style={styles.dropHint}>Images, HTML, CSS, JSON, Markdown, PDF</p>
            </div>

            {/* Text Input */}
            <div style={styles.textArea}>
              <label style={styles.label}>Text Description</label>
              <textarea
                style={styles.textarea}
                placeholder="Describe the design: e.g. 'Dark theme with neon green accents, rounded cards, monospace typography...'"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div style={styles.fileList}>
              {files.map((f, i) => (
                <span key={i} style={styles.fileChip}>
                  {f.name}
                  <button style={styles.fileRemove} onClick={() => removeFile(i)}>&times;</button>
                </span>
              ))}
            </div>
          )}

          {/* Controls */}
          <div style={styles.controls}>
            <div style={styles.modelSelect}>
              <label style={styles.label}>Model</label>
              <select style={styles.select} value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="claude-opus-4-20250514">Claude Opus 4</option>
                <option value="claude-haiku-4-20250514">Claude Haiku 4</option>
              </select>
            </div>
            <button
              style={{ ...styles.extractBtn, ...(loading ? styles.extractBtnDisabled : {}) }}
              onClick={handleExtract}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.spinner}>&#8635; Extracting...</span>
              ) : (
                'Extract Design System'
              )}
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </section>

        {/* Output Section */}
        {outputs && (
          <section style={styles.outputSection}>
            <div style={styles.outputHeader}>
              <h2 style={styles.outputTitle}>
                {tokens?.meta?.name || 'Design System'}
              </h2>
              {usage && (
                <span style={styles.usageBadge}>
                  {usage.input_tokens + usage.output_tokens} tokens
                </span>
              )}
              <button style={styles.zipBtn} onClick={downloadZip}>
                &#8681; Download ZIP
              </button>
            </div>

            {tokens?.meta?.description && (
              <p style={styles.outputDesc}>{tokens.meta.description}</p>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  style={{ ...styles.tab, ...(activeTab === i ? styles.tabActive : {}) }}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Actions */}
            <div style={styles.tabActions}>
              <button
                style={styles.actionBtn}
                onClick={() => copyToClipboard(currentOutput)}
              >
                Copy
              </button>
              <button
                style={styles.actionBtn}
                onClick={() => {
                  const name = tokens?.meta?.name?.replace(/\s+/g, '-').toLowerCase() || 'design-system';
                  downloadFile(currentOutput, `${name}${extensions[outputKeys[activeTab]]}`);
                }}
              >
                Download
              </button>
              {activeTab === 0 && (
                <button
                  style={styles.actionBtn}
                  onClick={() => {
                    const w = window.open('', '_blank');
                    w.document.write(currentOutput);
                    w.document.close();
                  }}
                >
                  Preview
                </button>
              )}
            </div>

            {/* Output Content */}
            <div style={styles.outputContent}>
              <pre style={styles.pre}>{currentOutput}</pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#FAFAFA',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#1F2937',
  },
  header: {
    background: 'linear-gradient(135deg, #7B2FF2 0%, #22D1EE 100%)',
    padding: '32px 0 28px',
  },
  headerInner: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 24px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  titleIcon: {
    marginRight: 8,
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    margin: '6px 0 0',
    fontWeight: 500,
  },
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px',
  },
  inputSection: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    border: '1px solid #F0F0F0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    marginBottom: 24,
  },
  row: {
    display: 'flex',
    gap: 20,
    marginBottom: 16,
  },
  dropZone: {
    flex: 1,
    border: '2px dashed #DDD6FE',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#FAF5FF',
  },
  dropZoneActive: {
    borderColor: '#8B5CF6',
    background: '#F3F0FF',
  },
  dropIcon: {
    fontSize: 32,
    color: '#8B5CF6',
    marginBottom: 8,
  },
  dropText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 4px',
  },
  dropHint: {
    fontSize: 12,
    color: '#9CA3AF',
    margin: 0,
  },
  textArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#6B7280',
    marginBottom: 6,
  },
  textarea: {
    flex: 1,
    border: '1.5px solid #F0F0F0',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    resize: 'none',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  fileList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fileChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#F3F0FF',
    border: '1px solid #DDD6FE',
    borderRadius: 100,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: '#7C3AED',
  },
  fileRemove: {
    background: 'none',
    border: 'none',
    color: '#7C3AED',
    fontSize: 16,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  controls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
  },
  modelSelect: {
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
    border: '1.5px solid #F0F0F0',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    background: '#fff',
    cursor: 'pointer',
  },
  extractBtn: {
    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    color: '#fff',
    border: 'none',
    borderRadius: 100,
    padding: '12px 32px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
    transition: 'all 0.2s',
  },
  extractBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  error: {
    marginTop: 16,
    padding: '10px 16px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 12,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 500,
  },
  outputSection: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    border: '1px solid #F0F0F0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  outputHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  outputTitle: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  usageBadge: {
    fontSize: 11,
    fontWeight: 600,
    background: '#F3F0FF',
    color: '#7C3AED',
    padding: '3px 10px',
    borderRadius: 100,
    border: '1px solid #DDD6FE',
  },
  zipBtn: {
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #10B981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 100,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  outputDesc: {
    fontSize: 13,
    color: '#6B7280',
    margin: '0 0 16px',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
    borderBottom: '1px solid #F0F0F0',
    paddingBottom: 0,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#9CA3AF',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#8B5CF6',
    borderBottomColor: '#8B5CF6',
  },
  tabActions: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    background: '#fff',
    border: '1.5px solid #F0F0F0',
    borderRadius: 100,
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#1F2937',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  outputContent: {
    background: '#FAFAFA',
    borderRadius: 12,
    border: '1px solid #F0F0F0',
    maxHeight: 500,
    overflow: 'auto',
  },
  pre: {
    margin: 0,
    padding: 16,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};
