export class Deck {
    static cleanDeck = (() => {
        const suits = ['s', 'h', 'd', 'c'];
        //                                                      10   J    Q    K    A
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(`${rank}${suit}`);
            }
        }
        return deck;
    })();

    constructor() {
        this.activeDeck = [];
    }

    shuffle() {
        this.activeDeck = [...Deck.cleanDeck];
        for (let i = this.activeDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.activeDeck[i], this.activeDeck[j]] = [this.activeDeck[j], this.activeDeck[i]];
        }
    }

    deal() {
        return this.activeDeck.pop();
    }
}

export class Player {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.bid = 0;
        this.hand = [];
        this.tricks = 0;
    }

    setup() {
        this.hand = [];
        this.bid = 0;
        this.tricks = 0;
    }

    toString() {
        return this.name
    }
}
