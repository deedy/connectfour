const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const gameManager = require('./models/GameManager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client/public')));

// API routes
app.get('/api/games', (req, res) => {
  res.json(gameManager.getAllGames());
});

app.get('/api/active-games', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  res.json(gameManager.getActiveGames(limit));
});

app.get('/api/games/:id', (req, res) => {
  const game = gameManager.getGame(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game.getState());
});

// Serve index.html for all other routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('createGame', () => {
    const game = gameManager.createGame();
    socket.join(game.id);
    io.to(game.id).emit('gameState', game.getState());
    console.log(`Game created: ${game.id}`);
  });

  socket.on('joinGame', (gameId) => {
    const game = gameManager.getGame(gameId);
    if (game) {
      socket.join(gameId);
      io.to(gameId).emit('gameState', game.getState());
      console.log(`Player joined game: ${gameId}`);
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('setGameMode', ({ gameId, mode }) => {
    const result = gameManager.setGameMode(gameId, mode);
    if (result) {
      const game = gameManager.getGame(gameId);
      io.to(gameId).emit('gameState', game.getState());
      console.log(`Game mode set: ${gameId} - ${mode}`);
    }
  });

  socket.on('makeMove', ({ gameId, col }) => {
    const result = gameManager.makeMove(gameId, col);
    if (result) {
      const game = gameManager.getGame(gameId);
      io.to(gameId).emit('gameState', game.getState());
      console.log(`Move made: ${gameId} - Column ${col}`);

      // If 1 player mode and it's AI's turn, make AI move
      if (game.gameMode === '1p' && game.currentPlayer === 2 && game.gameStatus === 'playing') {
        setTimeout(() => {
          const updatedGame = gameManager.getAIMove(gameId);
          if (updatedGame) {
            io.to(gameId).emit('gameState', updatedGame);
            console.log(`AI move made: ${gameId}`);
          }
        }, 500); // Small delay for AI move
      }
    }
  });
  
  socket.on('getActiveGames', () => {
    socket.emit('activeGames', gameManager.getActiveGames());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Set up broadcast function for the game manager to use
gameManager.setBroadcastFunction((gameId, state) => {
  io.to(gameId).emit('gameState', state);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});