import React from 'react';
import { PLAYERS, PLAYER_COLORS } from '../utils/gameConstants';

function Scoreboard({ tokens }) {
  const getFinishedCount = (player) => {
    return tokens[player].filter(pos => pos === 57).length;
  };

  const playerNames = {
    red: 'You (Red)',
    green: 'AI (Green)',
    yellow: 'AI (Yellow)',
    blue: 'AI (Blue)'
  };

  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      {PLAYERS.map(player => (
        <div className="score-row" key={player}>
          <span 
            className="color-dot"
            style={{ backgroundColor: PLAYER_COLORS[player] }}
          />
          <span>{playerNames[player]}</span>
          <span>{getFinishedCount(player)}/4</span>
        </div>
      ))}
    </div>
  );
}

export default Scoreboard;
