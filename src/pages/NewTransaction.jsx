import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createDeal } from '../data/dealsApi';
import { MS_TEMPLATE } from '../data/defaultDeals';
import MilestoneEditor, { newMilestone } from '../components/MilestoneEditor';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function daysUntil(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((new Date(iso + 'T00:00:00') - new Date()) / 86400000));
}

const EMPTY = { addr: '', city: '', zip: '', side: 'buyer', client: '', vLast: '', clientEmail: '', price: '', offerDate: '', close: '' };

export default function NewTransaction() {
  const nav = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [milestones, setMilestones] = useState(() => MS_TEMPLATE.map((t) => newMilestone(t.label, t.desc)));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!form.addr || !form.city || !form.zip || !form.client || !form.vLast || !form.offerDate || !form.close) {
      setErr('Fill in every field before creating the transaction.');
      return;
    }
    setSaving(true);
    try {
      const txnId = await createDeal({
        addr: form.addr.trim(),
        city: form.city.trim(),
        zip: form.zip.trim(),
        side: form.side,
        client: form.client.trim(),
        vLast: form.vLast.trim(),
        clientEmail: form.clientEmail.trim(),
        price: form.price ? `$${Number(form.price).toLocaleString()}` : 'TBD',
        offerDate: fmtDate(form.offerDate),
        close: fmtDate(form.close),
        days: daysUntil(form.close),
        milestones,
      });
      nav(`/agent/deal/${txnId}`);
    } catch (e2) {
      setErr(e2.message || 'Something went wrong creating the transaction.');
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/agent" className="back-btn">← All transactions</Link>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--blue-dark)' }}>New transaction</div>
      <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        <div>
          <label className="field-label">Which side are you representing?</label>
          <div className="verify-toggle">
            <button type="button" className={`vt-btn ${form.side === 'buyer' ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, side: 'buyer' }))}>Buyer side</button>
            <button type="button" className={`vt-btn ${form.side === 'listing' ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, side: 'listing' }))}>Listing side</button>
          </div>
        </div>

        <div>
          <label className="field-label">Property address</label>
          <input className="si-input" value={form.addr} onChange={set('addr')} placeholder="123 Maple Street" />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">City, state</label>
            <input className="si-input" value={form.city} onChange={set('city')} placeholder="Walnut Creek, CA" />
          </div>
          <div style={{ width: 130 }}>
            <label className="field-label">Zip code</label>
            <input className="si-input" value={form.zip} onChange={set('zip')} placeholder="94596" />
          </div>
        </div>

        <div>
          <label className="field-label">Client name (as shown to them)</label>
          <input className="si-input" value={form.client} onChange={set('client')} placeholder="Jake & Maya Torres" />
        </div>

        <div>
          <label className="field-label">Client last name (for their login)</label>
          <input className="si-input" value={form.vLast} onChange={set('vLast')} placeholder="Torres" />
          <div className="field-hint">Clients sign in with the transaction ID plus this last name, or the property zip code above.</div>
        </div>

        <div>
          <label className="field-label">Client email (optional, for notifications)</label>
          <input className="si-input" type="email" value={form.clientEmail} onChange={set('clientEmail')} placeholder="jake.torres@example.com" />
          <div className="field-hint">If you add this, your client gets an automatic email whenever a milestone updates, you message them, or a document goes up. You can add it later from Edit details if you don't have it yet.</div>
        </div>

        <div>
          <label className="field-label">Purchase price (optional)</label>
          <input className="si-input" type="number" value={form.price} onChange={set('price')} placeholder="1250000" />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Offer accepted</label>
            <input className="si-input" type="date" value={form.offerDate} onChange={set('offerDate')} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Target close date</label>
            <input className="si-input" type="date" value={form.close} onChange={set('close')} />
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
          <label className="field-label">Milestones</label>
          <div className="field-hint" style={{ marginBottom: 10 }}>Started from a typical checklist — reorder, rename, remove, or add steps so it matches this specific deal. You can keep editing this after the transaction is created too.</div>
          <MilestoneEditor milestones={milestones} onChange={setMilestones} />
        </div>

        <button className="si-btn" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create transaction'}</button>
        {err && <div className="err-msg">{err}</div>}
      </form>
    </>
  );
}
