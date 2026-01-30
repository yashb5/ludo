import React, { useEffect } from 'react';
import Board from './components/Board';
import Dice from './components/Dice';
import Scoreboard from './components/Scoreboard';
import WinModal from './components/WinModal';
import Lobby from './components/Lobby';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { PLAYERS, PLAYER_COLORS } from './utils/gameConstants';

function App() {
  const {
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
  } = useMultiplayerGame();

  useEffect(() => {
    if (gameState?.winner && gameState.winner !== playerColor) {
      setTimeout(() => playLossSound(), 500);
    }
  }, [gameState?.winner, playerColor]);

  if (inLobby) {
    return (
      <Lobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
      />
    );
  }

  if (!gameState) {
    return <div className="loading">Loading game...</div>;
  }

  const {
    tokens,
    currentPlayer,
    diceValue,
    canRoll,
    canMove,
    movableTokens,
    message,
    winner,
    isRolling
  } = gameState;

  const isMyTurn = currentPlayer === playerIndex;

  const isGameOver = !!winner;
  const isLoser = isGameOver && winner !== playerColor;

  const playLossSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime + 0.3); // G4
    oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.6); // E4

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  return (
    <div className={`game-container ${isLoser ? 'loss-state' : ''}`}>
      <div className="top-bar">
        <h1>Ludo Game - Room: {roomId}</h1>

        <div className="players-list">
        {players.map((player, idx) => (
          <div key={idx} className={`player-info ${idx === currentPlayer ? 'active' : ''}`}>
            <div
              className="player-indicator"
              style={{ backgroundColor: PLAYER_COLORS[player.color] }}
            />
            <span>{player.name}</span>
            {idx === playerIndex && <span>(You)</span>}
          </div>
        ))}
      </div>

      <div className="game-info">
        <div className="current-player">
          <span>Turn:</span>
          <div
            className="player-indicator"
            style={{ backgroundColor: PLAYER_COLORS[players[currentPlayer]?.color] }}
          />
          <span>{players[currentPlayer]?.name}</span>
        </div>

        <Dice
          value={diceValue}
          onRoll={rollDice}
          canRoll={canRoll && isMyTurn}
          isRolling={isRolling}
        />

        <button className="exit-room-btn" onClick={exitRoom}>
          Exit
        </button>
      </div>
      </div>

      <div className="game-area">
        <div className="game-main">
          <div className="board-container">
        <Board
          tokens={tokens}
          movableTokens={isMyTurn && canMove ? movableTokens : []}
          onTokenClick={isMyTurn ? moveToken : () => {}}
          playerColor={playerColor}
        />
      </div>

          <div className="message">{message}</div>
        </div>

        <div className="side-panel">
          <Scoreboard tokens={tokens} players={players} playerIndex={playerIndex} />
        </div>
      </div>

      {winner && (
        <WinModal
          winner={winner}
          onPlayAgain={() => window.location.reload()}
        />
      )}
    </div>
  );
}

export default App;
