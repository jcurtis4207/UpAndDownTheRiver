import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, connectAuthEmulator, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, connectDatabaseEmulator, ref, set, onDisconnect, get, onValue, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

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

const db = getDatabase(app);
connectDatabaseEmulator(db, "192.168.1.202", 9000);

const gameRef = ref(db, 'game');
const allPlayersRef = ref(db, 'players');

document.addEventListener('DOMContentLoaded', async function() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('ERROR: you are not logged in.');
            document.getElementById("lobbyPlayerList").innerHTML = 'ERROR: you are not logged in';
        } else {
            main(user);
        }
    });
});

async function main(user) {
    const isHost = await initLobby(user);

    // Check if game already started or lobby is full
    const gameState = await get(gameRef);
    const players = await get(allPlayersRef);

    if (gameState.val().started ) {
        window.location.href = "error.html?message=started";
    }
    if (players.val() && players.val().length > 6) {
        window.location.href = "error.html?message=full";
    }

    createPlayer(user, isHost);
    waitForPlayers();
    waitForStart();

    if (isHost) {
        const startButton = document.getElementById('btnStart');
        startButton.style.display = 'block';
        startButton.addEventListener("click", startGame);
    }
}

async function initLobby(user) {
    let isHost = false;

    try {
        const snapshot = await get(gameRef);

        if (!snapshot.exists()) {
            // Game does not exist - become the host
            isHost = true;
            await set(gameRef, {
                host: user.uid,
                createdAt: Date.now(),
                started: false
            });
            onDisconnect(gameRef).remove();
            onDisconnect(allPlayersRef).remove();
        }
    } catch (error) {
        console.error("Error accessing game data:", error);
    }

    return isHost;
}

function createPlayer(user, isHost) {
    const playerRef = ref(db, `players/${user.uid}`);

    set(playerRef, {
        id: user.uid,
        isHost: isHost,
        name: user.displayName
    });
}

function waitForPlayers() {
    // Display list of players in lobby
    const playersLabel = document.getElementById("lobbyPlayerList");
    onValue(allPlayersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            return;
        }
        let content = "";
        const players = Object.values(data).map(player => player.name);
        for (const player of players) {
            content += (`${player}<br>`);
        }
        playersLabel.innerHTML = content;
    });
}

function waitForStart() {
    // Redirect to game when host clicks start button
    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.started) {
            window.location.href = "game.html";
        }
    });
}

const startGame = async () => {
    console.log('Starting game');
    update(gameRef, {started: true});
}
