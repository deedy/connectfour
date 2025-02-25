const { v4: uuidv4 } = require('uuid');
const Game = require('./Game');

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame() {
    const gameId = uuidv4();
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  setGameMode(gameId, mode) {
    const game = this.games.get(gameId);
    if (!game) return false;
    return game.setGameMode(mode);
  }

  makeMove(gameId, col) {
    const game = this.games.get(gameId);
    if (!game) return false;
    return game.makeMove(col);
  }

  getAIMove(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.gameMode !== '1p' || game.currentPlayer !== 2) return null;
    const col = game.getAIMove();
    if (col !== null) {
      game.makeMove(col);
    }
    return game.getState();
  }

  getAllGames() {
    return Array.from(this.games.values()).map(game => game.getState());
  }
}

module.exports = new GameManager();