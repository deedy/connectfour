# Connect Four Game

A web-based implementation of the classic Connect Four game with beautiful graphics, AI opponent using minimax algorithm with alpha-beta pruning, and game persistence.

## Features

- Beautiful interactive UI with smooth animations
- Two game modes:
  - 1 Player: Play against an AI that uses minimax algorithm with alpha-beta pruning
  - 2 Players: Play locally with a friend
- Real-time gameplay using Socket.io
- Game persistence (games continue after page refresh)
- Share your game with a friend via URL
- Responsive design that works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time communication**: Socket.io
- **AI**: Minimax algorithm with alpha-beta pruning

## Installation and Running

1. Clone this repository:
   ```
   git clone <repository-url>
   cd connectfour
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## How to Play

1. Choose a game mode (1 Player or 2 Players)
2. Click on any column to drop a piece
3. Connect four of your pieces horizontally, vertically, or diagonally to win
4. Use the "New Game" button to start a new game
5. Use the "Share Game" button to share the game with a friend

## AI Implementation

The AI opponent uses the minimax algorithm with alpha-beta pruning to determine the best move. It evaluates potential board states up to 5 moves ahead and makes decisions based on the following heuristics:

- Completed connect fours (highest priority)
- Potential connect fours (3-in-a-row with an empty space)
- Center column control (strategic advantage)
- Blocking opponent's potential connect fours

The AI has a 5-second time limit for making decisions to ensure responsive gameplay.

## License

MIT