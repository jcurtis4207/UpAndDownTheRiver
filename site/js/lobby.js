import { auth, db } from './firebase.js'
import * as obj from './database.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const gameRef = ref(db, 'game');
const allPlayersRef = ref(db, 'players');

document.addEventListener('DOMContentLoaded', async function() {
    /* When the page loads, check if the user is logged in */
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

    if (gameState.val().started) {
        // if user already in started game, redirect to game
        const playerIds = Object.values(players.val()).map(player => player.id);
        if (playerIds.includes(user.uid)) {
            window.location.href = "game.html";
        } else {
            window.location.href = "error.html?message=started";
        }
    }

    if (players.val() && Object.keys(players.val()).length > 6) {
        window.location.href = "error.html?message=full";
    }

    await obj.createPlayer(user, isHost);
    waitForPlayers();
    waitForStart();

    if (isHost) {
        const startButton = document.getElementById('btnStart');
        startButton.style.display = 'block';
        startButton.addEventListener("click", startGame);
    }
}

async function initLobby(user) {
    /* If the game doesn't exist, create the game and become the host */
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
        }
    } catch (error) {
        console.error("Error accessing game data:", error);
    }

    return isHost;
}

function waitForPlayers() {
    /* Display list of players in lobby, refreshes when users login */
    // const playersLabel = document.getElementById("lobbyPlayerList");
    const playerList = document.querySelector(".player-list");

    onValue(allPlayersRef, (snapshot) => {
        playerList.replaceChildren();
        const data = snapshot.val();
        if (!data) {
            return;
        }
        const players = Object.values(data).map(player => player.name);
        for (const player of players) {
            const item = document.createElement("li");
            item.className = "player-item";
            item.textContent = player;
            playerList.append(item);
        }
    });
}

function waitForStart() {
    /* Redirect to game when host clicks start button */
    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.started) {
            window.location.href = "game.html";
        }
    });
}

const startGame = async () => {
    /* Set game.started to true */
    console.log('Starting game');
    await update(gameRef, {started: true});
}
