const { onCall, HttpsError } = require('firebase-functions/https');
const { setGlobalOptions } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// This is the real security boundary for client access. Nothing about a
// deal is ever sent to a browser until this function has verified the
// last name or zip server-side, using the Admin SDK (which bypasses
// Firestore rules entirely — that's fine here because this function IS
// the gate, not a bypass of it).
//
// On success, it mints a Firebase Auth custom token scoped to exactly one
// transaction via a custom claim (`dealId`). The client then signs in with
// that token, and firestore.rules only grants read access when the
// token's dealId claim matches the document being read. A client can
// never read a deal they haven't verified for, no matter what ID they
// guess or try — Firestore itself refuses the read.
exports.verifyClientAccess = onCall(async (request) => {
  const { txnId, verifyValue, mode } = request.data || {};

  if (!txnId || !verifyValue || !mode) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }
  if (mode !== 'lastname' && mode !== 'zip') {
    throw new HttpsError('invalid-argument', 'Invalid verification mode.');
  }

  const id = String(txnId).trim().toUpperCase();
  const snap = await admin.firestore().collection('deals').doc(id).get();

  if (!snap.exists) {
    // Same error for "not found" and "wrong answer" below, so a caller
    // can't use this to probe which transaction IDs are real.
    throw new HttpsError('permission-denied', "We couldn't verify that transaction. Please double check and try again.");
  }

  const deal = snap.data();
  const ok = mode === 'lastname'
    ? (deal.vLast || '').toLowerCase() === String(verifyValue).trim().toLowerCase()
    : (deal.vZip || '') === String(verifyValue).trim();

  if (!ok) {
    throw new HttpsError('permission-denied', "We couldn't verify that transaction. Please double check and try again.");
  }

  // One Firebase Auth identity per transaction, deterministic so repeat
  // visits reuse the same identity rather than piling up new ones.
  const uid = `client_${id}`;
  try {
    await admin.auth().getUser(uid);
  } catch {
    await admin.auth().createUser({ uid });
  }
  await admin.auth().setCustomUserClaims(uid, { dealId: id });

  const token = await admin.auth().createCustomToken(uid, { dealId: id });
  return { token };
});
