import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// ── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDrULor-EmyCLhVKy3e-cFUooo_I0kwEVA",
  authDomain: "naadam2026-d9c65.firebaseapp.com",
  projectId: "naadam2026-d9c65",
  storageBucket: "naadam2026-d9c65.firebasestorage.app",
  messagingSenderId: "133953085844",
  appId: "1:133953085844:web:c5f3c693c9cc98f815af81",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Collection refs ──────────────────────────────────────────────────────────
const usersCol  = collection(db, "users");
const horsesCol = collection(db, "horses");
const seqRef    = doc(db, "meta", "sequences");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get or create the atomic sequence document */
async function ensureSeq() {
  const snap = await getDoc(seqRef);
  if (!snap.exists()) {
    await setDoc(seqRef, { nextHorse: 1 });
  }
}

/** Atomically grab the next horse number */
async function getNextHorseNumber() {
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(seqRef);
    if (!snap.exists()) {
      tx.set(seqRef, { nextHorse: 2, reservedNumbers: [] });
      return 1;
    }
    const data = snap.data();
    const reserved = (data.reservedNumbers || []).filter(n => typeof n === 'number');
    if (reserved.length > 0) {
      const sorted = [...reserved].sort((a, b) => a - b);
      const num = sorted[0];
      const remaining = sorted.slice(1);
      tx.update(seqRef, { reservedNumbers: remaining });
      return num;
    }
    const next = data.nextHorse || 1;
    if (next > 150) throw new Error("Бүртгэлийн дугаар 150-аас хэтэрлээ!");
    tx.update(seqRef, { nextHorse: next + 1 });
    return next;
  });
}

// ── USER ─────────────────────────────────────────────────────────────────────

/**
 * Find existing user by phone or create new one.
 * Returns user object with Firestore id.
 */
export async function loginOrCreateUser({ surname, givenName, phone }) {
  const q = query(usersCol, where("phone", "==", phone));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  const ref = await addDoc(usersCol, {
    surname,
    givenName,
    name: `${surname} ${givenName}`,
    phone,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, surname, givenName, name: `${surname} ${givenName}`, phone };
}

// ── HORSES ───────────────────────────────────────────────────────────────────

/**
 * Register a horse.
 * Handles shared-number logic:
 *   - Same user, different age group → reuse first number (free)
 *   - Same user, same age group again → new number (paid)
 */
export async function registerHorse(userId, phone, ageGroupId, ageGroupName, formData) {
  // All horses this user already has
  const myQ  = query(horsesCol, where("ownerPhone", "==", phone));
  const mySnap = await getDocs(myQ);
  const myHorses = mySnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // First number this user ever received
  const myFirstNumber = myHorses.length > 0 ? myHorses[0].number : null;

  // Horses in this specific age group
  const sameAge = myHorses.filter(h => h.ageGroupId === ageGroupId);

  const reuseNumber  = myFirstNumber && sameAge.length === 0;
  const number       = reuseNumber ? myFirstNumber : await getNextHorseNumber();
  const needsPayment = !reuseNumber;

  const horse = {
    ...formData,
    number,
    needsPayment,
    ageGroupId,
    ageGroupName,
    userId,
    ownerPhone: phone,
    paid: false,
    approved: false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(horsesCol, horse);
  return { id: ref.id, ...horse };
}

/**
 * Mark a list of horse IDs as paid.
 */
export async function markHorsesPaid(horseIds) {
  await Promise.all(
    horseIds.map(id =>
      updateDoc(doc(db, "horses", id), { paid: true, paidAt: serverTimestamp() })
    )
  );
}

/**
 * Get all horses for a user.
 */
export async function getMyHorses(phone) {
  const q = query(horsesCol, where("ownerPhone", "==", phone));
  const snap = await getDocs(q);
  const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return horses.sort((a,b)=>{
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return ta - tb;
  });
}

// ── EXPLAINER ────────────────────────────────────────────────────────────────

/**
 * Get all paid horses (for explainer / public results).
 * Optionally filter by ageGroupId or search string.
 */
export async function getPaidHorses({ ageGroupId = null, search = "" } = {}) {
  let q = query(horsesCol, where("paid", "==", true));
  const snap = await getDocs(q);
  let horses = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>(a.number||0)-(b.number||0));

  if (ageGroupId) horses = horses.filter(h => h.ageGroupId === ageGroupId);

  if (search.trim()) {
    const s = search.toLowerCase();
    horses = horses.filter(h =>
      String(h.number).includes(s) ||
      (h.horseName  || "").toLowerCase().includes(s) ||
      (h.uyaachName || "").toLowerCase().includes(s) ||
      (h.riderName  || "").toLowerCase().includes(s) ||
      (h.ownerName  || "").toLowerCase().includes(s)
    );
  }
  return horses;
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

/** Get ALL horses (admin only). */
export async function getAllHorses() {
  const snap = await getDocs(horsesCol);
  const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return horses.sort((a,b)=>(a.number||0)-(b.number||0));
}

/** Approve a horse registration. */
export async function approveHorse(id) {
  await updateDoc(doc(db, "horses", id), { approved: true });
}

/** Delete a horse registration. */
export async function deleteHorse(id) {
  await deleteDoc(doc(db, "horses", id));
}

/** Get admin stats. */
export async function getAdminStats() {
  const all = await getAllHorses();
  const paid    = all.filter(h => h.paid);
  const pending = all.filter(h => !h.paid);
  const revenue = paid.filter(h => h.needsPayment).length * 50000;

  const byAge = {};
  all.forEach(h => {
    if (!byAge[h.ageGroupName]) byAge[h.ageGroupName] = 0;
    byAge[h.ageGroupName]++;
  });

  return { total: all.length, paid: paid.length, pending: pending.length, revenue, byAge };
}

// ── REAL-TIME LISTENER ──────────────────────────────────────────────────────

/**
 * Listen to all horses in real-time.
 * Calls callback(horses[]) whenever data changes.
 * Returns unsubscribe function.
 */
export function listenAllHorses(callback) {
  const { onSnapshot, query, orderBy } = require("firebase/firestore");
  const q = query(horsesCol, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(horses);
  });
}

/**
 * Listen to pending (paid but not approved) horses.
 * Calls callback(count) whenever count changes.
 */
export function listenPendingCount(callback) {
  const { onSnapshot, query, where } = require("firebase/firestore");
  const q = query(horsesCol, where("paid", "==", true), where("approved", "==", false));
  return onSnapshot(q, (snap) => {
    callback(snap.size);
  });
}

// ── REGISTRATION DEADLINE ───────────────────────────────────────────────────

const settingsRef = doc(db, "meta", "settings");

export async function saveDeadline(isoString) {
  await setDoc(settingsRef, { regDeadline: isoString }, { merge: true });
}

export async function getDeadline() {
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data().regDeadline || null : null;
}

export async function clearDeadline() {
  await updateDoc(settingsRef, { regDeadline: null });
}
