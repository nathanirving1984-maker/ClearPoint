import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  onSnapshot, query, orderBy, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { db, functions, auth } from '../firebase';
import { defaultDeals } from './defaultDeals';
import { notifyClient } from './notificationsApi';
import { SITE_URL } from '../constants';

const dealsCol = collection(db, 'deals');

// Deal documents are keyed by txnId (e.g. "CP-2026-4821") rather than an
// auto-generated ID. That's deliberate: it lets a client fetch their own
// deal directly via getDoc(doc(db,'deals', txnId)) — a single-document
// "get" — without ever running a "list" query over the whole collection.
// Firestore rules grant `get` to anyone, but restrict `list` to signed-in
// agents, so a client can only ever see the one deal they already have the
// ID for. See firestore.rules.

export async function seedIfEmpty() {
  const snap = await getDocs(dealsCol);
  if (!snap.empty) return;
  const batch = writeBatch(db);
  defaultDeals().forEach((d) => batch.set(doc(dealsCol, d.txnId), d));
  await batch.commit();
}

// Transaction IDs double as the Firestore document ID (see note above), so
// a new one has to be checked for collisions before use. Collisions are
// astronomically unlikely with a 4-digit suffix, but the check costs one
// cheap read and prevents a silent overwrite in the worst case.
async function generateUniqueTxnId() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 25; i++) {
    const candidate = `CP-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const snap = await getDoc(doc(dealsCol, candidate));
    if (!snap.exists()) return candidate;
  }
  throw new Error('Could not generate a unique transaction ID — try again.');
}

// Creates a brand new transaction using whatever milestone list the agent
// built in the New Transaction form — not every deal follows the same
// steps, so there's no fixed template baked in here.
export async function createDeal(fields) {
  const txnId = await generateUniqueTxnId();
  const deal = {
    txnId,
    addr: fields.addr,
    city: fields.city,
    zip: fields.zip,
    side: fields.side,
    client: fields.client,
    price: fields.price,
    offerDate: fields.offerDate,
    close: fields.close,
    days: fields.days,
    vLast: fields.vLast,
    vZip: fields.zip,
    clientEmail: fields.clientEmail || '',
    notes: '',
    milestones: fields.milestones,
    documents: [],
    contacts: [],
  };
  await setDoc(doc(dealsCol, txnId), deal);
  return txnId;
}

export async function updateDealDetails(txnId, fields) {
  await updateDoc(doc(dealsCol, txnId), fields);
}

export async function updateMilestones(txnId, milestones) {
  await updateDoc(doc(dealsCol, txnId), { milestones });
}

// Agent: live list of every deal. Requires auth (see firestore.rules).
export function subscribeAllDeals(callback) {
  return onSnapshot(dealsCol, (snap) => {
    callback(snap.docs.map((d) => d.data()));
  });
}

// Client + agent deal detail: live updates to one deal by txnId.
export function subscribeDeal(txnId, callback) {
  return onSnapshot(doc(dealsCol, txnId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// Client login: the actual verification happens server-side inside the
// verifyClientAccess Cloud Function, which never returns deal data — only
// a Firebase Auth custom token scoped to this one transaction if the last
// name/zip check out. Signing in with that token is what unlocks
// firestore.rules to allow reading this specific deal. If verification
// fails, the function throws and this returns null; no deal data is ever
// exposed either way.
export async function findDealForClient(txnId, verifyValue, mode) {
  const verify = httpsCallable(functions, 'verifyClientAccess');
  try {
    const result = await verify({ txnId: txnId.trim().toUpperCase(), verifyValue, mode });
    const token = result.data.token;
    await signInWithCustomToken(auth, token);
    const snap = await getDoc(doc(dealsCol, txnId.trim().toUpperCase()));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Client verification failed:', e.code || e.message, e);
    return null;
  }
}

export async function markMilestoneDone(txnId, index) {
  const ref = doc(dealsCol, txnId);
  const snap = await getDoc(ref);
  const d = snap.data();
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const milestones = d.milestones.map((m, i) =>
    i === index ? { ...m, done: true, date: today } : m
  );
  await updateDoc(ref, { milestones });
  await notifyClient(d, `Update on your transaction at ${d.addr}`,
    `<p>Hi ${d.client.split(' ')[0]},</p>
     <p><strong>${d.milestones[index].label}</strong> was just marked complete on your transaction at ${d.addr}.</p>
     <p><a href="${SITE_URL}/client">View your transaction →</a></p>
     <p>— Nathan</p>`);
}

export async function saveNotes(txnId, notes) {
  await updateDoc(doc(dealsCol, txnId), { notes });
}

// Messages live in a subcollection so clients (who aren't authenticated)
// can be granted `create` there without ever getting write access to the
// deal document itself (milestones, price, notes, etc. stay agent-only).
export function subscribeMessages(txnId, callback) {
  const q = query(collection(db, 'deals', txnId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// `deal` is optional and only used for the agent → client notification
// email; passing it in avoids an extra Firestore read since the caller
// (AgentDeal.jsx) already has the deal in state.
export async function sendMessage(txnId, from, text, deal) {
  await addDoc(collection(db, 'deals', txnId, 'messages'), {
    from, text, createdAt: serverTimestamp(),
  });
  if (from === 'agent' && deal) {
    await notifyClient(deal, 'New message from your agent',
      `<p>Hi ${deal.client.split(' ')[0]},</p>
       <p>You have a new message from Nathan about ${deal.addr}:</p>
       <p style="padding:12px;background:#F7F3EC;border-radius:8px;">${text}</p>
       <p><a href="${SITE_URL}/client">Reply on ClearPoint →</a></p>`);
  }
}
