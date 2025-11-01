export async function getUserBid(player) {
    return new Promise((resolve) => {
        const app = document.querySelector(".input");
        let value = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Bidding</h3>${player.name}`;

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

export async function getUserPlay(player, lead) {
    return new Promise((resolve) => {
        const app = document.querySelector(".input");
        let cardIndex = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Playing</h3>${player.name}`;

        const cardLabel = document.createElement("span");
        cardLabel.textContent = player.hand[cardIndex];

        const leftBtn = document.createElement("button");
        leftBtn.textContent = "Left";
        leftBtn.onclick = () => {
            cardIndex = ((cardIndex - 1) % player.hand.length + player.hand.length) % player.hand.length;   // wtf JS?
            cardLabel.textContent = player.hand[cardIndex];
        };

        const rightBtn = document.createElement("button");
        rightBtn.textContent = "Right";
        rightBtn.onclick = () => {
            cardIndex = (cardIndex + 1) % player.hand.length;
            cardLabel.textContent = player.hand[cardIndex];
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
            if (!validateCard(player, cardIndex, lead)) {
                console.log("Cannot play this card, you must follow suit");
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

export function updateAllPlayers(players) {
    const container = document.querySelector(".all-players");
    container.innerHTML = '';

    players.forEach(player => {
        const block = document.createElement('div');
        block.innerHTML = `
        <strong>${player.name}</strong><br>
        Score: ${player.score}<br>
        Bid: ${player.bid}<br>
        Tricks: ${player.tricks}<br>
        [${player.hand}]`;
        container.appendChild(block);
    });

    updateInventory(players[0]);    // HACK: current player, not first player
}

export function updateActiveSuits(trump, lead) {
    const container = document.querySelector(".active-suits");
    container.innerHTML = `
    Trump: ${trump}<br>
    Lead: ${lead === '00' ? '' : lead}`;
}

export function updateActivePlayers(dealer, currentPlayer) {
    const container = document.querySelector(".active-players");
    container.innerHTML = `
    Dealer: ${dealer}<br>
    Current Player: ${currentPlayer}`;
}

export function updatePot(pot) {
    const container = document.querySelector(".pot");
    let html = '';
    for (const key in pot) {
        html += `${key}: ${pot[key]}<br>`
    }
    container.innerHTML = html;
}

function updateInventory(player) {
    const container = document.querySelector(".inventory");
    container.innerHTML = `
    ${player.hand}&nbsp&nbsp&nbsp;
    Score: ${player.score}&nbsp&nbsp&nbsp;
    Bids: ${player.bid}&nbsp&nbsp&nbsp;
    Tricks: ${player.tricks}&nbsp&nbsp&nbsp;`;
}

export function updateMessage(winner) {
    const container = document.querySelector(".message");
    container.innerHTML = `${winner.name} won the trick!`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

export function showWinner(winners) {
    const container = document.querySelector(".pot");
    container.innerHTML = 'Game Over.<br>'
    if (winners.length === 1) {
        container.innerHTML += `The winner is ${winners} with a score of ${winners[0].score}`;
    } else {
        container.innerHTML += `TIE! The winners are ${winners} with a score of ${winners[0].score}`;
    }
}
