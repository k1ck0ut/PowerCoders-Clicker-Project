import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
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

window.cloudLogin = async function () {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
  alert("Signed in!");
};

window.cloudLogout = function () {
  signOut(auth);
  alert("Logged out!");
};

window.cloudSave = async function (data = {}) {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");
  await setDoc(doc(db, "saves", user.uid), {
    data,
    updatedAt: serverTimestamp(),
  });
  alert("✅ Saved to cloud!");
};

window.cloudLoad = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");
  const snap = await getDoc(doc(db, "saves", user.uid));
  if (!snap.exists()) return alert("No save found!");
  console.log("Loaded data:", snap.data());
  alert("⬇️ Save loaded (check console)");
};

onAuthStateChanged(auth, (user) => {
  console.log("Auth:", user ? user.email : "not signed in");
});

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnCloudSave = document.getElementById("btnCloudSave");
const btnCloudLoad = document.getElementById("btnCloudLoad");
const authInfo = document.getElementById("authInfo");

btnLogin?.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    alert("✅ Signed in!");
  } catch (e) {
    alert("❌ Login failed: " + e.message);
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out!");
});

btnCloudSave?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");
  const data = window.exportState ? window.exportState() : {};
  await setDoc(doc(db, "saves", user.uid), {
    data,
    updatedAt: serverTimestamp(),
  });
  alert("✅ Saved to cloud!");
});

btnCloudLoad?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not signed in!");
  const snap = await getDoc(doc(db, "saves", user.uid));
  if (!snap.exists()) return alert("No save found!");
  const saved = snap.data().data;
  if (window.importState) window.importState(saved);
  alert("⬇️ Loaded from cloud!");
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    btnLogin.style.display = "none";
    btnLogout.style.display = "";
    authInfo.textContent = `Signed in as ${user.displayName || user.email}`;
    btnCloudSave.disabled = false;
    btnCloudLoad.disabled = false;
  } else {
    btnLogin.style.display = "";
    btnLogout.style.display = "none";
    authInfo.textContent = "Not signed in";
    btnCloudSave.disabled = true;
    btnCloudLoad.disabled = true;
  }
});

setInterval(async () => {
  const user = auth.currentUser;
  if (!user) return;

  const data = window.exportState ? window.exportState() : {};
  try {
    await setDoc(
      doc(db, "saves", user.uid),
      {
        data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("💾 Auto-saved to cloud");
  } catch (e) {
    console.warn("Auto-save failed:", e);
  }
}, 30000);
