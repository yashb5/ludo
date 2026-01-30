const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Game constants and utilities (copied from frontend)
const PLAYERS = ['red', 'green', 'yellow', 'blue'];
const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

function calculateNewPosition(player, currentPos, dice) {
  const startPos = START_POSITIONS[player];

  if (currentPos >= 52) {
    const homePos = currentPos - 52;
    const newHomePos = homePos + dice;
    if (newHomePos === 6) return 57;
    if (newHomePos > 6) return null;
    return 52 + newHomePos;
  }

  const absolutePos = (currentPos - startPos + 52) % 52;
  const newAbsolutePos = absolutePos + dice;

  if (newAbsolutePos > 50 && newAbsolutePos <= 56) {
    return 52 + (newAbsolutePos - 51);
  } else if (newAbsolutePos > 56) {
    return null;
  }

  return (currentPos + dice) % 52;
}

function getMovableTokens(player, tokens, dice) {
  const movable = [];
  const playerTokens = tokens[player];

  for (let i = 0; i < 4; i++) {
    const pos = playerTokens[i];

    if (pos === 57) continue;

    if (pos === -1) {
      if (dice === 6) movable.push(i);
    } else {
      const newPos = calculateNewPosition(player, pos, dice);
      if (newPos !== null) movable.push(i);
    }
  }

  return movable;
}

function checkWin(player, tokens) {
  return tokens[player].every(pos => pos === 57);
}

function canCapture(player, position, tokens) {
  if (SAFE_POSITIONS.includes(position)) return false;

  for (const otherPlayer of PLAYERS) {
    if (otherPlayer === player) continue;
    for (let i = 0; i < 4; i++) {
      if (tokens[otherPlayer][i] === position) return true;
    }
  }
  return false;
}

function processMove(player, tokenIndex, tokens, dice) {
  const pos = tokens[player][tokenIndex];
  let newPos;

  if (pos === -1) {
    newPos = START_POSITIONS[player];
  } else {
    newPos = calculateNewPosition(player, pos, dice);
  }

  const newTokens = { ...tokens };
  newTokens[player] = [...tokens[player]];
  newTokens[player][tokenIndex] = newPos;

  let captureMessage = null;

  if (newPos < 52 && !SAFE_POSITIONS.includes(newPos)) {
    for (const otherPlayer of PLAYERS) {
      if (otherPlayer === player) continue;
      for (let i = 0; i < 4; i++) {
        if (tokens[otherPlayer][i] === newPos) {
          newTokens[otherPlayer] = [...newTokens[otherPlayer]];
          newTokens[otherPlayer][i] = -1;
          captureMessage = `${player.charAt(0).toUpperCase() + player.slice(1)} captured ${otherPlayer}'s token!`;
        }
      }
    }
  }

  return { newTokens, newPos, captureMessage };
}

// Game rooms
const rooms = new Map();

function createRoom(roomId, playerName) {
  const initialTokens = {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1]
  };

  rooms.set(roomId, {
    players: [{ id: null, name: playerName, color: 'red' }],
    gameState: {
      tokens: initialTokens,
      currentPlayer: 0,
      diceValue: 0,
      canRoll: true,
      canMove: false,
      movableTokens: [],
      message: 'Waiting for players...',
      winner: null,
      isRolling: false
    },
    maxPlayers: 4,
    gameStarted: false
  });
}

function joinRoom(roomId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return null;

  if (room.gameStarted) return null;
  if (room.players.length >= room.maxPlayers) return null;

  const colors = ['red', 'green', 'yellow', 'blue'];
  const usedColors = room.players.map(p => p.color);
  const availableColor = colors.find(c => !usedColors.includes(c));

  room.players.push({ id: null, name: playerName, color: availableColor });
  return availableColor;
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.gameStarted = true;
  room.gameState.message = `${room.players[0].name}'s turn! Roll the dice.`;
  room.gameState.canRoll = true;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (data) => {
    const { roomId, playerName } = data;
    if (rooms.has(roomId)) {
      socket.emit('roomError', 'Room already exists');
      return;
    }

    createRoom(roomId, playerName);
    const room = rooms.get(roomId);
    const playerIndex = 0;
    room.players[playerIndex].id = socket.id;
    socket.join(roomId);

    socket.emit('roomJoined', {
      roomId,
      playerIndex,
      color: 'red',
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('roomUpdate', {
      players: room.players,
      gameState: room.gameState
    });
  });

  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    const color = joinRoom(roomId, playerName);
    if (!color) {
      socket.emit('roomError', 'Cannot join room');
      return;
    }

    const room = rooms.get(roomId);
    const playerIndex = room.players.length - 1;
    room.players[playerIndex].id = socket.id;
    socket.join(roomId);

    socket.emit('roomJoined', {
      roomId,
      playerIndex,
      color,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('roomUpdate', {
      players: room.players,
      gameState: room.gameState
    });

    // Auto-start if 2+ players
    if (room.players.length >= 2 && !room.gameStarted) {
      setTimeout(() => {
        startGame(roomId);
        io.to(roomId).emit('gameStart', room.gameState);
      }, 1000);
    }
  });

  socket.on('rollDice', (data) => {
    const { roomId, playerIndex } = data;
    const room = rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const gameState = room.gameState;
    if (gameState.currentPlayer !== playerIndex || !gameState.canRoll || gameState.winner) return;

    gameState.isRolling = true;
    gameState.canRoll = false;
    gameState.message = `${room.players[playerIndex].name} is rolling...`;

    io.to(roomId).emit('gameUpdate', gameState);

    setTimeout(() => {
      const dice = Math.floor(Math.random() * 6) + 1;
      gameState.diceValue = dice;
      gameState.isRolling = false;

      const playerColor = room.players[playerIndex].color;
      const movable = getMovableTokens(playerColor, gameState.tokens, dice);

      if (movable.length === 0) {
        gameState.message = `${room.players[playerIndex].name} rolled ${dice}. No valid moves!`;

        io.to(roomId).emit('gameUpdate', gameState);

        setTimeout(() => {
          if (dice === 6) {
            gameState.canRoll = true;
            gameState.message = `${room.players[playerIndex].name} gets another turn! Roll again.`;
          } else {
            const nextPlayer = (gameState.currentPlayer + 1) % room.players.length;
            gameState.currentPlayer = nextPlayer;
            gameState.canRoll = true;
            gameState.message = `${room.players[nextPlayer].name}'s turn! Roll the dice.`;
          }
          io.to(roomId).emit('gameUpdate', gameState);
        }, 1000);
        return;
      }

      gameState.canMove = true;
      gameState.movableTokens = movable;

      if (movable.length === 1) {
        // Auto-move if only one option
        setTimeout(() => {
          const tokenIndex = movable[0];
          handleMove(roomId, playerIndex, tokenIndex);
        }, 500);
      } else {
        gameState.message = `${room.players[playerIndex].name} rolled ${dice}. Click a token to move!`;
        io.to(roomId).emit('gameUpdate', gameState);
      }
    }, 500);
  });

  socket.on('moveToken', (data) => {
    const { roomId, playerIndex, tokenIndex } = data;
    handleMove(roomId, playerIndex, tokenIndex);
  });

  socket.on('exitRoom', (data) => {
    const { roomId, playerIndex } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    // Remove player
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      // Delete room if empty
      rooms.delete(roomId);
    } else {
      // Update game state for remaining players
      if (room.gameStarted) {
        // Adjust currentPlayer if necessary
        if (room.gameState.currentPlayer >= room.players.length) {
          room.gameState.currentPlayer = 0;
        }
        // Reset game or adjust
        room.gameStarted = false;
        room.gameState = {
          tokens: {
            red: [-1, -1, -1, -1],
            green: [-1, -1, -1, -1],
            yellow: [-1, -1, -1, -1],
            blue: [-1, -1, -1, -1]
          },
          currentPlayer: 0,
          diceValue: 0,
          canRoll: true,
          canMove: false,
          movableTokens: [],
          message: 'Player left, game reset',
          winner: null,
          isRolling: false
        };
      }

      // Notify remaining players
      io.to(roomId).emit('playerLeft', {
        players: room.players,
        gameState: room.gameState
      });
    }
  });

  function handleMove(roomId, playerIndex, tokenIndex) {
    const room = rooms.get(roomId);
    if (!room || !room.gameStarted) return;

    const gameState = room.gameState;
    if (gameState.currentPlayer !== playerIndex || !gameState.canMove || gameState.winner) return;

    const playerColor = room.players[playerIndex].color;
    const { newTokens, newPos, captureMessage } = processMove(playerColor, tokenIndex, gameState.tokens, gameState.diceValue);

    gameState.tokens = newTokens;
    gameState.canMove = false;
    gameState.movableTokens = [];

    if (captureMessage) {
      gameState.message = captureMessage;
    }

    // Check for win
    if (checkWin(playerColor, newTokens)) {
      gameState.winner = playerColor;
      gameState.message = `${room.players[playerIndex].name} wins!`;
      io.to(roomId).emit('gameUpdate', gameState);
      return;
    }

    const gotSix = gameState.diceValue === 6;
    const finished = newPos === 57;

    if (gotSix && !finished) {
      gameState.canRoll = true;
      gameState.message = `${room.players[playerIndex].name} gets another turn!`;
    } else {
      const nextPlayer = (gameState.currentPlayer + 1) % room.players.length;
      gameState.currentPlayer = nextPlayer;
      gameState.canRoll = true;
      gameState.message = `${room.players[nextPlayer].name}'s turn! Roll the dice.`;
    }

    io.to(roomId).emit('gameUpdate', gameState);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle player disconnection
    for (const [roomId, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // Reset game if someone leaves
          room.gameStarted = false;
          room.gameState = {
            tokens: {
              red: [-1, -1, -1, -1],
              green: [-1, -1, -1, -1],
              yellow: [-1, -1, -1, -1],
              blue: [-1, -1, -1, -1]
            },
            currentPlayer: 0,
            diceValue: 0,
            canRoll: true,
            canMove: false,
            movableTokens: [],
            message: 'Player left, game reset',
            winner: null,
            isRolling: false
          };
          io.to(roomId).emit('roomUpdate', {
            players: room.players,
            gameState: room.gameState
          });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});