import React from 'react';

function WinModal({ winner, onPlayAgain }) {
  const isHumanWin = winner === 'red';
  
  return (
    <div className="modal show">
      <div className="modal-content">
        <h2 style={{ color: isHumanWin ? '#27ae60' : '#e74c3c' }}>
          {isHumanWin ? 'Congratulations! You Won!' : 'Game Over'}
        </h2>
        <p>
          {isHumanWin 
            ? 'You beat all AI opponents!' 
            : `${winner.charAt(0).toUpperCase() + winner.slice(1)} won the game.`
          }
        </p>
        <button onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default WinModal;
