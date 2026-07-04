import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

// Writing here is what actually sends an email — the Firebase "Trigger
// Email" extension watches the `mail` collection and fires on every new
// document. If a deal has no clientEmail on file yet, this silently does
// nothing rather than erroring, so older deals (or ones the agent hasn't
// gotten around to adding an email for) don't break other actions.
// Failures here are logged but never thrown, so a notification hiccup
// can't block the actual milestone/message/upload action from succeeding.
export async function notifyClient(deal, subject, html) {
  if (!deal || !deal.clientEmail) return;
  try {
    await addDoc(collection(db, 'mail'), {
      to: [deal.clientEmail],
      message: { subject, html },
    });
  } catch (e) {
    console.error('Notification email failed to queue:', e);
  }
}
