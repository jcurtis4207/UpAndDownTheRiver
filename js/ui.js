export async function getUserBid(player) {
    return await getInput('Enter bid...', `<h3>Bidding</h3>${player.name}<br>[${player.hand}]`);
}

export async function getUserPlay(player, pot) {
    return await getInput('Select card to play...',
        `<h3>Playing</h3>${player.name}<br>[${player.hand}]<br><br>{${Object.keys(pot)}}`);
}

async function getInput(placeholder, message) {
    return new Promise((resolve) => {
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'userInput';
        input.placeholder = placeholder;

        const label = document.createElement('p');
        label.innerHTML = message;

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'Submit';

        form.appendChild(input);
        form.appendChild(submit);

        document.getElementById('game-container').appendChild(label);
        document.getElementById('game-container').appendChild(form);

        form.addEventListener('submit', function(event) {
            event.preventDefault();   // Prevent page reload
            const userInputValue = input.value;
            form.remove();
            label.remove();
            resolve(userInputValue);
        });
    });
}
