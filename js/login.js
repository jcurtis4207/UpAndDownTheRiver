import { auth } from './firebase.js'
import { signInWithEmailAndPassword, AuthErrorCodes, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const btnLogin = document.getElementById("btnLogin");
const emailField = document.getElementById("txtEmail");
const passwordField = document.getElementById("txtPassword");
const errorLabel = document.getElementById("loginErrorLabel");

document.addEventListener('DOMContentLoaded', async function() {
    /* When the page loads, enable login listener */
    btnLogin.addEventListener("click", loginEmailPassword);
});

const loginEmailPassword = async () => {
    /* On successful login redirect to lobby */
    try {
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, emailField.value, passwordField.value);
        window.location.href = "lobby.html";
    } catch(error) {
        console.log(error);
        showLoginError(error);
    }
    return;
}

function showLoginError(error) {
    /* Show error message on HTML page */
    errorLabel.style.display = 'block';
    if (error.code == AuthErrorCodes.INVALID_PASSWORD) {
        errorLabel.innerHTML = `Wrong password. Try again.`
    }
    else {
        errorLabel.innerHTML = `Error: ${error.message}`
    }
}
