import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// For each deal, subscribes to its most recent message so the inbox can
// show a live preview + who's waiting on a reply, without loading every
// message in every thread.
function useLastMessage(txnId) {
  const [last, setLast] = useState(null);
  useEffect(() => {
    const q = query(collection(db, 'deals', txnId, 'messages'), orderBy('createdAt', 'desc'), limit(1));
    return onSnapshot(q, (snap) => setLast(snap.empty ? null : snap.docs[0].data()));
  }, [txnId]);
  return last;
}

function InboxRow({ deal }) {
  const last = useLastMessage(deal.txnId);
  const needsReply = last && last.from === 'client';
  return (
    <Link to={`/agent/deal/${deal.txnId}`} className="contact-row" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
      <div className="c-left">
        <div className="avatar" style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>
          {deal.client.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <div className="c-name">{deal.client}</div>
          <div className="c-role">{deal.addr}</div>
          {last && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {last.from === 'agent' ? 'You: ' : ''}{last.text}
          </div>}
        </div>
      </div>
      {needsReply && <span className="badge-c">needs reply</span>}
    </Link>
  );
}

export default function AgentMessages({ deals }) {
  return (
    <>
      <div><div style={{ fontSize: 15, fontWeight: 500 }}>Messages</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All client conversations in one place.</div></div>
      <div className="card" style={{ padding: '0.5rem 1.25rem' }}>
        {deals.map((d) => <InboxRow deal={d} key={d.txnId} />)}
      </div>
    </>
  );
}
