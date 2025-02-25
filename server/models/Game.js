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

    const MAX_DEPTH = 7; // Increased depth from 5 to 7
    const startTime = Date.now();
    let timeLimit = 4500; // 4.5 seconds to ensure we don't exceed the 5-second limit

    // Check for immediate winning moves or blocking moves first
    const immediateMove = this.checkForImmediateMove();
    if (immediateMove !== null) {
      return immediateMove;
    }

    // Consider opening moves for better strategy
    if (this.isOpeningPhase()) {
      return this.getOpeningMove();
    }

    // Use iterative deepening to get the best possible move within the time limit
    let bestMove = null;
    for (let currentDepth = 1; currentDepth <= MAX_DEPTH; currentDepth++) {
      const moveResult = this.minimax(this.board, currentDepth, -Infinity, Infinity, true, startTime, timeLimit);
      
      // If we've exceeded our time limit, break out and use the last complete depth
      if (Date.now() - startTime > timeLimit) {
        break;
      }
      
      bestMove = moveResult.column;
    }

    // If somehow we don't have a move, use a fallback strategy
    if (bestMove === null) {
      const validMoves = this.getValidMoves(this.board);
      // Prefer center column, then adjacent columns
      const columnPreference = [3, 2, 4, 1, 5, 0, 6];
      for (const col of columnPreference) {
        if (validMoves.includes(col)) {
          return col;
        }
      }
      return validMoves[0]; // Fallback to first valid move
    }

    return bestMove;
  }

  // Check for an immediate winning move or a move to block opponent's win
  checkForImmediateMove() {
    const validMoves = this.getValidMoves(this.board);
    
    // First check if AI can win in one move
    for (const col of validMoves) {
      const boardCopy = this.board.map(row => [...row]);
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = 2; // AI player
      
      if (this.checkWinForBoard(boardCopy, row, col)) {
        return col; // Found winning move
      }
    }
    
    // Then check if need to block opponent's win
    for (const col of validMoves) {
      const boardCopy = this.board.map(row => [...row]);
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = 1; // Human player
      
      if (this.checkWinForBoard(boardCopy, row, col)) {
        return col; // Found blocking move
      }
    }
    
    return null; // No immediate move found
  }

  // Custom win check for a given board state
  checkWinForBoard(board, row, col) {
    const player = board[row][col];
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
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) {
          break;
        }
        count++;
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) {
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

  // Determine if we're in the opening phase of the game
  isOpeningPhase() {
    let pieceCount = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (this.board[r][c] !== null) {
          pieceCount++;
        }
      }
    }
    return pieceCount <= 6; // First 6 moves
  }

  // Get a strategic opening move
  getOpeningMove() {
    const validMoves = this.getValidMoves(this.board);
    
    // In opening, always prefer center column if available
    if (validMoves.includes(3)) {
      return 3;
    }
    
    // Then prefer columns adjacent to center
    if (validMoves.includes(2)) return 2;
    if (validMoves.includes(4)) return 4;
    
    // Then other columns
    return validMoves[Math.floor(validMoves.length / 2)];
  }

  minimax(board, depth, alpha, beta, maximizingPlayer, startTime, timeLimit) {
    // Check for timeout
    if (Date.now() - startTime > timeLimit) {
      return { score: 0, column: null };
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

    // Use column ordering heuristic to improve alpha-beta pruning
    const orderedMoves = this.orderMoves(board, validMoves, maximizingPlayer ? 2 : 1);

    let value = maximizingPlayer ? -Infinity : Infinity;
    let column = orderedMoves[0];

    for (const col of orderedMoves) {
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

  // Order moves for more efficient alpha-beta pruning
  orderMoves(board, validMoves, player) {
    // We'll score each move and sort by score
    const moveScores = validMoves.map(col => {
      const boardCopy = board.map(row => [...row]);
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = player;
      
      // Get a quick evaluation score
      const score = this.evaluateBoard(boardCopy, player);
      return { col, score };
    });
    
    // Sort by score (descending)
    moveScores.sort((a, b) => b.score - a.score);
    
    // Return just the columns in sorted order
    return moveScores.map(move => move.col);
  }

  evaluateBoard(board, player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    
    // Check if this is a winning position (highest priority)
    if (this.isWinningBoard(board, player)) {
      return 10000;
    }
    
    // Check if this is a losing position (avoid)
    if (this.isWinningBoard(board, opponent)) {
      return -10000;
    }
    
    // Center column preference - stronger weight
    const centerColumn = 3;
    const centerCount = board.filter(row => row[centerColumn] === player).length;
    score += centerCount * 6;
    
    // Give more weight to lower rows (more stable positions)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] === player) {
          // More points for lower rows (r=5 is bottom row)
          score += (r + 1) * 0.5;
        }
      }
    }
    
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
    
    // Add strategic positions analysis
    score += this.evaluateStrategicPositions(board, player, opponent);
    
    return score;
  }

  // Check if board is winning for a player
  isWinningBoard(board, player) {
    // Horizontal check
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && 
            board[r][c+1] === player && 
            board[r][c+2] === player && 
            board[r][c+3] === player) {
          return true;
        }
      }
    }
    
    // Vertical check
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 3; r++) {
        if (board[r][c] === player && 
            board[r+1][c] === player && 
            board[r+2][c] === player && 
            board[r+3][c] === player) {
          return true;
        }
      }
    }
    
    // Diagonal / check
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && 
            board[r+1][c+1] === player && 
            board[r+2][c+2] === player && 
            board[r+3][c+3] === player) {
          return true;
        }
      }
    }
    
    // Diagonal \ check
    for (let r = 0; r < 3; r++) {
      for (let c = 3; c < 7; c++) {
        if (board[r][c] === player && 
            board[r+1][c-1] === player && 
            board[r+2][c-2] === player && 
            board[r+3][c-3] === player) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Evaluate strategic positions like forks and double threats
  evaluateStrategicPositions(board, player, opponent) {
    let score = 0;
    
    // Check for potential "forks" - multiple threats
    score += this.evaluateForks(board, player) * 15;
    
    // Penalize for opponent forks
    score -= this.evaluateForks(board, opponent) * 20;
    
    // Avoid moves that set up opponent for a win
    score += this.evaluateTraps(board, player, opponent) * 8;
    
    return score;
  }
  
  // Count potential fork positions (two ways to win)
  evaluateForks(board, player) {
    let forkCount = 0;
    const validMoves = this.getValidMoves(board);
    
    for (const col of validMoves) {
      const boardCopy = board.map(row => [...row]);
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = player;
      
      // Count threats (3-in-a-rows with an open end)
      let threatCount = 0;
      
      // Horizontal threats
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 4; c++) {
          const window = [boardCopy[r][c], boardCopy[r][c+1], boardCopy[r][c+2], boardCopy[r][c+3]];
          const playerCount = window.filter(cell => cell === player).length;
          const emptyCount = window.filter(cell => cell === null).length;
          
          if (playerCount === 3 && emptyCount === 1) {
            threatCount++;
          }
        }
      }
      
      // Vertical threats
      for (let c = 0; c < 7; c++) {
        for (let r = 0; r < 3; r++) {
          const window = [boardCopy[r][c], boardCopy[r+1][c], boardCopy[r+2][c], boardCopy[r+3][c]];
          const playerCount = window.filter(cell => cell === player).length;
          const emptyCount = window.filter(cell => cell === null).length;
          
          if (playerCount === 3 && emptyCount === 1) {
            threatCount++;
          }
        }
      }
      
      // Diagonal threats
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const window = [boardCopy[r][c], boardCopy[r+1][c+1], boardCopy[r+2][c+2], boardCopy[r+3][c+3]];
          const playerCount = window.filter(cell => cell === player).length;
          const emptyCount = window.filter(cell => cell === null).length;
          
          if (playerCount === 3 && emptyCount === 1) {
            threatCount++;
          }
        }
      }
      
      for (let r = 0; r < 3; r++) {
        for (let c = 3; c < 7; c++) {
          const window = [boardCopy[r][c], boardCopy[r+1][c-1], boardCopy[r+2][c-2], boardCopy[r+3][c-3]];
          const playerCount = window.filter(cell => cell === player).length;
          const emptyCount = window.filter(cell => cell === null).length;
          
          if (playerCount === 3 && emptyCount === 1) {
            threatCount++;
          }
        }
      }
      
      // If there are multiple threats from one move, it's a fork
      if (threatCount >= 2) {
        forkCount++;
      }
    }
    
    return forkCount;
  }
  
  // Evaluate if a move sets up a trap for the opponent
  evaluateTraps(board, player, opponent) {
    let trapScore = 0;
    const validMoves = this.getValidMoves(board);
    
    for (const col of validMoves) {
      // Simulate player's move
      const boardCopy = board.map(row => [...row]);
      const row = this.getNextOpenRow(boardCopy, col);
      boardCopy[row][col] = player;
      
      // Check opponent's possible responses
      const newValidMoves = this.getValidMoves(boardCopy);
      let badMoveCount = 0;
      
      for (const opponentCol of newValidMoves) {
        const boardCopy2 = boardCopy.map(row => [...row]);
        const opponentRow = this.getNextOpenRow(boardCopy2, opponentCol);
        boardCopy2[opponentRow][opponentCol] = opponent;
        
        // Check if this gives player a winning move next turn
        const finalValidMoves = this.getValidMoves(boardCopy2);
        for (const finalCol of finalValidMoves) {
          const boardCopy3 = boardCopy2.map(row => [...row]);
          const finalRow = this.getNextOpenRow(boardCopy3, finalCol);
          boardCopy3[finalRow][finalCol] = player;
          
          if (this.checkWinForBoard(boardCopy3, finalRow, finalCol)) {
            badMoveCount++;
            break;
          }
        }
      }
      
      // If many opponent responses lead to player win, this is a good trap
      if (badMoveCount > 0) {
        trapScore += badMoveCount;
      }
    }
    
    return trapScore;
  }

  evaluateWindow(window, player, opponent) {
    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === null).length;
    const opponentCount = window.filter(cell => cell === opponent).length;
    
    // Must have no opponent pieces to be a valid window for scoring
    if (opponentCount > 0) {
      // Special case: block opponent's three in a row
      if (opponentCount === 3 && emptyCount === 1) {
        return -25; // Very important to block
      }
      // Less urgent: block opponent's two in a row
      else if (opponentCount === 2 && emptyCount === 2) {
        return -5;
      }
      return 0;
    }
    
    if (playerCount === 4) {
      return 100; // Win
    } else if (playerCount === 3 && emptyCount === 1) {
      return 20; // Strong threat
    } else if (playerCount === 2 && emptyCount === 2) {
      return 5; // Developing position
    } else if (playerCount === 1 && emptyCount === 3) {
      return 1; // Potential for future
    }
    
    return 0;
  }
}

module.exports = Game;