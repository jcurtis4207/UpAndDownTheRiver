import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

async function loadFirebaseConfig() {
    /* Load firebase config file and save in sessionStorage to prevent delays in subsequent loads */
    const cached = sessionStorage.getItem("firebaseConfig");
    if (cached) return JSON.parse(cached);

    const response = await fetch("/firebase-config.json");
    if (!response.ok) throw new Error("Could not load Firebase config");

    const config = await response.json();
    sessionStorage.setItem("firebaseConfig", JSON.stringify(config));
    return config;
}

const firebaseConfig = await loadFirebaseConfig();
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

if (firebaseConfig.runInEumlator === true && firebaseConfig.emulatorHost) {
    connectAuthEmulator(auth, `http://${firebaseConfig.emulatorHost}:9099`);
    connectDatabaseEmulator(db, firebaseConfig.emulatorHost, 9000);
}
