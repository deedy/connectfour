class Game {
  constructor(id) {
    this.id = id;
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.currentPlayer = 1; // 1 or 2
    this.gameMode = null; // '1p' or '2p' or 'ai'
    this.gameStatus = 'waiting'; // 'waiting', 'playing', 'finished'
    this.winner = null; // null, 1, 2, 'draw'
    this.lastMove = null; // {row, col}
    this.created = new Date().toISOString();
    this.lastActivity = new Date().toISOString();
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
    this.lastActivity = new Date().toISOString();

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
    this.lastActivity = new Date().toISOString();
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
      lastMove: this.lastMove,
      created: this.created,
      lastActivity: this.lastActivity,
      aiMetrics: this.aiMetrics || null
    };
  }
  
  getAIMoveForPlayer(player) {
    if (this.gameStatus !== 'playing') {
      return null;
    }
    
    const startTime = Date.now();
    
    // Initialize metrics for this AI move
    this.aiMetrics = {
      calculationTimeMs: 0,
      searchDepth: 0,
      positionsEvaluated: 0,
      moveSelected: null,
      reasonForMove: "Default strategy"
    };
    
    // Temporarily set currentPlayer to the AI player if needed
    const originalPlayer = this.currentPlayer;
    if (this.currentPlayer !== player) {
      this.currentPlayer = player;
    }
    
    const MAX_DEPTH = 8; // Good depth for AI vs AI
    let timeLimit = 3000; // 3 seconds for AI vs AI to balance speed with intelligence
    
    // Check for immediate winning moves or blocking moves first
    const immediateMove = this.checkForImmediateMove();
    if (immediateMove !== null) {
      // Update metrics
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = 1;
      this.aiMetrics.positionsEvaluated = 14; // Just checking immediate moves
      this.aiMetrics.moveSelected = immediateMove;
      this.aiMetrics.reasonForMove = "Found immediate winning move or blocking opponent's win";
      
      // Reset player if needed
      if (this.currentPlayer !== originalPlayer) {
        this.currentPlayer = originalPlayer;
      }
      
      return immediateMove;
    }

    // Check for special defensive patterns
    const specialDefensiveMove = this.checkForSpecialDefensiveMoves();
    if (specialDefensiveMove !== null) {
      // Update metrics
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = 2;
      this.aiMetrics.positionsEvaluated = 20; // Approximate for pattern matching
      this.aiMetrics.moveSelected = specialDefensiveMove;
      this.aiMetrics.reasonForMove = "Detected and countered special pattern threat";
      
      // Reset player if needed
      if (this.currentPlayer !== originalPlayer) {
        this.currentPlayer = originalPlayer;
      }
      
      return specialDefensiveMove;
    }
    
    // Use iterative deepening to get the best possible move within the time limit
    let bestMove = null;
    let finalDepth = 0;
    let positionsCount = 0;
    
    for (let currentDepth = 1; currentDepth <= MAX_DEPTH; currentDepth++) {
      // Reset positions count for this depth
      this.positionsEvaluated = 0;
      
      const moveResult = this.minimax(
        this.board, 
        currentDepth, 
        -Infinity, 
        Infinity, 
        true, 
        startTime, 
        timeLimit
      );
      
      // Store the depth we reached
      finalDepth = currentDepth;
      positionsCount += this.positionsEvaluated;
      
      // If we've exceeded our time limit, break out and use the last complete depth
      if (Date.now() - startTime > timeLimit || this.positionsEvaluated === 0) {
        break;
      }
      
      bestMove = moveResult.column;
    }
    
    // Update final AI metrics
    this.aiMetrics.calculationTimeMs = Date.now() - startTime;
    this.aiMetrics.searchDepth = finalDepth;
    this.aiMetrics.positionsEvaluated = positionsCount;
    this.aiMetrics.moveSelected = bestMove;
    this.aiMetrics.reasonForMove = `Minimax search to depth ${finalDepth}`;
    
    // Reset the player if needed
    if (this.currentPlayer !== originalPlayer) {
      this.currentPlayer = originalPlayer;
    }
    
    return bestMove;
  }
  
  // Check for special defensive patterns like the bottom-middle-three vulnerability
  checkForSpecialDefensiveMoves() {
    const player = this.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    
    // 1. Check if opponent is setting up the bottom-middle-three trap
    const opponentPiecesCenter = [];
    
    // Check bottom row, center area (columns 2, 3, 4)
    for (let col = 2; col <= 4; col++) {
      if (this.board[5][col] === opponent) {
        opponentPiecesCenter.push({ row: 5, col });
      }
    }
    
    // If opponent has 2 pieces in the bottom middle three spots
    if (opponentPiecesCenter.length === 2) {
      // Find the empty column in the bottom middle three
      for (let col = 2; col <= 4; col++) {
        if (this.board[5][col] === null) {
          // We should place our piece here to block the trap
          return col;
        }
      }
    }
    
    // Check if opponent already has 3 pieces in the bottom middle
    if (opponentPiecesCenter.length === 3) {
      // This is very dangerous, high priority to block
      // Check which column needs immediate attention
      for (let col = 2; col <= 4; col++) {
        // If the row above is empty, place there to start blocking
        if (this.board[4][col] === null) {
          return col;
        }
      }
    }
    
    // 2. Check for ANY three in a row at the bottom
    const bottomOpponentPieces = [];
    for (let col = 0; col < 7; col++) {
      if (this.board[5][col] === opponent) {
        bottomOpponentPieces.push({ col });
      }
    }
    
    // Count sequences of 3 adjacent opponent pieces on bottom row
    for (let startCol = 0; startCol <= 4; startCol++) {
      let consecutiveCount = 0;
      for (let i = 0; i < 3; i++) {
        if (this.board[5][startCol + i] === opponent) {
          consecutiveCount++;
        }
      }
      
      // If there are 3 consecutive opponent pieces
      if (consecutiveCount === 3) {
        // Check if we can place a piece on either end to block
        if (startCol > 0 && this.board[5][startCol - 1] === null) {
          return startCol - 1;
        }
        if (startCol + 3 < 7 && this.board[5][startCol + 3] === null) {
          return startCol + 3;
        }
      }
    }
    
    // 3. Avoid setting up a winning move for opponent
    // If there's a potential winning sequence in the middle columns at bottom
    for (let col = 1; col < 6; col++) {
      // Only check empty slots
      if (this.board[5][col] === null) {
        // Check if placing our piece here would create a winning move for opponent above
        // (i.e., avoid creating a perfect setup for them)
        if (this.board[4][col] === null) { // Slot above is empty
          // Make a simulation
          const boardCopy = this.board.map(row => [...row]);
          boardCopy[5][col] = player; // Our move
          boardCopy[4][col] = opponent; // Potential opponent's next move
          
          // Check if this creates a win for the opponent
          if (this.checkWinForBoard(boardCopy, 4, col)) {
            // Avoid this move if possible and if we have better options
            // Instead prefer center or near-center columns
            const centerPreference = [3, 2, 4, 1, 5, 0, 6];
            for (const preferredCol of centerPreference) {
              if (preferredCol !== col && this.board[5][preferredCol] === null) {
                return preferredCol;
              }
            }
          }
        }
      }
    }
    
    // 4. Prefer center and adjacent columns if no specific threat
    const validMoves = this.getValidMoves(this.board);
    const centerPreference = [3, 2, 4, 1, 5];
    for (const col of centerPreference) {
      if (validMoves.includes(col)) {
        return col;
      }
    }
    
    return null;
  }

  // AI methods
  getAIMove() {
    // For regular 1p mode, use the AI as player 2
    if (this.currentPlayer !== 2 || this.gameStatus !== 'playing') {
      return null;
    }

    const MAX_DEPTH = 9; // Increase max depth to 9
    const startTime = Date.now();
    let timeLimit = 7000; // 7 seconds for more thorough search
    
    // Initialize metrics for this AI move
    this.aiMetrics = {
      calculationTimeMs: 0,
      searchDepth: 0,
      positionsEvaluated: 0,
      moveSelected: null,
      reasonForMove: "Default strategy"
    };

    // Check for immediate winning moves or blocking moves first
    const immediateMove = this.checkForImmediateMove();
    if (immediateMove !== null) {
      // Update metrics
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = 1;
      this.aiMetrics.positionsEvaluated = 14; // Just checking immediate moves
      this.aiMetrics.moveSelected = immediateMove;
      this.aiMetrics.reasonForMove = "Found immediate winning move or blocking opponent's win";
      
      return immediateMove;
    }

    // Consider opening moves for better strategy
    if (this.isOpeningPhase()) {
      const openingMove = this.getOpeningMove();
      
      // Update metrics
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = 1;
      this.aiMetrics.positionsEvaluated = 7; // Evaluating opening book
      this.aiMetrics.moveSelected = openingMove;
      this.aiMetrics.reasonForMove = "Using opening book strategy";
      
      return openingMove;
    }
    
    // Check for the bottom-middle-three vulnerability
    const specialDefensiveMove = this.checkForSpecialDefensiveMoves();
    if (specialDefensiveMove !== null) {
      // Update metrics
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = 2;
      this.aiMetrics.positionsEvaluated = 20; // Approximate for pattern matching
      this.aiMetrics.moveSelected = specialDefensiveMove;
      this.aiMetrics.reasonForMove = "Detected and countered special pattern threat";
      
      return specialDefensiveMove;
    }

    // Use iterative deepening to get the best possible move within the time limit
    let bestMove = null;
    let finalDepth = 0;
    let positionsCount = 0;
    
    for (let currentDepth = 1; currentDepth <= MAX_DEPTH; currentDepth++) {
      // Reset positions count for this depth
      this.positionsEvaluated = 0;
      
      const moveResult = this.minimax(
        this.board, 
        currentDepth, 
        -Infinity, 
        Infinity, 
        true, 
        startTime, 
        timeLimit
      );
      
      // Store the depth we reached
      finalDepth = currentDepth;
      positionsCount += this.positionsEvaluated;
      
      // If we've exceeded our time limit, break out and use the last complete depth
      if (Date.now() - startTime > timeLimit || this.positionsEvaluated === 0) {
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
          bestMove = col;
          break;
        }
      }
      // Final fallback
      if (bestMove === null && validMoves.length > 0) {
        bestMove = validMoves[0];
      }
      
      // Update metrics with fallback info
      this.aiMetrics.reasonForMove = "Using fallback strategy (center preference)";
    } else {
      // Update final AI metrics for minimax search
      this.aiMetrics.calculationTimeMs = Date.now() - startTime;
      this.aiMetrics.searchDepth = finalDepth;
      this.aiMetrics.positionsEvaluated = positionsCount;
      this.aiMetrics.moveSelected = bestMove;
      this.aiMetrics.reasonForMove = `Minimax search to depth ${finalDepth}`;
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
    return pieceCount <= 8; // Expanded to first 8 moves for better opening strategy
  }

  // Get a strategic opening move
  getOpeningMove() {
    const validMoves = this.getValidMoves(this.board);
    const player = this.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    
    // Always start in center column if possible
    if (this.board[5][3] === null) {
      return 3;
    }
    
    // Check for specific opening patterns that are known to be strong
    
    // If center column is taken by opponent, prefer column 2 or 4
    if (this.board[5][3] === opponent) {
      if (validMoves.includes(2)) return 2;
      if (validMoves.includes(4)) return 4;
    }
    
    // If we played in center, and opponent played adjacent, play on the other side to balance
    if (this.board[5][3] === player) {
      if (this.board[5][2] === opponent && validMoves.includes(4)) return 4;
      if (this.board[5][4] === opponent && validMoves.includes(2)) return 2;
    }
    
    // Avoid bottom corners in opening
    const avoidColumns = [0, 6];
    
    // Use center-weighted selection for opening
    // Prefer center, then adjacent, then further columns
    const centerPreference = [3, 2, 4, 1, 5, 0, 6];
    for (const col of centerPreference) {
      if (validMoves.includes(col) && !avoidColumns.includes(col)) {
        return col;
      }
    }
    
    // If somehow all preferred moves are unavailable, use any valid move
    return validMoves[0];
  }

  minimax(board, depth, alpha, beta, maximizingPlayer, startTime, timeLimit) {
    // Check for timeout
    if (Date.now() - startTime > timeLimit) {
      return { score: 0, column: null };
    }

    // Initialize position counter if not already set
    if (!this.positionsEvaluated) {
      this.positionsEvaluated = 0;
    }
    
    // Count this position
    this.positionsEvaluated++;

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
    
    // Center column preference - much stronger weight
    const centerColumn = 3;
    const centerCount = board.filter(row => row[centerColumn] === player).length;
    score += centerCount * 10; // Increased weight for center control
    
    // Reward pieces in the adjacent columns as well (strong control of middle)
    const adjacentColumns = [2, 4];
    for (const col of adjacentColumns) {
      const colCount = board.filter(row => row[col] === player).length;
      score += colCount * 5; // Good but not as valuable as center
    }
    
    // Penalize setting up too many pieces directly in the outermost columns 
    // (unless they lead to winning threats)
    const outerColumns = [0, 6];
    for (const col of outerColumns) {
      const colCount = board.filter(row => row[col] === player).length;
      // Only penalize if we have more than 1 piece here
      if (colCount > 1) {
        score -= (colCount - 1) * 2;
      }
    }
    
    // Give more weight to lower rows (more stable positions)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] === player) {
          // More points for lower rows (r=5 is bottom row)
          score += (r + 1) * 0.5;
        }
      }
    }
    
    // Extra penalty for creating a trap where opponent can win above our piece
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 5; r++) { // Skip top row
        if (board[r][c] === player && board[r+1][c] === null) {
          // We have a piece with an empty space above it
          // Check if opponent playing here would create a win
          const boardCopy = board.map(row => [...row]);
          boardCopy[r+1][c] = opponent;
          
          if (this.checkWinForBoard(boardCopy, r+1, c)) {
            score -= 30; // Significant penalty for allowing a win right above
          }
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
      // Critical case: block opponent's three in a row
      if (opponentCount === 3 && emptyCount === 1) {
        return -50; // Extremely important to block
      }
      // More urgent: block opponent's two in a row
      else if (opponentCount === 2 && emptyCount === 2) {
        return -8; // Higher priority than before
      }
      return 0;
    }
    
    if (playerCount === 4) {
      return 100; // Win
    } else if (playerCount === 3 && emptyCount === 1) {
      return 25; // Strong threat - higher value
    } else if (playerCount === 2 && emptyCount === 2) {
      return 7; // Developing position - higher value
    } else if (playerCount === 1 && emptyCount === 3) {
      return 1; // Potential for future
    }
    
    return 0;
  }
}

module.exports = Game;