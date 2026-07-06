import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, getDoc, deleteField } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { notifyClient } from './notificationsApi';
import { SITE_URL } from '../constants';

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// Documents are a flat, agent-named list on the deal — not tied to
// milestone position. That coupling used to exist (doc #3 = milestone #3)
// but broke the moment milestones became editable/reorderable per
// transaction, and honestly wasn't a great model anyway: not every
// document maps neatly to a single milestone.
// `deal` is optional, passed by the caller to avoid an extra read, and used
// only to send the client notification email.
export async function uploadDocument(txnId, docName, file, deal) {
  const path = `deals/${txnId}/doc-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const entry = { id: genId(), name: docName, fileName: file.name, url, uploadedAt: new Date().toISOString(), size: file.size };
  await updateDoc(doc(db, 'deals', txnId), { documents: arrayUnion(entry) });
  if (deal) {
    await notifyClient(deal, 'A new document is ready for review',
      `<p>Hi ${deal.client.split(' ')[0]},</p>
       <p><strong>${docName}</strong> was just uploaded to your transaction at ${deal.addr}.</p>
       <p><a href="${SITE_URL}/client">View documents →</a></p>`);
  }
  return entry;
}

// Removes a document from the transaction and deletes the underlying file
// in Storage. Handles both the current array format and the older
// object-keyed format some existing deals may still have, so this works
// regardless of when a given document was originally uploaded.
export async function removeDocument(txnId, entry) {
  try {
    await deleteObject(ref(storage, entry.url));
  } catch (e) {
    // File may already be gone, or the URL couldn't be parsed — either
    // way, don't let that block removing the reference itself.
    console.warn('Could not delete underlying file (removing reference anyway):', e.message);
  }

  const dealRef = doc(db, 'deals', txnId);
  const snap = await getDoc(dealRef);
  const data = snap.data();

  if (Array.isArray(data.documents)) {
    const filtered = data.documents.filter((d) => (entry.id ? d.id !== entry.id : d.url !== entry.url));
    await updateDoc(dealRef, { documents: filtered });
  } else if (data.documents && typeof data.documents === 'object') {
    const key = Object.keys(data.documents).find((k) => data.documents[k].url === entry.url);
    if (key) await updateDoc(dealRef, { [`documents.${key}`]: deleteField() });
  }
}
