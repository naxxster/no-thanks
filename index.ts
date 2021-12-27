import * as R from 'ramda';
import shuffle from 'lodash.shuffle';
import * as readline from 'readline';

class Card {
  constructor(readonly cardNumber: number) {
  }

  toString(): string {
    return `Card(${this.cardNumber})`;
  }
}

class Token {
  constructor(readonly tokenId: number) {
  }

  toString(): string {
    return `Token(${this.tokenId})`;
  }
}

const cards = [
  new Card(3),
  new Card(4),
  new Card(5),
  new Card(6),
  new Card(7),
  new Card(8),
  new Card(9),
  new Card(10),
  new Card(11),
  new Card(12),
  new Card(13),
  new Card(14),
  new Card(15),
  new Card(16),
  new Card(17),
  new Card(18),
  new Card(19),
  new Card(20),
  new Card(21),
  new Card(22),
  new Card(23),
  new Card(24),
  new Card(25),
  new Card(26),
  new Card(27),
  new Card(28),
  new Card(29),
  new Card(30),
  new Card(31),
  new Card(32),
  new Card(33),
  new Card(34),
  new Card(35)
];

const tokens = [
  new Token(1),
  new Token(2),
  new Token(3),
  new Token(4),
  new Token(5),
  new Token(6),
  new Token(7),
  new Token(8),
  new Token(9),
  new Token(10),
  new Token(11),
  new Token(12),
  new Token(13),
  new Token(14),
  new Token(15),
  new Token(16),
  new Token(17),
  new Token(18),
  new Token(19),
  new Token(20),
  new Token(21),
  new Token(22),
  new Token(23),
  new Token(24),
  new Token(25),
  new Token(26),
  new Token(27),
  new Token(28),
  new Token(29),
  new Token(30),
  new Token(31),
  new Token(32),
  new Token(33),
  new Token(34),
  new Token(35),
  new Token(36),
  new Token(37),
  new Token(38),
  new Token(39),
  new Token(40),
  new Token(41),
  new Token(42),
  new Token(43),
  new Token(44),
  new Token(45),
  new Token(46),
  new Token(47),
  new Token(48),
  new Token(49),
  new Token(50),
  new Token(51),
  new Token(52),
  new Token(53),
  new Token(54),
  new Token(55)
];

interface Components {
  cards: Card[];
  tokens: Token[];
}

type NumberOfPlayer = 3 | 4 | 5 | 6 | 7;
type PlayerIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type NumberOfStartToken = 11 | 9 | 7;

const components: Components = {
  cards,
  tokens
};

const getNumberOfStartToken = (numberOfPlayer: NumberOfPlayer): NumberOfStartToken => {
  if (numberOfPlayer == 6) {
    return 9;
  } else if (numberOfPlayer == 7) {
    return 7;
  } else {
    return 11;
  }
}

const takeTs = <T>(n: number, from: T[], to: T[]): [ T[], T[] ] => {
  const [ tokensToPass, tokensToRemain ] = R.splitAt(n, from);
  return [ tokensToRemain, R.concat(to, tokensToPass) ];
}

const takeAT = <T>(from: T[], to: T[]): [ T[], T[] ] => takeTs(1, from, to);

const splitEveryN = <T>(n: number, m: number, a: T[]): [ T[][], T[] ] => {
  const [ splitted, remains ] = R.splitAt(m, R.splitEvery(n, a));
  return [ splitted, R.unnest(remains) ];
}

interface InitializedRound {
  playCards: Card[];
  playerTokens: Token[][];
}

const initializeRound = (components: Components, numberOfPlayer: NumberOfPlayer): InitializedRound => {
  const [ hiddenCards, playCards ] = R.splitAt(9, shuffle(components.cards));

  const numberOfStartToken = getNumberOfStartToken(numberOfPlayer);
  const [ playerTokens, remainedTokens ] = splitEveryN(numberOfStartToken, numberOfPlayer, components.tokens);

  return { playCards, playerTokens };
};

interface Player {
  tokens: Token[];
  cards: Card[];
}

interface GameState {
  cards: Card[];
  players: Player[];
  turn: PlayerIndex;
  collectedTokens: Token[];
  numberOfPlayer: NumberOfPlayer
}

const startRound = (initializedRound: InitializedRound): GameState => {
  return {
    cards: initializedRound.playCards,
    players: R.map(tokens => ({
      tokens,
      cards: []
    }), initializedRound.playerTokens),
    turn: 0,
    collectedTokens: [],
    numberOfPlayer: initializedRound.playerTokens.length as NumberOfPlayer
  };
}

const nextTurn = (numberOfPlayer: NumberOfPlayer, turn: PlayerIndex): PlayerIndex => (( turn + 1 ) % numberOfPlayer) as PlayerIndex;

const pass = (gameState: GameState): GameState => {
  const player = gameState.players[gameState.turn];
  if (player.tokens.length == 0) {
    return gameState;
  } else {
    const [ playerTokens, collectedTokens ] = takeAT(player.tokens, gameState.collectedTokens);
    return {
      cards: gameState.cards,
      players: R.adjust(gameState.turn, player => ({
        tokens: playerTokens,
        cards: player.cards
      }), gameState.players),
      turn: nextTurn(gameState.numberOfPlayer, gameState.turn),
      collectedTokens,
      numberOfPlayer: gameState.numberOfPlayer
    }
  }
};

const takeCard = (gameState: GameState): GameState => {
  const player = gameState.players[gameState.turn];
  const [ gameCards, playerCards ] = takeAT(gameState.cards, player.cards);
  return {
    cards: gameCards,
    players: R.adjust(gameState.turn, player => ({
      tokens: R.concat(player.tokens, gameState.collectedTokens),
      cards: playerCards
    }), gameState.players),
    turn: gameState.turn,
    collectedTokens: [],
    numberOfPlayer: gameState.numberOfPlayer
  }
}

const isRoundFinished = (gameState: GameState) => gameState.cards.length == 0;

const toString = (gameState: GameState): string => {
  if (isRoundFinished(gameState)) {
    return `
      round finished
      ${gameState.players.map((player, i) => {
        return `
          Player #${i + 1}: ${player.tokens.join(' ')}
          ${player.cards.join(' ')}
        `;
      }).join('\n')}
    `
  } else {
    return `
      turn: ${gameState.turn + 1}
      open card: ${gameState.cards[0]}
      hidden cards: ${R.tail(gameState.cards).join(' ')}
      ${gameState.players.map((player, i) => {
        return `
          Player #${i + 1}: Tokens = ${player.tokens.join(' ')}
                       Cards = ${player.cards.join(' ')}
        `;
      }).join('\n')},
      collected tokens: ${gameState.collectedTokens.join(' ')}
    `;
  }
}

const main = async () => {
  console.log('1');
  let gameState = startRound(initializeRound(components, 3));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('2');
  const s = toString(gameState);
  console.log(s);
  console.log('3');
  console.log('pass or take');
  for await (const line of rl) {
    console.log('4');
    if (line.startsWith('p')) {
      console.log('6');
      gameState = pass(gameState);
    } else if (line.startsWith('t')) {
      console.log('7');
      gameState = takeCard(gameState);
    } else if (line.startsWith('q')) {
      break;
    }
    console.log('8');
    const s = toString(gameState);
    console.log(s);
    console.log('9');
    if (isRoundFinished(gameState)) {
      break;
    }
    console.log('pass or take');
  } 
  console.log('10');
};

main().then(() => console.log('Done'), console.error);
