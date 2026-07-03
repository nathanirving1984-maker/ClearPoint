import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { seedIfEmpty, subscribeAllDeals } from '../data/dealsApi';
import AgentDeal from './AgentDeal';
import AgentMessages from './AgentMessages';
import NewTransaction from './NewTransaction';
import Logo from '../components/Logo';

function pct(d) { return Math.round(d.milestones.filter((m) => m.done).length / d.milestones.length * 100); }
function activeIdx(d) { const i = d.milestones.findIndex((m) => !m.done); return i === -1 ? d.milestones.length - 1 : i; }

export default function AgentApp() {
  const [deals, setDeals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { signOutAgent } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const inDeal = loc.pathname.includes('/deal/');
  const inMessages = loc.pathname.includes('/messages');
  const inNew = loc.pathname.includes('/new');

  useEffect(() => {
    seedIfEmpty().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    return subscribeAllDeals(setDeals);
  }, [loaded]);

  const totalUnread = 0; // wired up inside AgentMessages; badge kept simple here

  return (
    <div className="app" style={{ height: '100vh' }}>
      <div className="topbar">
        <div className="t-logo"><Logo size={22} />ClearPoint <span className="admin-badge">Agent admin</span></div>
        <div className="t-right">
          <span style={{ fontSize: 12, fontWeight: 500 }}>Nathan R.</span>
          <button className="exit-btn" onClick={async () => { await signOutAgent(); nav('/'); }}>Sign out</button>
        </div>
      </div>
      <div className="sidebar">
        <div className="nav-sec">My workspace</div>
        <Link to="/agent" className={`nav-item ${!inDeal && !inMessages && !inNew ? 'active' : ''}`}>
          <div className="nav-left">All transactions</div><span className="badge-c">{deals.length}</span>
        </Link>
        <Link to="/agent/messages" className={`nav-item ${inMessages ? 'active' : ''}`}>
          <div className="nav-left">Messages</div>
        </Link>
      </div>
      <div className="main">
        <Routes>
          <Route index element={<TransactionList deals={deals} />} />
          <Route path="new" element={<NewTransaction />} />
          <Route path="messages" element={<AgentMessages deals={deals} />} />
          <Route path="deal/:txnId/*" element={<AgentDeal />} />
        </Routes>
      </div>
    </div>
  );
}

function TransactionList({ deals }) {
  const [filter, setFilter] = useState('all');
  const filtered = deals.filter((d) => filter === 'all' || d.side === filter);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--blue-dark)' }}>Good day, Nathan</div></div>
        <Link to="new" className="si-btn" style={{ width: 'auto', padding: '9px 16px', textDecoration: 'none', display: 'inline-block' }}>+ New transaction</Link>
      </div>
      <div className="grid-4">
        <div className="stat-card"><div className="stat-num">{deals.length}</div><div className="stat-label">Active transactions</div></div>
        <div className="stat-card"><div className="stat-num">{deals.filter((d) => d.side === 'buyer').length}</div><div className="stat-label">Buyer side</div></div>
        <div className="stat-card"><div className="stat-num">{deals.filter((d) => d.side === 'listing').length}</div><div className="stat-label">Listing side</div></div>
        <div className="stat-card"><div className="stat-num">{deals.filter((d) => activeIdx(d) > 0).length}</div><div className="stat-label">In progress</div></div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['all', 'buyer', 'listing'].map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'buyer' ? 'Buyer side' : 'Listing side'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((d) => (
          <Link key={d.txnId} to={`deal/${d.txnId}`} className="txn-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.addr}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{d.city} · {d.client}</div>
              </div>
              <span className="pill" style={{ background: d.side === 'buyer' ? 'var(--blue-light)' : 'var(--green-light)', color: d.side === 'buyer' ? 'var(--blue-dark)' : 'var(--green)' }}>
                {d.side === 'buyer' ? 'Buyer side' : 'Listing side'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span>{pct(d)}% · {d.milestones[activeIdx(d)].label}</span>
              <span>Close {d.close}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
