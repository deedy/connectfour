const { generateGameId } = require('./wordlist');
const Game = require('./Game');

class GameManager {
  constructor() {
    this.games = new Map();
    this.aiGames = new Map(); // Keep track of AI vs AI games
    this.AIvsAIMoveTimer = null;
  }

  createGame() {
    // Generate fun, readable game ID using three words
    const gameId = generateGameId();
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
    
    const result = game.setGameMode(mode);
    
    // If this is an AI vs AI game, start the move loop
    if (mode === 'ai' && result) {
      // Clear any existing timer for this game
      if (this.aiGames.has(gameId)) {
        const existingTimer = this.aiGames.get(gameId).timerId;
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
      }
      
      // Schedule the first AI move
      this.scheduleNextAIMove(gameId, 1000); // First move after 1 second
    }
    
    return result;
  }

  makeMove(gameId, col) {
    const game = this.games.get(gameId);
    if (!game) return false;
    return game.makeMove(col);
  }

  getAIMove(gameId) {
    const game = this.games.get(gameId);
    if (!game || (game.gameMode !== '1p' && game.gameMode !== 'ai') || game.currentPlayer !== 2) return null;
    
    const col = game.getAIMove();
    if (col !== null) {
      game.makeMove(col);
    }
    return game.getState();
  }
  
  scheduleNextAIMove(gameId, delay = 1500) {
    const game = this.games.get(gameId);
    if (!game || game.gameMode !== 'ai' || game.gameStatus !== 'playing') {
      if (this.aiGames.has(gameId)) {
        this.aiGames.delete(gameId);
      }
      return;
    }
    
    // Create a unique timer for this specific game
    // This ensures that multiple AI vs AI games don't interfere with each other
    const timerId = setTimeout(() => {
      // Make sure the game still exists and is in AI mode
      if (!this.games.has(gameId) || this.games.get(gameId).gameMode !== 'ai') {
        return;
      }
      
      const game = this.games.get(gameId);
      
      // Get AI move for current player
      const currentPlayer = game.currentPlayer;
      const col = game.getAIMoveForPlayer(currentPlayer);
      
      if (col !== null) {
        game.makeMove(col);
        
        // Broadcast the updated state only to clients viewing this specific game
        if (typeof this.broadcastGameState === 'function') {
          this.broadcastGameState(gameId, game.getState());
        }
        
        // Schedule next move if game is still active
        if (game.gameStatus === 'playing') {
          this.scheduleNextAIMove(gameId);
        }
      }
    }, delay);
    
    // Store the timer ID with the gameId to allow cancellation if needed
    // This prevents memory leaks and allows proper cleanup
    this.aiGames.set(gameId, {
      game: game,
      timerId: timerId
    });
  }
  
  // Set broadcast function from server
  setBroadcastFunction(fn) {
    this.broadcastGameState = fn;
  }

  // Get active games (non-finished games with recent activity)
  getActiveGames(limit = 10) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    // Get all games and sort by last activity (most recent first)
    const activeGames = Array.from(this.games.values())
      .filter(game => {
        const lastActivityDate = new Date(game.lastActivity);
        return lastActivityDate > oneDayAgo; // Active within last 24 hours
      })
      .sort((a, b) => {
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      })
      .map(game => game.getState())
      .slice(0, limit);
      
    return activeGames;
  }

  getAllGames() {
    return Array.from(this.games.values()).map(game => game.getState());
  }
}

module.exports = new GameManager();