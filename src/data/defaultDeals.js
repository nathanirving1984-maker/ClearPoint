export const MS_TEMPLATE = [
  { label: 'Offer accepted', desc: 'The offer is signed and accepted by all parties.' },
  { label: 'Earnest money deposited', desc: 'Buyer deposit is received and held securely in escrow.' },
  { label: 'Home inspection completed', desc: 'The property inspection is finished and reviewed.' },
  { label: 'Repair agreement finalized', desc: 'Any repair requests are negotiated and signed.' },
  { label: 'Appraisal completed', desc: "An independent appraiser confirms the home's value." },
  { label: 'Loan approval', desc: 'The lender issues final mortgage approval.' },
  { label: 'Final walkthrough', desc: 'One last check of the property before closing.' },
  { label: 'Close of escrow', desc: 'Final documents are signed, funds transfer, and keys change hands.' },
];

export const DOC_TEMPLATE = [
  { name: 'Purchase agreement', meta: 'Signed by all parties' },
  { name: 'Earnest money receipt', meta: 'Deposit confirmation' },
  { name: 'Inspection report', meta: 'Full property inspection' },
  { name: 'Repair addendum', meta: 'Signed by all parties' },
  { name: 'Appraisal report', meta: 'Independent valuation' },
  { name: 'Loan approval letter', meta: 'From your lender' },
  { name: 'Final walkthrough checklist', meta: 'Pre-closing check' },
  { name: 'Closing disclosure & deed', meta: 'Final closing paperwork' },
];

function ms(doneCount, dates) {
  return MS_TEMPLATE.map((t, i) => ({ label: t.label, desc: t.desc, done: i < doneCount, date: dates[i] }));
}

const PALETTE = [
  { bg: '#EAF3DE', fg: '#3B6D11' },
  { bg: '#FAEEDA', fg: '#854F0B' },
  { bg: '#EEEDFE', fg: '#534AB7' },
  { bg: '#FAECE7', fg: '#993C1D' },
  { bg: '#E1F5EE', fg: '#0F6E56' },
  { bg: '#FBEAF0', fg: '#993556' },
];

export function contactColor(i) {
  return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// The agent is always party to their own transactions, so this entry is
// synthesized rather than stored — one less thing to duplicate or let go
// stale across every deal. Every other contact (the other side's agent,
// lender, title company, etc.) is real per-transaction data the agent adds
// via the Edit details form, stored on the deal itself.
export function agentContact(side) {
  return {
    name: 'Nathan R.',
    role: side === 'buyer' ? "Your buyer's agent · Lead contact" : 'Your listing agent · Lead contact',
    phone: '(415) 555-0101',
    isAgent: true,
    bg: '#E6F1FB',
    fg: '#0C447C',
  };
}

function defaultTeamFor(side) {
  return [
    { name: 'Sarah Lin', role: side === 'buyer' ? 'Listing agent · Represents sellers' : "Buyer's agent · Represents buyers", phone: '(510) 555-0234' },
    { name: 'Mike Kowalski', role: 'Lender · CrossCountry Mortgage', phone: '(650) 555-0319' },
    { name: 'Tina Chen', role: 'Transaction coordinator', phone: '(925) 555-0478' },
    { name: 'James Burke', role: 'Title & escrow · Fidelity Title', phone: '(925) 555-0561' },
  ];
}

// Seeded once into Firestore the first time an agent signs in and the
// `deals` collection is empty. Document ID = txnId (see dealsApi.js for why).
export function defaultDeals() {
  return [
    { txnId: 'CP-2026-4821', addr: '123 Maple Street', city: 'Walnut Creek, CA', zip: '94596', side: 'buyer', client: 'Jake & Maya Torres', price: '$1,250,000', offerDate: 'June 10, 2026', close: 'July 14, 2026', days: 11, vLast: 'Torres', vZip: '94596', clientEmail: 'jaketorres@example.com', notes: 'Buyers nervous about appraisal gap — ~$15k flexibility above purchase price if needed.',
      contacts: defaultTeamFor('buyer'),
      milestones: ms(4, ['June 10', 'June 12', 'June 14', 'June 17', 'Expected June 24', 'Expected June 30', 'July 12', 'July 14']) },
    { txnId: 'CP-2026-3390', addr: '874 Orchard Avenue', city: 'Danville, CA', zip: '94526', side: 'listing', client: 'Patricia Nguyen', price: '$980,000', offerDate: 'June 5, 2026', close: 'July 28, 2026', days: 25, vLast: 'Nguyen', vZip: '94526', clientEmail: 'patricia.nguyen@example.com', notes: 'Repair request response due from seller.',
      contacts: defaultTeamFor('listing'),
      milestones: ms(3, ['June 5', 'June 7', 'June 9', 'Expected June 22', 'Expected June 28', 'Expected July 8', 'July 26', 'July 28']) },
    { txnId: 'CP-2026-5512', addr: '2201 Hillside Drive', city: 'Lafayette, CA', zip: '94549', side: 'buyer', client: 'David & Karen Mills', price: '$1,675,000', offerDate: 'May 30, 2026', close: 'August 5, 2026', days: 33, vLast: 'Mills', vZip: '94549', clientEmail: 'davidmills@example.com', notes: 'All contingencies on track.',
      contacts: defaultTeamFor('buyer'),
      milestones: ms(2, ['May 30', 'June 1', 'Expected June 25', 'Expected July 2', 'Expected July 10', 'Expected July 20', 'Aug 3', 'Aug 5']) },
    { txnId: 'CP-2026-6103', addr: '550 Creekside Lane', city: 'Pleasant Hill, CA', zip: '94523', side: 'listing', client: 'Tom Vance', price: '$825,000', offerDate: 'June 15, 2026', close: 'August 19, 2026', days: 47, vLast: 'Vance', vZip: '94523', clientEmail: 'tomvance@example.com', notes: 'Earnest money due soon.',
      contacts: defaultTeamFor('listing'),
      milestones: ms(1, ['June 15', 'Expected June 22', 'Expected June 30', 'Expected July 8', 'Expected July 18', 'Expected July 28', 'Aug 17', 'Aug 19']) },
    { txnId: 'CP-2026-7284', addr: '3302 Summit Road', city: 'Moraga, CA', zip: '94556', side: 'buyer', client: 'Aisha & Ben Patel', price: '$1,940,000', offerDate: 'June 18, 2026', close: 'August 25, 2026', days: 53, vLast: 'Patel', vZip: '94556', clientEmail: 'aishapatel@example.com', notes: 'Transaction just opened.',
      contacts: defaultTeamFor('buyer'),
      milestones: ms(0, ['Expected June 20', 'Expected June 27', 'Expected July 5', 'Expected July 14', 'Expected July 24', 'Expected Aug 3', 'Aug 23', 'Aug 25']) },
    { txnId: 'CP-2026-8817', addr: '91 Canyon View Drive', city: 'Orinda, CA', zip: '94563', side: 'listing', client: 'Grace & Lee Wu', price: '$2,150,000', offerDate: 'June 20, 2026', close: 'September 3, 2026', days: 62, vLast: 'Wu', vZip: '94563', clientEmail: 'gracewu@example.com', notes: 'Property active on MLS.',
      contacts: defaultTeamFor('listing'),
      milestones: ms(0, ['Expected June 24', 'Expected July 1', 'Expected July 9', 'Expected July 18', 'Expected July 28', 'Expected Aug 7', 'Sep 1', 'Sep 3']) },
  ];
}
