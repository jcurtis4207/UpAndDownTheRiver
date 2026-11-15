export function updateUi(players, game, userId) {
    renderHand(players[userId]);
    renderDeck(game, players);
    renderGameField(game, players);
    renderPlayersState(players, userId);
    renderCurrentPlayer(players);

    if (game.trickWinner) {
        updateMessage(`${game.trickWinner} won the trick!`);
    }

    if (game.winners) {
        showWinner(game);
    }
}

function convertCardString(card) {
    /* Conver the card string into an object */
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
    const isRed = card[1] === "h" || card[1] === "d";
    const color = (isRed) ? "red" : "black";
    return { value: value, suit: suit, color: color };
}

function createCard(cardString, extraClass = "", elementType = "div") {
    /* Generates an HTML element for a card */
    const element = document.createElement(elementType);
    const card = convertCardString(cardString);
    if (!card) return;
    element.className = `card ${extraClass}${card.color === "red" ? " red" : ""}`;
    element.innerHTML = `
        <span>${card.value}</span>
        <span class="suit">${card.suit}</span>
        `;
    return element;
}

function renderHand(player) {
    /* Display the player's hand at the bottom */
    const isPlaying = player.playing;
    const handElement = document.querySelector("#player-hand");
    handElement.replaceChildren();
    handElement.classList.toggle("is-active", isPlaying);

    const cards = player.hand;
    if (!cards) return;
    cards.forEach((cardString, index) => {
        const cardButton = createCard(cardString, "", "button");
        cardButton.type = "button";
        cardButton.id = `card${index}`;
        cardButton.disabled = !isPlaying;
        handElement.appendChild(cardButton);
    });
}

function renderDeck(game, players) {
    /* Display the dealer, deck, trump, and lead card on the left */
    const deckElement = document.querySelector("#deck");
    deckElement.replaceChildren();

    // A few visible card backs make the deck look like a stack.
    for (let i = 3; i >= 1; i--) {
        const back = document.createElement("div");
        back.className = "card deck-back";
        back.style.transform = `translate(${i * -2}px, ${i * 2}px)`;
        deckElement.appendChild(back);
    }

    // The top card is face up.
    const topCardElement = createCard(game.trump, "deck-top");
    if (!topCardElement) return;
    deckElement.appendChild(topCardElement);

    // Show dealer name
    const dealerIndex = game.dealer;
    const playerNames = Object.values(players).map((player) => player.name);
    const dealerName = playerNames[dealerIndex];
    const dealerLabel = document.createElement("div");
    dealerLabel.className = "dealer-name";
    dealerLabel.textContent = `Dealer: ${dealerName}`;
    deckElement.appendChild(dealerLabel);
}

function renderGameField(game, players) {
    /* Display the active cards in the trick in the center */
    const field = document.querySelector("#game-field");
    field.replaceChildren();

    const cards = game.pot;
    if (!cards) return;
    cards.forEach((card, index) => {
        const play = document.createElement("div");
        play.className = "field-item";
        const cardElement = createCard(card.card)

        // highlight lead card
        if (index === 0) {
            cardElement.classList.add("highlighted");
        }

        play.appendChild(cardElement);

        const name = document.createElement("div");
        name.className = "player-name";
        const playerName = players[card.userId].name;
        name.textContent = playerName;

        play.appendChild(name);
        field.appendChild(play);
    });
}

function renderPlayersState(players, userId) {
    /* Display each player's info at the top */
    const area = document.querySelector("#players-state");
    area.replaceChildren();

    Object.values(players).forEach(player => {
        const block = document.createElement("div");
        block.className = "player-block";
        if (player.id === userId) {
            block.style.fontWeight = "bold";
        }

        const name = document.createElement("div");
        name.textContent = player.name;

        const stats = document.createElement("div");
        stats.className = "player-stats";
        [
            `Score: ${player.score}`,
            `Bid: ${player.bid}`,
            `Tricks: ${player.tricks}`
        ].forEach(text => {
            const line = document.createElement("div");
            line.textContent = text;
            stats.appendChild(line);
        });

        const cards = document.createElement("div");
        cards.className = "remaining-cards";

        // Offset each back to create an overlapping row.
        if (player.hand && player.hand.length > 0) {
            const cardWidth = 38;
            const overlap = 16;
            const rowWidth = cardWidth + Math.max(0, player.hand.length - 1) * overlap;
            cards.style.width = `${rowWidth}px`;

            for (let i = 0; i < player.hand.length; i++) {
                const cardBack = document.createElement("div");
                cardBack.className = "mini-card";
                cardBack.style.left = `${i * overlap}px`;
                cards.appendChild(cardBack);
            }
        }

        block.append(name, stats, cards);
        area.appendChild(block);
    });
}

function renderCurrentPlayer(players) {
    /* Display who is currently active and their state on the right */
    let text = '';
    for (const player of Object.values(players)) {
        if (player.bidding) {
            text = `${player.name} is Bidding`;
            break;
        }
        if (player.playing) {
            text = `${player.name} is Playing`;
            break;
        }
    }

    const status = document.querySelector("#current-player");
    if (text) {
        status.hidden = false;
        status.textContent = text;
    } else {
        status.hidden = true;
    }
}

function renderBidForm(maxBid, onSubmitBid) {
    /* Display the form for entering the bid in the center */
    const container = document.querySelector("#bid-area");
    container.replaceChildren();

    const form = document.createElement("form");
    form.className = "bid-form";

    const label = document.createElement("label");
    label.textContent = "Your bid:";
    label.htmlFor = "bid-input";

    const input = document.createElement("input");
    input.id = "bid-input";
    input.type = "number";
    input.value = "0";
    input.min = "0";
    input.max = String(maxBid);
    input.step = "1";
    input.required = true;

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "form-button";
    button.textContent = "Submit";

    form.addEventListener("submit", event => {
        event.preventDefault();

        const bid = input.valueAsNumber;
        if (!Number.isInteger(bid) || bid < 0 || bid > maxBid) {
            input.setCustomValidity(`Enter a whole number from 0 to ${maxBid}.`);
            input.reportValidity();
            return;
        }

        input.setCustomValidity("");
        onSubmitBid(bid);
        form.remove();
    });

    form.append(label, input, button);
    container.appendChild(form);
}

export async function getUserBid(maxBid) {
    /* Wait for and return user's bid */
    return new Promise((resolve) => {
        renderBidForm(maxBid, bid => { resolve(bid) });
    });
}

function validateCard(player, cardIndex, lead) {
    const card = player.hand[cardIndex];
    if (!lead || lead[1] === card[1]) {
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

export async function getUserPlay(player, game) {
    /* Wait for and return user's card selection */
    return new Promise(resolve => {
        const handElement = document.querySelector("#player-hand");
        const buttons = handElement.querySelectorAll('button[id^="card"]');

        function onClick(event) {
            const index = Number(event.currentTarget.id.slice(4));  //cardN

            if (!validateCard(player, index, game.leadCard)) {
                updateMessage("You must follow suit!");
                return;
            }

            // Remove the listeners so this wait ends after one selection.
            buttons.forEach(button => button.removeEventListener("click", onClick));
            resolve(index);
        }

        buttons.forEach(button => button.addEventListener("click", onClick));
    });
}

function showWinner(game) {
    /* Display the winner(s) and their score in the center */
    const winners = game.winners;

    const container = document.querySelector("#winner-banner");
    container.replaceChildren();
    container.hidden = false;

    const title = document.createElement("h1");
    title.textContent = "Game Over!";

    const winnerMessage = document.createElement("h3");
    if (winners.length === 1) {
        winnerMessage.textContent = `The winner is ${winners.map(w => w.name)} with a score of ${winners[0].score}`;
    } else {
        winnerMessage.textContent = `TIE! The winners are ${winners.map(w => w.name)} with a score of ${winners[0].score}`;
    }

    const info = document.createElement("div");
    info.textContent = "Click the score sheet button for the complete game scores.";

    container.append(title, winnerMessage, info);
}

function updateMessage(message) {
    const timeout = 3500;
    const container = document.querySelector("#message");
    if (message) {
        container.textContent = message;
    } else {
        container.textContent = '';
        return;
    }

    // Clear an earlier timer if another message is shown quickly.
    clearTimeout(container.fadeTimer);
    clearTimeout(container.hideTimer);

    container.classList.remove("fade-out");
    container.classList.add("show");

    container.fadeTimer = setTimeout(() => {
        container.classList.add("fade-out");
    }, timeout);

    container.hideTimer = setTimeout(() => {
        container.classList.remove("show", "fade-out");
    }, timeout + 500);
}
