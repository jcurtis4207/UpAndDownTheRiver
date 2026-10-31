import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXAL3awlw16vCxSvh6TRUjRffRSO6WFuQ",
    authDomain: "up-and-down-the-river-3fc20.firebaseapp.com",
    projectId: "up-and-down-the-river-3fc20",
    storageBucket: "up-and-down-the-river-3fc20.firebasestorage.app",
    messagingSenderId: "1035802402897",
    appId: "1:1035802402897:web:bf58d503b85ac1fb345870"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
connectAuthEmulator(auth, "http://192.168.1.202:9099");

export const db = getDatabase(app);
connectDatabaseEmulator(db, "192.168.1.202", 9000);
