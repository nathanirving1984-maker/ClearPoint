import { useState } from 'react';

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function newMilestone(label = '', desc = '') {
  return { id: genId(), label, desc, done: false, date: 'Not yet scheduled' };
}

// Controlled component: parent owns the milestones array and passes an
// onChange to receive updates. Used identically in NewTransaction (building
// the initial list from scratch) and in AgentDeal's edit mode (adjusting an
// ongoing transaction's list) — same editing rules apply either way.
export default function MilestoneEditor({ milestones, onChange }) {
  const [draft, setDraft] = useState({ label: '', desc: '' });

  function update(i, key, value) {
    onChange(milestones.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));
  }
  function remove(i) {
    if (milestones.length <= 1) return;
    onChange(milestones.filter((_, idx) => idx !== i));
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= milestones.length) return;
    const copy = [...milestones];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }
  function add() {
    if (!draft.label.trim()) return;
    onChange([...milestones, newMilestone(draft.label.trim(), draft.desc.trim())]);
    setDraft({ label: '', desc: '' });
  }

  return (
    <div>
      {milestones.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 3 }}>
            <button type="button" className="c-btn" style={{ padding: '2px 7px', fontSize: 10 }} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button type="button" className="c-btn" style={{ padding: '2px 7px', fontSize: 10 }} onClick={() => move(i, 1)} disabled={i === milestones.length - 1}>↓</button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input className="si-input" value={m.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Milestone name" />
            <input className="si-input" value={m.desc} onChange={(e) => update(i, 'desc', e.target.value)} placeholder="Short description shown to your client" />
            {m.done && <div style={{ fontSize: 11, color: 'var(--green)' }}>Already marked complete on {m.date} — renaming it won't undo that.</div>}
          </div>
          <button type="button" className="c-btn" onClick={() => remove(i)} disabled={milestones.length <= 1}>Remove</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input className="si-input" style={{ flex: '1 1 160px' }} placeholder="New milestone name" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
        <input className="si-input" style={{ flex: '1 1 220px' }} placeholder="Short description" value={draft.desc} onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))} />
        <button type="button" className="si-btn secondary" style={{ width: 'auto', padding: '9px 14px' }} onClick={add}>+ Add step</button>
      </div>
    </div>
  );
}
