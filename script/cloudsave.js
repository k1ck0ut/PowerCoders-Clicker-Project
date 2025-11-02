import {
  initializeApp,
  getApp,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  setLogLevel,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const __toastEl = (() => {
  const el = document.createElement("div");
  el.id = "saveToast";
  el.style.cssText =
    "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.85);color:#fff;padding:12px 16px;border-radius:12px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999;font:14px system-ui,sans-serif;max-width:min(90vw,480px);text-align:center";
  const mount = () => document.body.appendChild(el);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
  return el;
})();
function __toast(msg) {
  __toastEl.textContent = msg;
  __toastEl.style.opacity = "1";
  clearTimeout(__toast._t);
  __toast._t = setTimeout(() => (__toastEl.style.opacity = "0"), 1200);
}

const firebaseConfig = {
  apiKey: "AIzaSyBCbqR8zXrX1_tRZTWGrBJC1S76AABD1VQ",
  authDomain: "powercoders-clicker.firebaseapp.com",
  projectId: "powercoders-clicker",
  storageBucket: "powercoders-clicker.firebasestorage.app",
  messagingSenderId: "142879796749",
  appId: "1:142879796749:web:69284842f676d314f02f44",
  measurementId: "G-79E067J91Y",
};

const app = initializeApp(firebaseConfig);
setLogLevel("debug");
const auth = getAuth(app);

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app);
  }
}
console.log("Firebase projectId:", getApp().options.projectId);

const STATE_KEYS = [
  "pc",
  "usd",
  "cpu",
  "perClick",
  "pcps",
  "totalClicks",
  "brainLvl",
  "shopUnlocked",
  "theme",
  "logoKey",
  "curr",
  "sfx",
  "music",
  "musicEnabled",
  "musicVolume",
  "sfxEnabled",
  "rebirthCount",
  "secretUnlocked",
  "perClickMult",
  "buyMode",
  "baseCritChance",
  "critFromUpgrades",
  "critFromItems",
  "critFromBonuses",
  "critMultiplier",
  "bonusClickFromPassive",
  "refineData",
  "globalIncomeMult",
  "upgradeClickPower",
  "upgradePassivePower",
  "upgradeLevels",
  "specialOwned",
  "achievementsUnlocked",
  "equipment",
  "inventory",
  "invMax",
  "lastRefineEvent",
  "effectsEnabled",
];

function readGame() {
  const o = {};
  for (const k of STATE_KEYS)
    o[k] = typeof window[k] !== "undefined" ? window[k] : null;
  return o;
}
function writeGame(s) {
  if (!s || typeof s !== "object") return;
  for (const k of STATE_KEYS) if (k in s) window[k] = s[k];
  try {
    window.recomputeDerived?.();
  } catch {}
  try {
    window.recalcTotals?.();
  } catch {}
  try {
    window.applyTheme?.();
  } catch {}
  try {
    window.applyIcons?.();
  } catch {}
  try {
    window.applyCurrency?.();
  } catch {}
  try {
    window.render?.();
  } catch {}
  try {
    window.save?.();
  } catch {}
}

const $ = (id) => document.getElementById(id);
const btnLogin = $("btnLogin");
const btnLogout = $("btnLogout");
const btnCloudSave = $("btnCloudSave");
const btnCloudLoad = $("btnCloudLoad");
const authInfo = $("authInfo");

function nowMs() {
  return Date.now();
}
function uidOrAnon() {
  return auth.currentUser?.uid || "anon";
}
function kFast(u) {
  return `clicker_fast_${u}`;
}
function kBackup(u) {
  return `cloudsave_backup_${u}`;
}

async function readCloud(uid) {
  const r = doc(db, "saves", uid);
  const s = await getDoc(r);
  if (!s.exists()) return null;
  const p = s.data();
  return p?.data ?? p;
}
async function writeCloud(uid, data) {
  await setDoc(
    doc(db, "saves", uid),
    { data, updatedAt: serverTimestamp(), lastKnownClientAt: nowMs() },
    { merge: true }
  );
}

const cloudAutoSave = {
  dirty: false,
  lastCloud: 0,
  lastLocal: 0,
  debounceMs: 1200,
  minCloudGapMs: 10000,
  periodicCloudMs: 20000,
  localEveryMs: 1000,
  offlineCapHours: 600 / 3600,
  tDebounce: null,
  touch() {
    this.dirty = true;
    if (this.tDebounce) clearTimeout(this.tDebounce);
    this.tDebounce = setTimeout(
      () => this.flushCloudIfNeeded(),
      this.debounceMs
    );
  },
  async forceSave() {
    const u = uidOrAnon();
    const d = readGame();
    d.__ts = nowMs();
    try {
      localStorage.setItem(kBackup(u), JSON.stringify(d));
    } catch {}
    if (!auth.currentUser) return;
    await writeCloud(auth.currentUser.uid, d);
    this.lastCloud = nowMs();
    this.dirty = false;
  },
  async flushCloudIfNeeded() {
    if (!this.dirty) return;
    if (!auth.currentUser) return;
    const t = nowMs();
    if (t - this.lastCloud < this.minCloudGapMs) return;
    const d = readGame();
    d.__ts = t;
    try {
      localStorage.setItem(kBackup(auth.currentUser.uid), JSON.stringify(d));
    } catch {}
    try {
      await writeCloud(auth.currentUser.uid, d);
      this.lastCloud = nowMs();
      this.dirty = false;
      __toast("✅ Saved");
    } catch (e) {
      console.warn("save failed:", e?.code || e?.message || e);
    }
  },
  start() {
    setInterval(() => {
      const u = uidOrAnon();
      const t = nowMs();
      if (t - this.lastLocal >= this.localEveryMs) {
        const d = readGame();
        d.__ts = t;
        try {
          localStorage.setItem(kFast(u), JSON.stringify(d));
        } catch {}
        this.lastLocal = t;
      }
    }, 250);
    setInterval(() => this.flushCloudIfNeeded(), this.periodicCloudMs);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.forceSave();
    });
    window.addEventListener("beforeunload", () => {
      const u = uidOrAnon();
      const d = readGame();
      d.__ts = nowMs();
      try {
        localStorage.setItem(kFast(u), JSON.stringify(d));
        localStorage.setItem(kBackup(u), JSON.stringify(d));
      } catch {}
    });
    window.addEventListener("online", () => this.flushCloudIfNeeded());
    window.addEventListener("game:stateChanged", () => this.touch());
  },
  applyOfflineGain(s) {
    try {
      const ts = Number(s?.__ts || 0);
      const rate = Number(s?.pcps || 0);
      if (!ts || !rate) return s;
      const dt = Math.max(
        0,
        Math.min(nowMs() - ts, this.offlineCapHours * 3600 * 1000)
      );
      if (dt <= 0) return s;
      const gain = (rate * dt) / 1000;
      if (typeof s.pc === "number") s.pc += gain;
      s.__ts = nowMs();
      return s;
    } catch {
      return s;
    }
  },
};
window.cloudAutoSave = cloudAutoSave;

window.cloudLogin = async function () {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    __toast("Signed in");
  } catch (e) {
    alert("Login failed: " + (e.code || e.message));
  }
};
window.cloudLogout = async function () {
  await signOut(auth);
  __toast("Signed out");
};
window.cloudSave = async function () {
  await cloudAutoSave.forceSave();
  __toast("✅ Saved");
};
window.cloudLoad = async function () {
  const u = uidOrAnon();
  let chosen = null;
  try {
    const f = localStorage.getItem(kFast(u));
    const fObj = f ? JSON.parse(f) : null;
    chosen = fObj || null;
  } catch {}
  if (auth.currentUser) {
    try {
      const c = await readCloud(auth.currentUser.uid);
      if (c) {
        const cTs = Number(c.__ts || 0);
        const lTs = Number(chosen?.__ts || 0);
        chosen = cTs >= lTs ? cloudAutoSave.applyOfflineGain(c) : chosen;
      }
    } catch {}
  }
  if (!chosen) {
    try {
      const b = localStorage.getItem(kBackup(u));
      if (b) chosen = JSON.parse(b);
    } catch {}
  }
  if (!chosen) return alert("No save found");
  writeGame(chosen);
  __toast("⬇️ Progress restored");
};

let triedAutoLoad = false;
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnLogout) btnLogout.style.display = "";
    if (authInfo)
      authInfo.textContent = `Signed in as ${user.displayName || user.email}`;
    if (btnCloudSave) btnCloudSave.disabled = false;
    if (btnCloudLoad) btnCloudLoad.disabled = false;
    if (!triedAutoLoad) {
      triedAutoLoad = true;
      try {
        const u = user.uid;
        const f = localStorage.getItem(kFast(u));
        const fObj = f ? JSON.parse(f) : null;
        const c = await readCloud(u);
        let chosen = fObj || c || null;
        if (c && fObj) {
          const cTs = Number(c.__ts || 0);
          const lTs = Number(fObj.__ts || 0);
          chosen = cTs >= lTs ? cloudAutoSave.applyOfflineGain(c) : fObj;
        } else if (c) {
          chosen = cloudAutoSave.applyOfflineGain(c);
        }
        if (!chosen) {
          const b = localStorage.getItem(kBackup(u));
          if (b) chosen = JSON.parse(b);
        }
        if (chosen) writeGame(chosen);
      } catch {}
    }
  } else {
    if (btnLogin) btnLogin.style.display = "";
    if (btnLogout) btnLogout.style.display = "none";
    if (authInfo) authInfo.textContent = "Not signed in";
    if (btnCloudSave) btnCloudSave.disabled = true;
    if (btnCloudLoad) btnCloudLoad.disabled = true;
  }
});

cloudAutoSave.start();

btnLogin?.addEventListener("click", cloudLogin);
btnLogout?.addEventListener("click", cloudLogout);
btnCloudSave?.addEventListener("click", cloudSave);
btnCloudLoad?.addEventListener("click", cloudLoad);
