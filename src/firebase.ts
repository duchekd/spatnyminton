import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurace Firebase – web config není tajný, ale plní se přes env (a build secrets).
// Hodnoty viz .env.example; pro lokální vývoj patří do .env.local.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Je-li config vyplněný, synchronizace běží; jinak appka jede čistě lokálně.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Bez konfigurace se na Firebase nikdo neobrátí – všechna volání se nejdřív ptají na
// isFirebaseConfigured. getAuth ale prázdný apiKey nesnese: vyhodí auth/invalid-api-key
// rovnou při importu a z celé appky zbude bílá stránka. Dostane proto neškodnou náhradu,
// se kterou se stejně nikam nevolá.
const LOCAL_ONLY_CONFIG = { apiKey: "local-only", projectId: "local-only", appId: "local-only" };

// Chybějící secret se v CI předá jako prázdný řetězec, takže build projde a chyba by se
// jinak projevila až v prohlížeči – ať je v konzoli vidět, proč appka nesynchronizuje.
if (!isFirebaseConfigured) {
  console.debug("Chybí konfigurace Firebase (VITE_FIREBASE_*) – appka běží jen lokálně, přihlášení a synchronizace jsou vypnuté.");
}

const app = initializeApp(isFirebaseConfigured ? firebaseConfig : LOCAL_ONLY_CONFIG);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
