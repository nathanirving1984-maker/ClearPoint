import { useState } from 'react';
import { updateDealDetails } from '../data/dealsApi';
import { contactColor, initials } from '../data/defaultDeals';

export default function EditTransactionForm({ deal, txnId, onSaved }) {
  const [form, setForm] = useState({
    addr: deal.addr, city: deal.city, zip: deal.zip, side: deal.side,
    client: deal.client, vLast: deal.vLast, clientEmail: deal.clientEmail || '', price: deal.price,
    offerDate: deal.offerDate, close: deal.close,
  });
  const [contacts, setContacts] = useState(deal.contacts || []);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function addContact() {
    if (!newContact.name.trim() || !newContact.role.trim()) return;
    setContacts((c) => [...c, { ...newContact, name: newContact.name.trim(), role: newContact.role.trim(), phone: newContact.phone.trim() }]);
    setNewContact({ name: '', role: '', phone: '' });
  }
  function removeContact(i) {
    setContacts((c) => c.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setErr('');
    if (!form.addr || !form.city || !form.zip || !form.client || !form.vLast) {
      setErr('Address, city, zip, client name, and client last name are required.');
      return;
    }
    setSaving(true);
    try {
      await updateDealDetails(txnId, { ...form, contacts });
      onSaved();
    } catch (e) {
      setErr(e.message || 'Something went wrong saving these changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
      <div className="card-title">Transaction details</div>

      <div>
        <label className="field-label">Which side are you representing?</label>
        <div className="verify-toggle">
          <button type="button" className={`vt-btn ${form.side === 'buyer' ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, side: 'buyer' }))}>Buyer side</button>
          <button type="button" className={`vt-btn ${form.side === 'listing' ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, side: 'listing' }))}>Listing side</button>
        </div>
      </div>

      <div>
        <label className="field-label">Property address</label>
        <input className="si-input" value={form.addr} onChange={set('addr')} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="field-label">City, state</label>
          <input className="si-input" value={form.city} onChange={set('city')} />
        </div>
        <div style={{ width: 130 }}>
          <label className="field-label">Zip code</label>
          <input className="si-input" value={form.zip} onChange={set('zip')} />
        </div>
      </div>

      <div>
        <label className="field-label">Client name (as shown to them)</label>
        <input className="si-input" value={form.client} onChange={set('client')} />
      </div>

      <div>
        <label className="field-label">Client last name (for their login)</label>
        <input className="si-input" value={form.vLast} onChange={set('vLast')} />
      </div>

      <div>
        <label className="field-label">Client email (for notifications)</label>
        <input className="si-input" type="email" value={form.clientEmail} onChange={set('clientEmail')} placeholder="jake.torres@example.com" />
        <div className="field-hint">Milestone updates, your messages, and new documents email here automatically once this is filled in.</div>
      </div>

      <div>
        <label className="field-label">Purchase price</label>
        <input className="si-input" value={form.price} onChange={set('price')} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="field-label">Offer accepted</label>
          <input className="si-input" value={form.offerDate} onChange={set('offerDate')} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-label">Target close date</label>
          <input className="si-input" value={form.close} onChange={set('close')} />
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
        <label className="field-label">Transaction team</label>
        <div className="field-hint" style={{ marginBottom: 10 }}>The other side's agent, lender, title company, and anyone else on this deal. Your client sees this list too.</div>
        {contacts.map((c, i) => {
          const color = contactColor(i);
          return (
            <div className="contact-row" key={i}>
              <div className="c-left">
                <div className="avatar" style={{ background: color.bg, color: color.fg }}>{initials(c.name)}</div>
                <div><div className="c-name">{c.name}</div><div className="c-role">{c.role}{c.phone ? ` · ${c.phone}` : ''}</div></div>
              </div>
              <button type="button" className="c-btn" onClick={() => removeContact(i)}>Remove</button>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input className="si-input" style={{ flex: '1 1 140px' }} placeholder="Name" value={newContact.name} onChange={(e) => setNewContact((n) => ({ ...n, name: e.target.value }))} />
          <input className="si-input" style={{ flex: '1 1 180px' }} placeholder="Role, e.g. Lender · CrossCountry" value={newContact.role} onChange={(e) => setNewContact((n) => ({ ...n, role: e.target.value }))} />
          <input className="si-input" style={{ flex: '1 1 130px' }} placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact((n) => ({ ...n, phone: e.target.value }))} />
          <button type="button" className="si-btn secondary" style={{ width: 'auto', padding: '9px 14px' }} onClick={addContact}>Add</button>
        </div>
      </div>

      <button className="si-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      {err && <div className="err-msg">{err}</div>}
    </div>
  );
}
