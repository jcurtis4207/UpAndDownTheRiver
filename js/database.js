import { auth, db } from './firebase.js'
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const gameRef = ref(db, 'game');
const allPlayersRef = ref(db, 'players');
const suitOrder = { 's': 0, 'c': 1, 'd': 2, 'h': 3 };

/* Player */
export function getAllPlayersRef() {
    return allPlayersRef;
}

export function getPlayerRef(userId) {
    return ref(db, `players/${userId}`);
}

export async function getPlayer(userId) {
    /* Returns a player object by ID */
    const playerRef = getPlayerRef(userId);
    const player = await get(playerRef);
    return player.val();
}

export async function getAllPlayers() {
    /* Returns a list of all player objects */
    const players = await get(allPlayersRef);
    return players.val();
}

export async function getAllPlayerIds() {
    /* Returns a list of all player IDs */
    const players = await get(allPlayersRef);
    return Object.values(players.val()).map((player) => player.id);
}

export async function createPlayer(user, isHost) {
    /* Creates a new player in the database */
    const playerRef = getPlayerRef(user.uid);

    await set(playerRef, {
        id: user.uid,
        isHost: isHost,
        name: user.displayName,
        score: 0,
        bid: 0,
        hand: 0,
        tricks: 0,
        bidding: false,
        playing: false
    });
}

export async function newHand(userId) {
    /* Initializes a clean hand for a player */
    const playerRef = getPlayerRef(userId);
    await update(playerRef, {
        hand: 0,
        bid: 0,
        tricks: 0
    });
}

function sortHand(hand) {
    /* Returns the hand sorted ascending */
    return hand.slice().sort((a, b) => {
        const suitA = suitOrder[a[1]];
        const suitB = suitOrder[b[1]];
        if (suitA !== suitB) return suitA - suitB;
        return a[0].charCodeAt(0) - b[0].charCodeAt(0);
    });
}

export async function setHand(userId, hand) {
    /* Stores the given hand list for a player */
    const playerRef = getPlayerRef(userId);
    await update(playerRef, {
        hand: sortHand(hand)
    });
}

export async function setBid(userId, bid) {
    /* Stores the given bid for a player */
    const playerRef = getPlayerRef(userId);
    await update(playerRef, {
        bid: bid
    });
}

export async function setPlayerBidding(userId, bidding) {
    /* Stores the player's bidding state */
    const playerRef = getPlayerRef(userId);
    await update(playerRef, {
        bidding: bidding
    });
}

export async function setPlayerPlaying(userId, playing) {
    /* Stores the player's playing state */
    const playerRef = getPlayerRef(userId);
    await update(playerRef, {
        playing: playing
    });
}

export async function incrementTricks(userId) {
    /* Increments the tricks value for a given player */
    const playerRef = getPlayerRef(userId);
    const player = await getPlayer(userId);
    const tricks = player.tricks + 1;
    await update(playerRef, {
        tricks: tricks
    });
}

export async function addNewScore(userId, newScore) {
    /* Adds the given score to a player's existing score */
    const playerRef = getPlayerRef(userId);
    const player = await getPlayer(userId);
    const score = player.score + newScore;
    await update(playerRef, {
        score: score
    });
    return score;
}

/* Game */
export function getGameRef() {
    return gameRef;
}

export async function getGame() {
    const game = await get(gameRef);
    return game.val();
}

export async function setupNewGame() {
    /* Initializes game fields with placeholders for a new game (created in lobby) */
    const players = await getAllPlayerIds();
    const numPlayers = players.length;
    const dealer = Math.floor(Math.random() * numPlayers);

    await update(gameRef, {
        pot: 0,
        trump: '00',
        leadCard: '00',
        dealer: dealer
    });
}

export async function newTrick() {
    /* Reset the pot and lead card for a new trick */
    await update(gameRef, {
        pot: 0,
        leadCard: '00'
    });
}

export async function ensureGameStarted() {
    /* Verify the game.started and redirect to error on failure
       Returns the game object */
    const game = await getGame();
    if (!game.started ) {
        window.location.href = "error.html?message=not_started";
    }
    return game;
}

export async function ensureUserInGame() {
    /* Verify the current user is in the game and redirect to error on failure
       Returns the current user's ID */
    let userId = null;
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "error.html?message=no_user";
        } else {
            userId = user.uid;
        }
    });

    const playersSnapshot = await get(allPlayersRef);
    if (userId === null || !playersSnapshot.hasChild(userId)) {
        window.location.href = "error.html?message=no_user";
    }
    return userId;
}

export async function setTrump(card) {
    /* Store the trump card for the current hand */
    await update(gameRef, {
        trump: card
    });
}

export async function getDealerIndex() {
    /* Return index of dealer */
    const game = await getGame();
    return game.dealer;
}

export async function incrementDealer() {
    /* Moves dealer index to next player */
    const game = await getGame();
    const players = await getAllPlayerIds();
    let dealer = (game.dealer + 1) % players.length;
    await update(gameRef, {
        dealer: dealer
    });
}

export async function addCardToPot(card, userId) {
    /* Adds the given card to the game pot and updates lead card
       Stores in a dictionary as card:userId pairs
       This allows finding the winning user */
    const game = await getGame();
    let newPot = game.pot;

    if (game.pot === 0) {
        newPot = { [card]: userId };
        await update(gameRef, {
            pot: newPot,
            leadCard: card
        });
    } else {
        newPot[card] = userId;
        await update(gameRef, {
            pot: newPot
        });
    }
}

export async function addRowToScoreCard(roundInfo, newScoreSheet) {
    /* Adds a round of scores to the game scoreSheet
       The format is {round_X_Y: [{p1}, {p2}, {pN}]}
       Where X is the index and Y is number of cards in the round
    */
    const game = await getGame();
    let sheet = game.scoreSheet || {};

    sheet[`round_${roundInfo}`] = newScoreSheet;
    await update(gameRef, {
        scoreSheet: sheet
    });
}

export async function setTrickWinner(index) {
    /* Stores the player name for who won the trick */
    const players = Object.values(await getAllPlayers());
    await update(gameRef, {
        trickWinner: players[index].name
    });
}

export async function setWinners(winners) {
    /* Store the winning player(s) to the game object */
    await update(gameRef, {
        winners: winners
    });
}

export async function clearDatabase() {
    /* Clears all databases when game is complete */
    await update(ref(db), {
      game: null,
      players: null,
      deck: null,
    });
}
