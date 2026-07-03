import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeDeal, subscribeMessages, sendMessage } from '../data/dealsApi';
import { DOC_TEMPLATE, contactsFor } from '../data/defaultDeals';
import Logo from '../components/Logo';

function pct(d) { return Math.round(d.milestones.filter((m) => m.done).length / d.milestones.length * 100); }
function activeIdx(d) { const i = d.milestones.findIndex((m) => !m.done); return i === -1 ? d.milestones.length - 1 : i; }

export default function ClientApp() {
  const { txnId } = useParams();
  const nav = useNavigate();
  const [deal, setDeal] = useState(undefined);
  const [tab, setTab] = useState('overview');
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState('');

  useEffect(() => subscribeDeal(txnId, setDeal), [txnId]);
  useEffect(() => subscribeMessages(txnId, setMsgs), [txnId]);

  if (deal === undefined) return null;
  if (deal === null) return (
    <div className="center-wrap">
      <div className="card-box">
        <div className="logo-sub">We couldn't find that transaction.</div>
        <button className="si-btn" onClick={() => nav('/client')}>Back</button>
      </div>
    </div>
  );

  const idx = activeIdx(deal);
  const allDone = deal.milestones.every((m) => m.done);

  async function handleSend() { if (!msgText.trim()) return; await sendMessage(txnId, 'client', msgText.trim()); setMsgText(''); }

  return (
    <div className="app" style={{ height: '100vh' }}>
      <div className="topbar">
        <div className="t-logo"><Logo size={22} />ClearPoint</div>
        <div className="t-right">
          <span className="txn-chip">{deal.txnId}</span>
          <button className="exit-btn" onClick={() => nav('/')}>Exit</button>
        </div>
      </div>
      <div className="sidebar">
        {['overview', 'timeline', 'documents', 'contacts', 'chat'].map((t) => (
          <div key={t} className={`nav-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <div className="nav-left">{t === 'chat' ? 'Message agent' : t[0].toUpperCase() + t.slice(1)}</div>
          </div>
        ))}
      </div>
      <div className="main">
        {tab === 'overview' && (
          <>
            <div className="status-banner">
              <div className="banner-icon">✓</div>
              <div>
                <div className="banner-title">{allDone ? "You're all set — congratulations!" : `Currently: ${deal.milestones[idx].label}`}</div>
                <div className="banner-sub">{allDone ? 'Your transaction is complete.' : deal.milestones[idx].desc}</div>
              </div>
            </div>
            <div className="grid-3">
              <div className="stat-card"><div className="stat-num">{pct(deal)}%</div><div className="stat-label">Complete</div></div>
              <div className="stat-card"><div className="stat-num">{deal.days}</div><div className="stat-label">Days to close</div></div>
              <div className="stat-card"><div className="stat-num">{deal.milestones.length - deal.milestones.filter((m) => m.done).length}</div><div className="stat-label">Steps remaining</div></div>
            </div>
            <div className="card">
              <div className="card-title">Your property</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{deal.addr}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deal.city} {deal.zip}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Purchase price</div><div style={{ fontSize: 13, fontWeight: 500 }}>{deal.price}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Offer accepted</div><div style={{ fontSize: 13, fontWeight: 500 }}>{deal.offerDate}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Your agent</div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue)' }}>Nathan R.</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Where things stand <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>(<span className="sync-dot" />updates live from your agent)</span></div>
              <div className="prog-bg"><div className="prog-fill" style={{ width: `${pct(deal)}%` }} /></div>
              <div className="prog-label">{deal.milestones.filter((m) => m.done).length} of {deal.milestones.length} steps complete</div>
              {deal.milestones.slice(0, 5).map((m, i) => {
                const state = m.done ? 'done' : i === idx ? 'now' : 'next';
                return (
                  <div className="step" key={i}>
                    <div className={`step-icon s-${state}`}>{m.done ? '✓' : i === idx ? '●' : '○'}</div>
                    <div><div className={`step-name ${state}`}>{m.label}</div><div className={`step-date ${state === 'now' ? 'now' : ''}`}>{m.date}</div></div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'timeline' && (
          <div className="card">
            <div className="card-title">Your full transaction timeline</div>
            {deal.milestones.map((m, i) => {
              const state = m.done ? 'done' : i === idx ? 'now' : 'next';
              return (
                <div className="step" key={i}>
                  <div className={`step-icon s-${state}`}>{m.done ? '✓' : i === idx ? '●' : '○'}</div>
                  <div><div className={`step-name ${state}`}>{m.label}</div><div className="step-desc" style={state === 'now' ? { color: 'var(--green)' } : {}}>{m.desc}</div><div className={`step-date ${state === 'now' ? 'now' : ''}`}>{m.date}</div></div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'documents' && (
          <div className="card">
            <div className="card-title">Your documents</div>
            {DOC_TEMPLATE.map((t, i) => {
              const m = deal.milestones[i];
              const file = deal.documents && deal.documents[i];
              const right = file
                ? <><span className="pill pill-green">Uploaded</span><a className="c-btn" href={file.url} target="_blank" rel="noreferrer">View</a></>
                : m.done ? <span className="pill pill-green">Signed</span>
                : i === idx ? <span className="pill pill-blue">Review needed</span>
                : <span className="pill pill-gray">Pending</span>;
              return (
                <div className="doc-row" key={t.name}>
                  <div>
                    <div className="doc-name">{t.name}</div>
                    <div className="doc-meta">{file ? file.name : t.meta} · {m.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="card">
            <div className="card-title">Your transaction team</div>
            {contactsFor(deal.side).map((c) => (
              <div className="contact-row" key={c.name}>
                <div className="c-left">
                  <div className="avatar" style={{ background: c.bg, color: c.fg }}>{c.init}</div>
                  <div><div className="c-name">{c.name}</div><div className="c-role">{c.role}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.isAgent && <button className="c-btn" onClick={() => setTab('chat')}>Message</button>}
                  <button className="c-btn">{c.phone}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-title">Message your agent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 12px', borderBottom: '0.5px solid var(--border)', marginBottom: 10 }}>
              <div className="avatar" style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)', width: 34, height: 34 }}>NR</div>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>Nathan R.</div><div style={{ fontSize: 11, color: 'var(--green)' }}>Usually replies within the hour</div></div>
            </div>
            <div className="chat-msgs">
              {msgs.map((m) => (
                <div className={m.from === 'client' ? 'msg-wrap-me' : 'msg-wrap-them'} key={m.id}>
                  <div className={`msg ${m.from === 'client' ? 'me' : 'them'}`}>{m.text}</div>
                  <div className="msg-meta">{m.from === 'client' ? 'You' : 'Nathan'}</div>
                </div>
              ))}
            </div>
            <div className="chat-row">
              <input className="chat-in" value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Nathan anything…" />
              <button className="send-btn" onClick={handleSend}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
