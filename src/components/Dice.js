import React, { useState, useEffect } from 'react';

function Dice({ value, onRoll, canRoll }) {
  const [displayValue, setDisplayValue] = useState(value || '?');
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (value) {
      setDisplayValue(value);
    }
  }, [value]);

  const handleRoll = () => {
    if (!canRoll) return;
    
    setIsRolling(true);
    
    // Animate dice
    let rolls = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        setIsRolling(false);
        onRoll();
      }
    }, 50);
  };

  return (
    <div className="dice-container">
      <div className={`dice ${isRolling ? 'rolling' : ''}`}>
        {displayValue}
      </div>
      <button 
        className="roll-btn"
        onClick={handleRoll}
        disabled={!canRoll || isRolling}
      >
        Roll Dice
      </button>
    </div>
  );
}

export default Dice;
