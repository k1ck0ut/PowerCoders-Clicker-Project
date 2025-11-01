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
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  setLogLevel,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV_gEJicd1mYfe1PamBh_D536hlLejfwM",
  authDomain: "clicker-20dd0.firebaseapp.com",
  projectId: "clicker-20dd0",
  storageBucket: "clicker-20dd0.firebasestorage.app",
  messagingSenderId: "83791849437",
  appId: "1:83791849437:web:ff8569ff7d61d1e76ab834",
  measurementId: "G-ED6YBEWNNJ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase projectId:", getApp().options.projectId);

window.exportState = function () {
  try {
    return {
      pc,
      usd,
      cpu,
      perClick,
      pcps,
      totalClicks,
      brainLvl,
      shopUnlocked,
      theme,
      logoKey,
      curr,
      sfx,
      music,
      musicEnabled,
      musicVolume,
      sfxEnabled,
      rebirthCount,
      secretUnlocked,
      perClickMult,
      buyMode,

      baseCritChance,
      critFromUpgrades,
      critFromItems,
      critFromBonuses,
      critMultiplier,
      bonusClickFromPassive,

      refineData,
      globalIncomeMult,
      upgradeClickPower,
      upgradePassivePower,

      upgradeLevels,
      specialOwned,
      achievementsUnlocked,

      equipment,
      inventory,
      invMax,

      lastRefineEvent,
      effectsEnabled,
    };
  } catch (e) {
    console.warn("exportState failed:", e);
    return {};
  }
};

window.importState = function (s) {
  if (!s || typeof s !== "object") return;
  Object.assign(window, s);

  try {
    window.recomputeDerived?.();
  } catch (e) {}
  try {
    window.recalcTotals?.();
  } catch (e) {}
  try {
    window.applyTheme?.();
  } catch (e) {}
  try {
    window.applyIcons?.();
  } catch (e) {}
  try {
    window.applyCurrency?.();
  } catch (e) {}
  try {
    window.render?.();
  } catch (e) {}
  try {
    window.save?.();
  } catch (e) {}
};

const $ = (id) => document.getElementById(id);
const btnLogin = $("btnLogin");
const btnLogout = $("btnLogout");
const btnCloudSave = $("btnCloudSave");
const btnCloudLoad = $("btnCloudLoad");
const authInfo = $("authInfo");

window.cloudLogin = async function () {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    alert("Signed in!");
  } catch (e) {
    alert("Login failed: " + (e.code || e.message));
  }
};
window.cloudLogout = async function () {
  await signOut(auth);
  alert("Logged out!");
};

window.cloudSave = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");

  const data = window.exportState ? window.exportState() : {};
  console.log("[cloudSave] keys:", Object.keys(data));

  try {
    await setDoc(
      doc(db, "saves", user.uid),
      { data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    alert("✅ Saved to cloud!");
  } catch (e) {
    console.error("cloudSave error:", e.code, e.message, e);
    alert("Save failed: " + (e.code || e.message));
  }
};

window.cloudLoad = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");

  try {
    const ref = doc(db, "saves", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("No save found!");

    const payload = snap.data();
    const gameData = payload?.data ?? payload;
    console.log("[cloudLoad] keys:", gameData ? Object.keys(gameData) : null);

    if (!gameData || typeof gameData !== "object")
      return alert("Save found but empty");

    window.importState?.(gameData);
    alert("⬇️ Progress restored!");
  } catch (e) {
    console.error("cloudLoad error:", e.code, e.message, e);
    alert("Load failed: " + (e.code || e.message));
  }
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
        const snap = await getDoc(doc(db, "saves", user.uid));
        if (snap.exists()) {
          const gameData = snap.data()?.data ?? snap.data();
          if (gameData) {
            window.importState?.(gameData);
            console.log("Auto-loaded cloud save");
          }
        }
      } catch (e) {
        console.warn("Auto-load skipped:", e.code, e.message);
      }
    }
  } else {
    if (btnLogin) btnLogin.style.display = "";
    if (btnLogout) btnLogout.style.display = "none";
    if (authInfo) authInfo.textContent = "Not signed in";
    if (btnCloudSave) btnCloudSave.disabled = true;
    if (btnCloudLoad) btnCloudLoad.disabled = true;
  }
});

setInterval(async () => {
  const user = auth.currentUser;
  if (!user) return;
  const data = window.exportState ? window.exportState() : {};
  try {
    await setDoc(
      doc(db, "saves", user.uid),
      { data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log("💾 Auto-saved");
  } catch (e) {
    console.warn("Auto-save failed:", e.code, e.message);
  }
}, 30000);
