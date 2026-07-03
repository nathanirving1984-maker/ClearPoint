import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';

// Files live at deals/{txnId}/doc-{index}-{filename}. Metadata (name, url,
// upload date) is written onto the deal document itself under a
// `documents` map, keyed by the same index used in DOC_TEMPLATE, so the UI
// can tell "milestone says this should exist" apart from "a file was
// actually uploaded" — a deal can have one without the other.
export async function uploadDocument(txnId, index, file) {
  const path = `deals/${txnId}/doc-${index}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const meta = { name: file.name, url, uploadedAt: new Date().toISOString(), size: file.size };
  await updateDoc(doc(db, 'deals', txnId), { [`documents.${index}`]: meta });
  return meta;
}
