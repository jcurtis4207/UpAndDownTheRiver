import * as db from './database.js';
import * as ui from './ui.js';
import { onValue } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";


let allPlayers = []

document.addEventListener('DOMContentLoaded', async function() {
    /* When the page loads, verify the game state and start play based on who is host */
    const game = await db.ensureGameStarted();
    const userId = await db.ensureUserInGame();

    if (game.host == userId) {
        allPlayers = await db.getAllPlayerIds();
        await db.setupNewGame();
        await playActive(userId);
    } else {
        await playPassive(userId);
    }
});

function shuffle() {
    /* Returns a shuffled deck of cards as a list */
    const suits = ['s', 'h', 'd', 'c'];
    //                                                      10   J    Q    K    A
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(`${rank}${suit}`);
        }
    }

    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

async function deal(count, leader) {
    /* Deals the number of cards to each player and deal one more for the trump card */
    const deck = shuffle();
    for (let playerIndex = 0; playerIndex < allPlayers.length; playerIndex++) {
        let hand = [];
        for (let cardIndex = 0; cardIndex < count; cardIndex++) {
            hand.push(deck.pop());
        }
        await db.setHand(getPlayerId(leader, playerIndex), hand);
    }
    await db.setTrump(deck.pop());
}

function getPlayerId(leader, index) {
    /* Returns the Nth player after the leader */
    return allPlayers[(index + leader) % allPlayers.length];
}

async function makeBid(userId) {
    /* Select a bid amount */
    const newBid = await ui.getUserBid();
    await db.setPlayerBidding(userId, false);
    await db.setBid(userId, newBid);
}

async function waitForPlayerToBid(userId) {
    /* Waits for the given player to make a bid */
    const playerRef = db.getPlayerRef(userId);

    return new Promise((resolve, reject) => {
        const unsubscribe = onValue(playerRef, (snapshot) => {
                if (snapshot.val().bidding === false) {
                    unsubscribe();
                    resolve();
                }
            },
            (error) => {
                unsubscribe();
                reject(error);
            }
        );
    });
}

async function takeAllBids(leader, userId) {
    /* Each player makes a bid */
    for (let playerIndex = 0; playerIndex < allPlayers.length; playerIndex++) {
        const currentPlayer = getPlayerId(leader, playerIndex);
        await db.setPlayerBidding(currentPlayer, true);

        if (currentPlayer == userId) {
            await makeBid(currentPlayer);
        } else {
            await waitForPlayerToBid(currentPlayer);
        }
    }
}

async function playCard(userId) {
    /* Select a card to play, remove from hand, and add to game pot */
    const player = await db.getPlayer(userId);
    const cardIndex = await ui.getUserPlay(player, await db.getGame());

    let hand = player.hand;
    const card = hand[cardIndex];
    hand.splice(cardIndex, 1);

    await db.setPlayerPlaying(userId, false);
    await db.addCardToPot(card, userId);
    await db.setHand(userId, hand);
}

async function waitForPlayerToPlay(userId) {
    /* Wait for the given player to play a card */
    const playerRef = db.getPlayerRef(userId);

    return new Promise((resolve, reject) => {
        const unsubscribe = onValue(playerRef, (snapshot) => {
                if (snapshot.val().playing === false) {
                    unsubscribe();
                    resolve();
                }
            },
            (error) => {
                unsubscribe();
                reject(error);
            }
        );
    });
}

async function playTrick(leader, userId) {
    /* Each player plays a card */
    for (let playerIndex = 0; playerIndex < allPlayers.length; playerIndex++) {
        const currentPlayer = getPlayerId(leader, playerIndex);
        await db.setPlayerPlaying(currentPlayer, true);

        if (currentPlayer == userId) {
            await playCard(currentPlayer);
        } else {
            await waitForPlayerToPlay(currentPlayer);
        }
        ui.updateUi(await db.getAllPlayers(), await db.getGame(), userId);
    }
}

async function findTrickWinner() {
    /* Returns the ID of the winning player */
    const game = await db.getGame();
    const cards = Object.keys(game.pot);
    const trumpCards = [];
    const onSuitCards = [];

    for (let card of cards) {
        if (card[1] === game.trump[1]) {
            trumpCards.push(card[0]);
        } else if (card[1] === game.leadCard[1]) { // [1] is suit
            onSuitCards.push(card[0]);
        }
    }

    let winningValue = 0;
    let winningSuit = 0;

    // Get highest value trump card, or card of leading suit if no trumps played
    if (trumpCards.length === 0) {
        winningValue = Math.max(...onSuitCards.map(r => parseInt(r, 16)));
        winningSuit = game.leadCard[1];
    } else {
        winningValue = Math.max(...trumpCards.map(r => parseInt(r, 16)));
        winningSuit = game.trump[1];
    }

    winningValue = winningValue.toString(16).toUpperCase();
    const winningId = game.pot[`${winningValue}${winningSuit}`];
    await db.incrementTricks(winningId);

    // Return index of winning player, they will lead the next trick
    for (let i = 0; i < allPlayers.length; i++) {
        if (allPlayers[i] === winningId) {
            return i;
        }
    }
}

async function calculateScores() {
    /* Sets the score for the round for each player, and adds a row to the game's score sheet
    Base score is 30
    If you win the same amount as you bid, you get an additional 10 for each trick
    Otherwise you lose 10 points for each trick delta from the original 30
    bid 2, get 2 = 50
    bid 2, get 1 = 20
    */
    let sheet = [];
    for (const playerId of allPlayers) {
        const player = await db.getPlayer(playerId);
        let score = 3;
        if (player.bid !== player.tricks) {
            score -= Math.abs(player.bid - player.tricks);
        } else {
            score += player.bid;
        }
        score *= 10;
        await db.addNewScore(player.id, score);
        sheet.push({name: player.name, bid: player.bid, tricks: player.tricks, score: score});
    }
    await db.addRowToScoreCard(sheet);
}

async function findGameWinner() {
    /* Saves the player(s) with the highest score */
    const players = Object.values(await db.getAllPlayers());
    const maxScore = Math.max(...players.map(player => player.score));
    const winners = players.filter(player => player.score === maxScore);
    await db.setWinners(winners);
}

async function playActive(userId) {
    /* Main game loop for host user */
    const num_tricks = [7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7];

    for (const round of num_tricks) {
        await db.shuffle();
        let leader = await db.getDealer() + 1;   // leader starts to left of dealer
        await deal(round, leader);
        ui.updateUi(await db.getAllPlayers(), await db.getGame(), userId);
        await takeAllBids(leader, userId);

        for (let trick = 0; trick < round; trick++) {
            ui.updateUi(await db.getAllPlayers(), await db.getGame(), userId);
            await playTrick(leader, userId);

            leader = await findTrickWinner();    // (index of) winning player becomes new leader
            await db.setTrickWinner(leader);
            await db.newTrick();
        }
        // End of round
        await calculateScores();
        await db.incrementDealer();
    }
    // End of game
    await findGameWinner();
    ui.updateUi(await db.getAllPlayers(), await db.getGame(), userId);
}

async function playPassive(userId) {
    /* Main game loop for passive user */
    const playersRef = db.getPlayerRef(userId);
    const gameRef = db.getGameRef();

    onValue(gameRef, (snapshot) => {
        void (async () => {
            const game = snapshot.val();
            ui.updateUi(await db.getAllPlayers(), game, userId);
        })().catch((error) => {
            console.error("Failed to update UI:", error);
        });
    });

    onValue(playersRef, (snapshot) => {
        void (async () => {
            const player = snapshot.val();
            if (player.bidding) {
                await makeBid(userId);
            } else if (player.playing) {
                await playCard(userId);
            } else {
                ui.updateUi(await db.getAllPlayers(), await db.getGame(), userId);
            }
        })().catch((error) => {
            console.error("Failed to update user:", error);
        });
    });
}

// HACK
document.querySelector("#cleanup-button").addEventListener("click", async () => {
    await db.clearDatabase();
});
