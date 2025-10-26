export async function getUserBid(player) {
    return new Promise((resolve) => {
        const app = document.getElementById("game-container");
        let value = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Bidding</h3>${player.name}<br>[${player.hand}]`;

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
        app.appendChild(submitBtn);

        submitBtn.onclick = () => {
            while (app.firstChild) {
                app.removeChild(app.firstChild);
            }
            resolve(value);
        };
    });
}

export async function getUserPlay(player, pot, lead) {
    return new Promise((resolve) => {
        const app = document.getElementById("game-container");
        let cardIndex = 0;

        const description = document.createElement('p');
        description.innerHTML = `<h3>Playing</h3>${player.name}<br>[${player.hand}]`;
        description.innerHTML += `<br><br>{${Object.keys(pot)}}   Lead: ${lead}`;

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
