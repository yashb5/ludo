import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4001');

export function useMultiplayerGame() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerIndex, setPlayerIndex] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [inLobby, setInLobby] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('roomJoined', (data) => {
      setRoomId(data.roomId);
      setPlayerIndex(data.playerIndex);
      setPlayerColor(data.color);
      setPlayers(data.players);
      setGameState(data.gameState);
      setInLobby(false);
      setError('');
    });

    socket.on('roomUpdate', (data) => {
      setPlayers(data.players);
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    socket.on('gameStart', (gameState) => {
      setGameState(gameState);
    });

    socket.on('gameUpdate', (newGameState) => {
      setGameState(newGameState);
    });

    socket.on('playerLeft', (data) => {
      setPlayers(data.players);
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    socket.on('roomError', (errorMsg) => {
      setError(errorMsg);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('roomUpdate');
      socket.off('gameStart');
      socket.off('gameUpdate');
      socket.off('roomError');
    };
  }, []);

  const createRoom = (roomId, playerName) => {
    socket.emit('createRoom', { roomId, playerName });
  };

  const joinRoom = (roomId, playerName) => {
    socket.emit('joinRoom', { roomId, playerName });
  };

  const rollDice = () => {
    if (roomId && playerIndex !== null) {
      socket.emit('rollDice', { roomId, playerIndex });
    }
  };

  const exitRoom = () => {
    if (roomId) {
      socket.emit('exitRoom', { roomId, playerIndex });
      // Immediately go back to lobby
      setRoomId('');
      setPlayerIndex(null);
      setPlayerColor(null);
      setPlayers([]);
      setGameState(null);
      setInLobby(true);
      setError('');
    }
  };

  const moveToken = (tokenIndex) => {
    if (roomId && playerIndex !== null) {
      socket.emit('moveToken', { roomId, playerIndex, tokenIndex });
    }
  };

  return {
    roomId,
    playerName,
    setPlayerName,
    playerIndex,
    playerColor,
    players,
    gameState,
    inLobby,
    error,
    createRoom,
    joinRoom,
    rollDice,
    moveToken,
    exitRoom
  };
}