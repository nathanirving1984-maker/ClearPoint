import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeDeal, markMilestoneDone, updateMilestones, saveNotes, subscribeMessages, sendMessage } from '../data/dealsApi';
import { uploadDocument } from '../data/filesApi';
import { agentContact, contactColor, initials } from '../data/defaultDeals';
import EditTransactionForm from './EditTransactionForm';
import MilestoneEditor from '../components/MilestoneEditor';

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
  const [uploading, setUploading] = useState(false);
  const [editingMilestones, setEditingMilestones] = useState(false);
  const [msDraft, setMsDraft] = useState([]);
  const [newDocName, setNewDocName] = useState('');

  useEffect(() => subscribeDeal(txnId, (d) => { setDeal(d); if (d) setNotes(d.notes); }), [txnId]);
  useEffect(() => subscribeMessages(txnId, setMsgs), [txnId]);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  if (!deal) return <div>Loading…</div>;
  const idx = activeIdx(deal);

  async function markDone(i) { await markMilestoneDone(txnId, i); flash('Milestone marked complete — your client sees this update automatically'); }
  async function handleSaveNotes() { await saveNotes(txnId, notes); flash('Notes saved'); }
  async function handleSend() { if (!msgText.trim()) return; await sendMessage(txnId, 'agent', msgText.trim(), deal); setMsgText(''); }
  function startEditingMilestones() { setMsDraft(deal.milestones); setEditingMilestones(true); }
  async function saveMilestones() {
    await updateMilestones(txnId, msDraft);
    setEditingMilestones(false);
    flash('Milestones updated — your client sees this update automatically');
  }
  async function handleUpload(file) {
    if (!file) return;
    const label = newDocName.trim() || file.name;
    setUploading(true);
    try {
      await uploadDocument(txnId, label, file, deal);
      setNewDocName('');
      flash('Document uploaded — your client can view it now');
    } catch (e) {
      flash('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Link to="/agent" className="back-btn">← All transactions</Link>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['overview', 'milestones', 'parties', 'documents', 'comms', 'notes', 'edit'].map((t) => (
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

      {tab === 'milestones' && !editingMilestones && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Transaction milestones <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(<span className="sync-dot" />synced live with your client)</span></div>
            <button className="c-btn" onClick={startEditingMilestones}>Edit milestones</button>
          </div>
          {deal.milestones.map((m, i) => {
            const state = m.done ? 'done' : i === idx ? 'now' : 'next';
            return (
              <div className="step" key={m.id || i}>
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

      {tab === 'milestones' && editingMilestones && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Edit milestones</div>
            <button className="c-btn" onClick={() => setEditingMilestones(false)}>Cancel</button>
          </div>
          <MilestoneEditor milestones={msDraft} onChange={setMsDraft} />
          <button className="si-btn" style={{ marginTop: 14 }} onClick={saveMilestones}>Save milestones</button>
        </div>
      )}

      {tab === 'parties' && (
        <div className="card">
          <div className="card-title">Transaction team</div>
          {[agentContact(deal.side), ...(deal.contacts || [])].map((c, i) => {
            const color = c.isAgent ? { bg: c.bg, fg: c.fg } : contactColor(i - 1);
            return (
              <div className="contact-row" key={i}>
                <div className="c-left">
                  <div className="avatar" style={{ background: color.bg, color: color.fg }}>{initials(c.name)}</div>
                  <div><div className="c-name">{c.name}</div><div className="c-role">{c.role}</div></div>
                </div>
                <button className="c-btn">{c.phone}</button>
              </div>
            );
          })}
          {(!deal.contacts || deal.contacts.length === 0) && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              No other parties added yet. Add the other side's agent, lender, or title company from the <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => setTab('edit')}>edit details tab →</span>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="card">
          <div className="card-title">Documents</div>
          {(deal.documents || []).length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>No documents uploaded yet.</div>
          )}
          {(deal.documents || []).map((f) => (
            <div className="doc-row" key={f.id}>
              <div>
                <div className="doc-name">{f.name}</div>
                <div className="doc-meta">{f.fileName} · uploaded {new Date(f.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <a className="c-btn" href={f.url} target="_blank" rel="noreferrer">View</a>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input className="si-input" style={{ flex: '1 1 200px' }} placeholder="What is this document? e.g. Inspection report" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} />
            <label className="si-btn secondary" style={{ width: 'auto', padding: '9px 14px', cursor: 'pointer', display: 'inline-block' }}>
              {uploading ? 'Uploading…' : 'Choose file & upload'}
              <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
          </div>
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

      {tab === 'edit' && (
        <EditTransactionForm deal={deal} txnId={txnId} onSaved={() => { flash('Transaction details saved — your client sees this too'); setTab('overview'); }} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
