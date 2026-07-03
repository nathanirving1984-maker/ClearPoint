import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  onSnapshot, query, orderBy, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { defaultDeals } from './defaultDeals';

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

// Client login: fetch by ID, then verify last name / zip client-side.
// The Firestore rule only needs to allow `get` on an exact doc ID — it
// doesn't need to know the verification answer, because a wrong guess
// just gets rejected here after the fact.
export async function findDealForClient(txnId, verifyValue, mode) {
  const snap = await getDoc(doc(dealsCol, txnId.trim().toUpperCase()));
  if (!snap.exists()) return null;
  const d = snap.data();
  const ok = mode === 'lastname'
    ? d.vLast.toLowerCase() === verifyValue.trim().toLowerCase()
    : d.vZip === verifyValue.trim();
  return ok ? d : null;
}

export async function markMilestoneDone(txnId, index) {
  const ref = doc(dealsCol, txnId);
  const snap = await getDoc(ref);
  const d = snap.data();
  const milestones = d.milestones.map((m, i) =>
    i === index ? { ...m, done: true, date: m.date.replace('Expected ', '') } : m
  );
  await updateDoc(ref, { milestones });
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

export async function sendMessage(txnId, from, text) {
  await addDoc(collection(db, 'deals', txnId, 'messages'), {
    from, text, createdAt: serverTimestamp(),
  });
}
