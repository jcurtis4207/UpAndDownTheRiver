import { Deck, Player } from './objects.js'

const LEVELS = Object.freeze({
    INFO: 0,
    DEBUG: 1,
    AUDIT: 2
});

const LOGLEVEL = LEVELS.DEBUG;

document.addEventListener('DOMContentLoaded', function() {
    const game = new Game();
    game.playGame();
});

function log(level, message) {
    if (level <= LOGLEVEL) {
        let lvlStr = Object.entries(LEVELS).find(([_, val]) => val === level)?.[0];
        lvlStr = lvlStr.padEnd(8, ' ');
        console.log(`${lvlStr} ${message}`)
    }
}

class Game {
    constructor() {
        this.num_tricks = [7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7];
        this.deck = new Deck();
        this.pot = {};
        this.trump = '00';
        this.leadCard = '00';
        this.players = [new Player("Jacob"), new Player("Thomas"), new Player("Brian")];
        this.dealer = Math.floor(Math.random() * this.players.length);
        log(LEVELS.DEBUG, `The first dealer is ${this.players[this.dealer]}!`)
    }

    playGame() {
        for (const round of this.num_tricks) {
            let leader = this.dealer + 1;   // leader starts to left of dealer
            this.deck.shuffle();
            this.players.forEach(player => {
                player.setup();
            })

            this.deal(round, leader);
            this.takeBids(leader);

            for (let trick = 0; trick < round; trick++) {
                // Start of trick
                for (let i = 0; i < this.players.length; i++) {
                    // Play a card
                    let currentPlayer = this.getCurrentPlayer(leader, i);
                    let card = currentPlayer.hand.pop();   // TODO: user input - must be validated
                    this.pot[card] = currentPlayer.name;

                    if (i === 0) {
                        this.leadCard = card;
                        log(LEVELS.DEBUG, `Lead is ${card}, trump is ${this.trump}`);
                    }

                    log(LEVELS.AUDIT, `Player ${currentPlayer} played card ${card}`);
                }
                // End of trick, find trick winner and clean pot
                log(LEVELS.DEBUG, JSON.stringify(this.pot, null, 2));
                leader = this.findWinner();    // (index of) winning player becomes new leader
                this.pot = {};
            }

            this.calculateScores();
            this.dealer++;
        }

        // Game over, find winner
        this.players.sort((a, b) => a.score - b.score);
        const winner = this.players.at(-1);
        log(LEVELS.INFO, 'Game Over');
        log(LEVELS.INFO, `This winner is ${winner} with a score of ${winner.score}`)
        log(LEVELS.DEBUG, JSON.stringify(this.players, null, 2));
    }

    deal(count, leader) {
        for (let card = 0; card < count; card++) {
            for (let i = 0; i < this.players.length; i++) {
                let currentPlayer = this.getCurrentPlayer(leader, i);
                let newCard = this.deck.deal();
                currentPlayer.hand.push(newCard);
                log(LEVELS.AUDIT, `Player ${currentPlayer} got card ${newCard}`);
            }
        }

        this.trump = this.deck.deal();
        log(LEVELS.DEBUG, `The trump card is ${this.trump}`);
    }

    takeBids(leader) {
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.getCurrentPlayer(leader, i);
            let newBid = Math.floor(Math.random() * 2);    // TODO: user input
            currentPlayer.bid = newBid;
            log(LEVELS.AUDIT, `Player ${currentPlayer} bid ${newBid}`);
        }
    }

    findWinner() {
        const cards = Object.keys(this.pot);
        const trumpCards = [];
        const onSuitCards = [];

        for (let card of cards) {
            if (card[1] === this.trump[1]) {
                trumpCards.push(card[0]);
            } else if (card[1] === this.leadCard[1]) {
                onSuitCards.push(card[0]);
            }
        }

        let winningValue = 0;
        let winningSuit = 0;
        let winningName = 0;

        // Get highest value trump card, or card of leading suit if no trumps played
        if (trumpCards.length === 0) {
            winningValue = Math.max(...onSuitCards.map(r => parseInt(r, 16)));
            winningSuit = this.leadCard[1];
        } else {
            winningValue = Math.max(...trumpCards.map(r => parseInt(r, 16)));
            winningSuit = this.trump[1];
        }

        winningValue = winningValue.toString(16).toUpperCase();
        winningName = this.pot[`${winningValue}${winningSuit}`];
        log(LEVELS.DEBUG, `Player ${winningName} won with card ${winningValue}`);

        // Return index of winning player, they will lead the next trick
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === winningName) {
                this.players[i].tricks++;
                return i;
            }
        }
    }

    getCurrentPlayer(leader, index) {
        // Returns the Nth player after the leader
        return this.players[(index + leader) % this.players.length];
    }

    calculateScores() {
        /*
        Base score is 30
        If you win the same amount as you bid, you get an additional 10 for each trick
        Otherwise you lose 10 points for each trick delta from the original 30
        bid 2, get 2 = 50
        bid 2, get 1 = 20
        */
        for (const player of this.players) {
            let score = 3;
            if (player.bid != player.tricks) {
                score -= Math.abs(player.bid - player.tricks);
            } else {
                score += player.bid;
            }
            score *= 10;
            player.score += score;
            log(LEVELS.AUDIT, `Player ${player} scored ${score}`);
       }
    }
}
