import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findDealForClient } from '../data/dealsApi';
import Logo from '../components/Logo';

export default function ClientEntry() {
  const [txnId, setTxnId] = useState('CP-2026-4821');
  const [mode, setMode] = useState('lastname');
  const [verify, setVerify] = useState('Torres');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const deal = await findDealForClient(txnId, verify, mode);
      if (deal) nav(`/client/${deal.txnId}`);
      else setErr("We couldn't match that transaction ID and verification info. Please double check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-wrap">
      <form className="card-box" onSubmit={handleSubmit}>
        <div className="logo-row"><Logo size={32} /><span className="logo-text">ClearPoint</span></div>
        <div className="logo-sub">Enter your transaction ID to get started</div>
        <div className="field-group">
          <label className="field-label">Transaction ID</label>
          <input className="si-input code" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="CP-2026-XXXX" />
          <div className="field-hint">Your agent provided this ID</div>
        </div>
        <div className="field-group">
          <label className="field-label">Verify your identity — choose one</label>
          <div className="verify-toggle">
            <button type="button" className={`vt-btn ${mode === 'lastname' ? 'active' : ''}`} onClick={() => { setMode('lastname'); setVerify(''); }}>Last name</button>
            <button type="button" className={`vt-btn ${mode === 'zip' ? 'active' : ''}`} onClick={() => { setMode('zip'); setVerify(''); }}>Property zip code</button>
          </div>
          <input className="si-input" value={verify} onChange={(e) => setVerify(e.target.value)} placeholder={mode === 'lastname' ? 'Enter your last name' : 'e.g. 94596'} />
          <div className="field-hint">{mode === 'lastname' ? 'Enter the last name on your transaction' : 'Enter the zip code of the property'}</div>
        </div>
        <button className="si-btn" type="submit" disabled={loading}>{loading ? 'Checking…' : 'View my transaction'}</button>
        {err && <div className="err-msg">{err}</div>}
        <div className="si-footer">Questions? Contact your agent directly.</div>
      </form>
    </div>
  );
}
