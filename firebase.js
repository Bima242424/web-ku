import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// GANTI dengan config dari Firebase Console > Project settings > Your apps > Web app
const cfg = {
  apiKey: "AIzaSyCpZVxLUBIpQqcu-9FqQr03s9D-U2pvNbg",
  authDomain: "bmzmod.firebaseapp.com",
  projectId: "bmzmod",
  appId: "1:425476561006:web:d7ac5feacfed0b6658ae7f"
};
const app = initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);
