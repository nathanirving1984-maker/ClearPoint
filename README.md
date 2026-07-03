# ClearPoint

A real estate transaction coordinator: one agent dashboard, one client view, backed by a
real Firebase database so updates sync live instead of living in two disconnected demo files.

## What's real here vs. what's next

**Working now:** agent auth, live milestone sync (Firestore real-time listeners — no polling),
client login by transaction ID + last name/zip, two-way messaging, an agent-wide message
inbox, documents/contacts/notes tabs.

**Deliberately simplified, worth hardening before real client data goes in:**
- Client identity verification happens by fetching the deal doc and checking last name/zip
  *after* the fetch, not before (see the comment in `firestore.rules`). Fine for an MVP;
  for real PII, the next step is a Cloud Function that verifies credentials server-side and
  mints a scoped custom auth token.
- No document upload yet (Firebase Storage isn't wired in) — the Documents tab still shows
  status pills derived from milestones, not real files.
- No email/SMS notifications when something changes yet.

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
   Name it (e.g. "clearpoint"), you can skip Google Analytics.
2. In the left sidebar: **Build → Firestore Database → Create database**. Start in
   **production mode** (we'll supply real rules below), pick a region close to you.
3. **Build → Authentication → Get started → Email/Password → Enable.**
4. Still in Authentication, go to the **Users** tab → **Add user** → create your own agent
   login (e.g. `nathan@clearpoint.com` + a real password). This replaces the old fake
   pre-filled sign-in.
5. In **Project settings → General**, scroll to "Your apps," click the **</> Web** icon, register
   an app (no need for Firebase Hosting setup yet), and copy the `firebaseConfig` values.

## 2. Configure the project locally / in Codespaces

```bash
git clone <your repo>
cd clearpoint
cp .env.example .env
# paste the firebaseConfig values from step 1.5 into .env
npm install
npm run dev
```

Open the printed local URL. Sign in with the agent account you created in step 1.4 — the
`deals` collection auto-seeds with 6 placeholder transactions the first time you sign in.

## 3. Deploy the security rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point it at the existing firestore.rules file when asked
firebase deploy --only firestore:rules
```

## 4. Deploy the app (Firebase Hosting)

```bash
npm run build
firebase init hosting     # choose "dist" as the public directory, configure as single-page app: yes
firebase deploy --only hosting
```

You'll get a real `https://<project-id>.web.app` URL you can send clients.

## Project structure

```
src/
  firebase.js           # Firebase init, reads config from .env
  context/AuthContext.jsx
  data/
    defaultDeals.js      # seed data + milestone/document templates
    dealsApi.js           # all Firestore reads/writes live here
  pages/
    RolePicker, AgentSignIn, AgentApp, AgentDeal, AgentMessages,
    ClientEntry, ClientApp
firestore.rules
```

## Next steps worth tackling

- Document uploads via Firebase Storage (Documents tab)
- Email notification (Firebase Extensions has a "Trigger Email" extension that fires on
  Firestore writes — a natural fit for "milestone completed" or "new message" events)
- Cloud Function–based client verification (see note above)
- Agent self-serve sign-up instead of manually adding users in the console
