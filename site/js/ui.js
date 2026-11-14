export function updateUi(players, game, userId) {
    updateInventory(players[userId]);
    updateActiveSuits(game);
    updatePot(game, players);
    updateAllPlayers(players);
    updateActivePlayers(players, game);

    if (game.leadCard == '00' && game.trickWinner) {
        updateMessage(`${game.trickWinner} won the trick!`);
    }

    if (game.winners) {
        showWinner(game);
    }
}

function updateInventory(player) {
    const container = document.querySelector(".inventory");
    container.innerHTML = `
    ${getHand(player)}&nbsp&nbsp&nbsp;
    Score: ${player.score}&nbsp&nbsp&nbsp;
    Bids: ${player.bid}&nbsp&nbsp&nbsp;
    Tricks: ${player.tricks}&nbsp&nbsp&nbsp;`;
}

function getHand(player) {
    let hand = [];
    if (!Array.isArray(player?.hand)) {
        return hand;
    }
    for (const c of player.hand) {
        hand.push(getCard(c));
    }
    return hand;
}

function updateActiveSuits(game) {
    const container = document.querySelector(".active-suits");
    container.innerHTML = `
    Trump: ${getCard(game.trump)}<br>
    Lead: ${game.leadCard === '00' ? '' : getCard(game.leadCard)}`;
}

function getCard(card) {
    if (card === undefined || card == 0) return;
    const valueMap = {
        'A': '10',
        'B': 'J',
        'C': 'Q',
        'D': 'K',
        'E': 'A'
    };
    const suitMap = {
        's': '♠',
        'h': '♥',
        'd': '♦',
        'c': '♣'
    };

    const value = valueMap[card[0]] || card[0];
    const suit = suitMap[card[1]];
    return `${value}${suit}`;
}

export async function getUserBid() {
    return new Promise((resolve) => {
        const app = document.querySelector(".input");
        let value = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Bidding</h3>`;

        const bidLabel = document.createElement("span");
        bidLabel.textContent = value;

        const upBtn = document.createElement("button");
        upBtn.textContent = "Up";
        upBtn.onclick = () => {
            if (value < 7) {
                value++;
                bidLabel.textContent = value;
            }
        };

        const downBtn = document.createElement("button");
        downBtn.textContent = "Down";
        downBtn.onclick = () => {
            if (value > 0) {
                value--;
                bidLabel.textContent = value;
            }
        };

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit";

        app.appendChild(description);
        app.appendChild(downBtn);
        app.appendChild(bidLabel);
        app.appendChild(upBtn);
        app.appendChild(document.createElement("p"));
        app.appendChild(submitBtn);

        submitBtn.onclick = () => {
            while (app.firstChild) {
                app.removeChild(app.firstChild);
            }
            resolve(value);
        };
    });
}

export async function getUserPlay(player, game) {
    return new Promise((resolve) => {
        const app = document.querySelector(".input");
        let cardIndex = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Playing</h3>${player.name}`;

        const cardLabel = document.createElement("span");
        cardLabel.textContent = getCard(player.hand[cardIndex]);

        const leftBtn = document.createElement("button");
        leftBtn.textContent = "Left";
        leftBtn.onclick = () => {
            cardIndex = ((cardIndex - 1) % player.hand.length + player.hand.length) % player.hand.length;   // wtf JS?
            cardLabel.textContent = getCard(player.hand[cardIndex]);
        };

        const rightBtn = document.createElement("button");
        rightBtn.textContent = "Right";
        rightBtn.onclick = () => {
            cardIndex = (cardIndex + 1) % player.hand.length;
            cardLabel.textContent = getCard(player.hand[cardIndex]);
        };

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit";

        app.appendChild(description);
        app.appendChild(leftBtn);
        app.appendChild(cardLabel);
        app.appendChild(rightBtn);
        app.appendChild(document.createElement("p"));
        app.appendChild(submitBtn);

        submitBtn.onclick = () => {
            if (!validateCard(player, cardIndex, game.leadCard)) {
                console.log("Cannot play this card, you must follow suit");
                updateMessage("Must follow suit");
                return;
            }
            while (app.firstChild) {
                app.removeChild(app.firstChild);
            }
            resolve(cardIndex);
        };
    });
}

function validateCard(player, cardIndex, lead) {
    const card = player.hand[cardIndex];
    if (lead[1] === card[1]) {
        return true;
    }

    // If you have a card of the leading suit you cannot play another suit
    const notFollowingSuit = player.hand.some(c => c[1] === lead[1]);
    if (notFollowingSuit) {
        return false;
    } else {
        return true;
    }
}

function updateMessage(message) {
    const container = document.querySelector(".message");
    container.innerHTML = message;
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

function updatePot(game, players) {
    if (game.pot === 0) { return };
    const container = document.querySelector(".pot");
    let html = '';
    for (const item of game.pot) {
        const playerName = players[item.userId].name;
        html += `${getCard(item.card)}: ${playerName}<br>`
    }

    container.innerHTML = html;
}

function updateAllPlayers(players) {
    const container = document.querySelector(".all-players");
    container.innerHTML = '';

    Object.values(players).forEach(player => {
        const block = document.createElement('div');
        block.innerHTML = `
        <strong>${player.name}</strong><br>
        Score: ${player.score}<br>
        Bid: ${player.bid}<br>
        Tricks: ${player.tricks}<br>`;
        container.appendChild(block);
    });
}

function showWinner(game) {
    const winners = game.winners;
    const container = document.querySelector(".pot");
    container.innerHTML = 'Game Over.<br>'
    if (winners.length === 1) {
        container.innerHTML += `The winner is ${winners.map(w => w.name)} with a score of ${winners[0].score}`;
    } else {
        container.innerHTML += `TIE! The winners are ${winners.map(w => w.name)} with a score of ${winners[0].score}`;
    }
}

function updateActivePlayers(players, game) {
    const container = document.querySelector(".active-players");

    const dealerIndex = game.dealer;
    const playerNames = Object.values(players).map((player) => player.name);
    const dealer = playerNames[dealerIndex];

    let activePlayer = '';
    for (const player of Object.values(players)) {
        if (player.bidding) {
            activePlayer = `Bidding: ${player.name}`;
            break;
        }
        if (player.playing) {
            activePlayer = `Playing: ${player.name}`;
            break;
        }
    }

    container.innerHTML = `
    Dealer: ${dealer}<br>
    ${activePlayer}`;
}
