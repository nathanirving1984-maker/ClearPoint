import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeDeal, markMilestoneDone, saveNotes, subscribeMessages, sendMessage } from '../data/dealsApi';
import { uploadDocument } from '../data/filesApi';
import { DOC_TEMPLATE, contactsFor } from '../data/defaultDeals';

function pct(d) { return Math.round(d.milestones.filter((m) => m.done).length / d.milestones.length * 100); }
function activeIdx(d) { const i = d.milestones.findIndex((m) => !m.done); return i === -1 ? d.milestones.length - 1 : i; }

export default function AgentDeal() {
  const { txnId } = useParams();
  const [deal, setDeal] = useState(null);
  const [tab, setTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [toast, setToast] = useState('');
  const [uploading, setUploading] = useState(null);

  useEffect(() => subscribeDeal(txnId, (d) => { setDeal(d); if (d) setNotes(d.notes); }), [txnId]);
  useEffect(() => subscribeMessages(txnId, setMsgs), [txnId]);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  if (!deal) return <div>Loading…</div>;
  const idx = activeIdx(deal);

  async function markDone(i) { await markMilestoneDone(txnId, i); flash('Milestone marked complete — your client sees this update automatically'); }
  async function handleSaveNotes() { await saveNotes(txnId, notes); flash('Notes saved'); }
  async function handleSend() { if (!msgText.trim()) return; await sendMessage(txnId, 'agent', msgText.trim()); setMsgText(''); }
  async function handleUpload(i, file) {
    if (!file) return;
    setUploading(i);
    try {
      await uploadDocument(txnId, i, file);
      flash('Document uploaded — your client can view it now');
    } catch (e) {
      flash('Upload failed: ' + e.message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <Link to="/agent" className="back-btn">← All transactions</Link>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['overview', 'milestones', 'parties', 'documents', 'comms', 'notes'].map((t) => (
          <button key={t} className={`filter-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="alert-bar">{deal.milestones.length - deal.milestones.filter((m) => m.done).length} milestone(s) remaining · {deal.notes.split('.')[0]}.</div>
          <div className="grid-4">
            <div className="stat-card"><div className="stat-num">{pct(deal)}%</div><div className="stat-label">Progress</div></div>
            <div className="stat-card"><div className="stat-num">{deal.milestones.length - deal.milestones.filter((m) => m.done).length}</div><div className="stat-label">Open milestones</div></div>
            <div className="stat-card"><div className="stat-num">{deal.price}</div><div className="stat-label">Price</div></div>
            <div className="stat-card"><div className="stat-num">{deal.close}</div><div className="stat-label">Target close</div></div>
          </div>
          <div className="card">
            <div className="card-title">Property</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{deal.addr}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deal.city} {deal.zip}</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Client: <strong>{deal.client}</strong> · Txn ID: <strong style={{ color: 'var(--blue)' }}>{deal.txnId}</strong></div>
          </div>
        </>
      )}

      {tab === 'milestones' && (
        <div className="card">
          <div className="card-title">Transaction milestones <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>(<span className="sync-dot" />synced live with your client)</span></div>
          {deal.milestones.map((m, i) => {
            const state = m.done ? 'done' : i === idx ? 'now' : 'next';
            return (
              <div className="step" key={i}>
                <div className={`step-icon s-${state}`}>{m.done ? '✓' : i === idx ? '●' : '○'}</div>
                <div style={{ flex: 1 }}>
                  <div className={`step-name ${state}`}>{m.label}</div>
                  <div className="step-desc">{m.desc}</div>
                  <div className={`step-date ${state === 'now' ? 'now' : ''}`}>{m.date}</div>
                </div>
                {!m.done && i === idx && <button className="mark-btn" onClick={() => markDone(i)}>Mark complete</button>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'parties' && (
        <div className="card">
          <div className="card-title">Transaction team</div>
          {contactsFor(deal.side).map((c) => (
            <div className="contact-row" key={c.name}>
              <div className="c-left">
                <div className="avatar" style={{ background: c.bg, color: c.fg }}>{c.init}</div>
                <div><div className="c-name">{c.name}</div><div className="c-role">{c.role}</div></div>
              </div>
              <button className="c-btn">{c.phone}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <div className="card">
          <div className="card-title">Documents</div>
          {DOC_TEMPLATE.map((t, i) => {
            const m = deal.milestones[i];
            const file = deal.documents && deal.documents[i];
            const pill = m.done ? <span className="pill pill-green">Complete</span> : i === idx ? <span className="pill pill-blue">In progress</span> : <span className="pill pill-gray">Pending</span>;
            return (
              <div className="doc-row" key={t.name}>
                <div>
                  <div className="doc-name">{t.name}</div>
                  <div className="doc-meta">
                    {t.meta} · {m.date}
                    {file && <> · <a href={file.url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>{file.name}</a></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {pill}
                  <label className="c-btn" style={{ cursor: 'pointer' }}>
                    {uploading === i ? 'Uploading…' : file ? 'Replace' : 'Upload'}
                    <input type="file" style={{ display: 'none' }} disabled={uploading === i} onChange={(e) => handleUpload(i, e.target.files[0])} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'comms' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">Message client</div>
          <div className="chat-msgs">
            {msgs.map((m) => (
              <div className={m.from === 'agent' ? 'msg-wrap-me' : 'msg-wrap-them'} key={m.id}>
                <div className={`msg ${m.from === 'agent' ? 'me' : 'them'}`}>{m.text}</div>
                <div className="msg-meta">{m.from === 'agent' ? 'You' : deal.client.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div className="chat-row">
            <input className="chat-in" value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message…" />
            <button className="send-btn" onClick={handleSend}>Send</button>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Internal notes</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Agent-only · never shared with client</div></div>
          <textarea className="note-area" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="save-btn" onClick={handleSaveNotes}>Save notes</button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
