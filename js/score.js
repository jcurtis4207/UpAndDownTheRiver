import * as db from './database.js';

document.addEventListener('DOMContentLoaded', async function() {
    const game = await db.getGame();
    renderScoreTable(game.scoreSheet, document.querySelector("#score-table"));
});

function createCell(allPlayers, row, playerName) {
    /* Creates a score cell, containing the total score, round bid, and round tricks */
    const player = allPlayers.find(p => p.name === playerName);
    const cell = row.insertCell();

    const scoreCell = document.createElement("div");
    scoreCell.className = "score-cell";

    const bid = document.createElement("span");
    bid.className = "bid small";
    bid.textContent = `Bid: ${player.bid}`;

    const tricks = document.createElement("span");
    tricks.className = "tricks small";
    tricks.textContent = `Tricks: ${player.tricks}`;

    const score = document.createElement("span");
    score.className = "score";

    const roundScore = Number(player.roundScore);
    score.textContent = player.score;

    if (roundScore > 30) {
        tricks.classList.add("score-positive");
    } else if (roundScore < 30) {
        tricks.classList.add("score-negative");
    }

    scoreCell.append(bid, tricks, score);
    cell.append(scoreCell);
}

function renderScoreTable(scoreSheet, container) {
    /* Creates a table for displying the scores for the whole game */
    const keyPrefix = "round_";
    const allRounds = Object.keys(scoreSheet).sort((a, b) => {
        const aIndex = Number(a.replace(keyPrefix, ""));
        const bIndex = Number(b.replace(keyPrefix, ""));
        return aIndex - bIndex;
    });

    const playerNames = scoreSheet[allRounds[0]].map(player => player.name);

    // Create table
    const table = document.createElement("table");
    table.className = "score-table";

    // Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.insertCell().textContent = "Round";
    playerNames.forEach(name => {
        headerRow.insertCell().textContent = name;
    });

    // Body
    const tbody = table.createTBody();

    allRounds.forEach(roundKey => {
        const row = tbody.insertRow();
        const round = Number(roundKey.split("_").at(-1));
        row.insertCell().textContent = String(round);

        const allPlayers = scoreSheet[roundKey];

        playerNames.forEach(name => {
            createCell(allPlayers, row, name);
        });
    });

    container.replaceChildren(table);
}
