import { auth } from './firebase.js'
import { signInWithEmailAndPassword, AuthErrorCodes, setPersistence, browserSessionPersistence, updateProfile } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const btnLogin = document.getElementById("btnLogin");
const emailField = document.getElementById("txtEmail");
const passwordField = document.getElementById("txtPassword");
const errorLabel = document.getElementById("login-error");

const loginEmailPassword = async () => {
    /* On successful login redirect to lobby */
    try {
        errorLabel.hidden = true;
        await setPersistence(auth, browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, emailField.value, passwordField.value);

        // If username field is empty, set name to email address name
        let name = document.getElementById("txtUsername").value.trim();
        if (!name) {
            name = emailField.value.split("@")[0];
        }
        await updateProfile(userCredential.user, {
            displayName: name
        });

        window.location.href = "lobby.html";
    } catch(error) {
        console.log(error);
        showLoginError(error);
    }
    return;
}

function showLoginError(error) {
    /* Show error message on HTML page */
    errorLabel.hidden = false;
    if (error.code == AuthErrorCodes.INVALID_PASSWORD) {
        errorLabel.innerHTML = `Wrong password. Try again.`
    }
    else {
        errorLabel.innerHTML = `Error: ${error.message}`
    }
}

/* Loading the config file may delay past the DOMContentLoad trigger
   If the page is done loading, this is the case, and we should start the button listener manually. */
function setupLoginPage() {
  btnLogin.addEventListener("click", loginEmailPassword);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLoginPage, { once: true });
} else {
  setupLoginPage();
}
