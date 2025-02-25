class Game {
  constructor(id) {
    this.id = id;
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.currentPlayer = 1; // 1 or 2
    this.gameMode = null; // '1p' or '2p'
    this.gameStatus = 'waiting'; // 'waiting', 'playing', 'finished'
    this.winner = null; // null, 1, 2, 'draw'
    this.lastMove = null; // {row, col}
  }

  makeMove(col) {
    if (this.gameStatus !== 'playing' || col < 0 || col > 6) {
      return false;
    }

    // Find the lowest empty row in the selected column
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (this.board[r][col] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) {
      return false; // Column is full
    }

    // Place the piece
    this.board[row][col] = this.currentPlayer;
    this.lastMove = { row, col };

    // Check for win or draw
    if (this.checkWin(row, col)) {
      this.gameStatus = 'finished';
      this.winner = this.currentPlayer;
    } else if (this.isBoardFull()) {
      this.gameStatus = 'finished';
      this.winner = 'draw';
    } else {
      // Switch player
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    return true;
  }

  checkWin(row, col) {
    const player = this.board[row][col];
    const directions = [
      [1, 0], // vertical
      [0, 1], // horizontal
      [1, 1], // diagonal /
      [1, -1] // diagonal \
    ];

    for (const [dr, dc] of directions) {
      let count = 1;

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.board[r][c] !== player) {
          break;
        }
        count++;
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || this.board[r][c] !== player) {
          break;
        }
        count++;
      }

      if (count >= 4) {
        return true;
      }
    }

    return false;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== null);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.gameStatus = 'playing';
    return true;
  }

  getState() {
    return {
      id: this.id,
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameMode: this.gameMode,
      gameStatus: this.gameStatus,
      winner: this.winner,
      lastMove: this.lastMove
    };
  }

  // AI methods
  getAIMove() {
    if (this.currentPlayer !== 2 || this.gameStatus !== 'playing') {
      return null;
    }

    const MAX_DEPTH = 5;
    const startTime = Date.now();
    let timeLimit = 5000; // 5 seconds

    const result = this.minimax(this.board, MAX_DEPTH, -Infinity, Infinity, true, startTime, timeLimit);
    return result.column;
  }

  minimax(board, depth, alpha, beta, maximizingPlayer, startTime, timeLimit) {
    // Check for timeout
    if (Date.now() - startTime > timeLimit) {
      return { score: 0, column: Math.floor(Math.random() * 7) };
    }

    // Generate valid moves (non-full columns)
    const validMoves = this.getValidMoves(board);
    
    // Check for terminal state
    if (depth === 0 || validMoves.length === 0 || this.isTerminalNode(board)) {
      return { 
        score: this.evaluateBoard(board, maximizingPlayer ? 2 : 1),
        column: null
      };
    }

    let value = maximizingPlayer ? -Infinity : Infinity;
    let column = validMoves[0];

    for (const col of validMoves) {
      // Create a deep copy of the board
      const boardCopy = board.map(row => [...row]);
      
      // Simulate drop
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = maximizingPlayer ? 2 : 1;
      
      // Recursive call
      const newScore = this.minimax(
        boardCopy, 
        depth - 1, 
        alpha, 
        beta, 
        !maximizingPlayer,
        startTime,
        timeLimit
      ).score;
      
      // Update value based on maximizing or minimizing player
      if (maximizingPlayer) {
        if (newScore > value) {
          value = newScore;
          column = col;
        }
        alpha = Math.max(alpha, value);
      } else {
        if (newScore < value) {
          value = newScore;
          column = col;
        }
        beta = Math.min(beta, value);
      }
      
      // Alpha-beta pruning
      if (alpha >= beta) {
        break;
      }
    }
    
    return { score: value, column };
  }

  getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === null) {
        validMoves.push(col);
      }
    }
    return validMoves;
  }

  getNextOpenRow(board, col) {
    for (let r = 5; r >= 0; r--) {
      if (board[r][col] === null) {
        return r;
      }
    }
    return -1;
  }

  isTerminalNode(board) {
    // Check for win
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] !== null) {
          // Check horizontal
          if (c <= 3) {
            const horizontal = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
            if (horizontal.every(val => val === 1) || horizontal.every(val => val === 2)) {
              return true;
            }
          }
          
          // Check vertical
          if (r <= 2) {
            const vertical = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
            if (vertical.every(val => val === 1) || vertical.every(val => val === 2)) {
              return true;
            }
          }
          
          // Check diagonal /
          if (r <= 2 && c <= 3) {
            const diagonal = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
            if (diagonal.every(val => val === 1) || diagonal.every(val => val === 2)) {
              return true;
            }
          }
          
          // Check diagonal \
          if (r <= 2 && c >= 3) {
            const diagonal = [board[r][c], board[r+1][c-1], board[r+2][c-2], board[r+3][c-3]];
            if (diagonal.every(val => val === 1) || diagonal.every(val => val === 2)) {
              return true;
            }
          }
        }
      }
    }
    
    // Check for draw (full board)
    let isFull = true;
    for (let c = 0; c < 7; c++) {
      if (board[0][c] === null) {
        isFull = false;
        break;
      }
    }
    
    return isFull;
  }

  evaluateBoard(board, player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    
    // Center column preference
    const centerColumn = 3;
    const centerCount = board.filter(row => row[centerColumn] === player).length;
    score += centerCount * 3;
    
    // Horizontal evaluation
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    
    // Vertical evaluation
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 3; r++) {
        const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    
    // Diagonal / evaluation
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    
    // Diagonal \ evaluation
    for (let r = 0; r < 3; r++) {
      for (let c = 3; c < 7; c++) {
        const window = [board[r][c], board[r+1][c-1], board[r+2][c-2], board[r+3][c-3]];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    
    return score;
  }

  evaluateWindow(window, player, opponent) {
    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === null).length;
    const opponentCount = window.filter(cell => cell === opponent).length;
    
    if (playerCount === 4) {
      return 100;
    } else if (playerCount === 3 && emptyCount === 1) {
      return 5;
    } else if (playerCount === 2 && emptyCount === 2) {
      return 2;
    } else if (opponentCount === 3 && emptyCount === 1) {
      return -4; // Block opponent's three in a row
    }
    
    return 0;
  }
}

module.exports = Game;