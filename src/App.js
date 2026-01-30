import React from 'react';
import Board from './components/Board';
import Dice from './components/Dice';
import Scoreboard from './components/Scoreboard';
import WinModal from './components/WinModal';
import { useGame } from './hooks/useGame';
import { PLAYERS, PLAYER_COLORS } from './utils/gameConstants';

function App() {
  const {
    tokens,
    currentPlayer,
    diceValue,
    canRoll,
    canMove,
    movableTokens,
    message,
    winner,
    rollDice,
    moveToken,
    resetGame
  } = useGame();

  return (
    <div className="game-container">
      <h1>Ludo Game</h1>
      
      <div className="game-info">
        <div className="current-player">
          <span>Current Turn:</span>
          <div 
            className="player-indicator" 
            style={{ backgroundColor: PLAYER_COLORS[PLAYERS[currentPlayer]] }}
          />
        </div>
        
        <Dice 
          value={diceValue}
          onRoll={rollDice}
          canRoll={canRoll && currentPlayer === 0}
        />
      </div>
      
      <div className="board-container">
        <Board 
          tokens={tokens}
          movableTokens={currentPlayer === 0 && canMove ? movableTokens : []}
          onTokenClick={(tokenIndex) => moveToken('red', tokenIndex)}
        />
      </div>
      
      <Scoreboard tokens={tokens} />
      
      <div className="message">{message}</div>
      
      <button className="new-game-btn" onClick={resetGame}>
        New Game
      </button>
      
      {winner && (
        <WinModal 
          winner={winner}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );
}

export default App;
