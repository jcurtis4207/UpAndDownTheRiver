import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, AuthErrorCodes } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXAL3awlw16vCxSvh6TRUjRffRSO6WFuQ",
    authDomain: "up-and-down-the-river-3fc20.firebaseapp.com",
    projectId: "up-and-down-the-river-3fc20",
    storageBucket: "up-and-down-the-river-3fc20.firebasestorage.app",
    messagingSenderId: "1035802402897",
    appId: "1:1035802402897:web:bf58d503b85ac1fb345870"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
connectAuthEmulator(auth, "http://192.168.1.202:9099");

const btnLogin = document.getElementById("btnLogin");
const emailField = document.getElementById("txtEmail");
const passwordField = document.getElementById("txtPassword");
const errorLabel = document.getElementById("loginErrorLabel");

document.addEventListener('DOMContentLoaded', async function() {
    btnLogin.addEventListener("click", loginEmailPassword);
});

const loginEmailPassword = async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailField.value, passwordField.value);
        console.log(userCredential.user);
        window.location.href = "lobby.html";
    } catch(error) {
        console.log(error);
        showLoginError(error);
    }
    return;
}

function showLoginError(error) {
    errorLabel.style.display = 'block';
    if (error.code == AuthErrorCodes.INVALID_PASSWORD) {
        errorLabel.innerHTML = `Wrong password. Try again.`
    }
    else {
        errorLabel.innerHTML = `Error: ${error.message}`
    }
}
