import React from 'react';
import { PLAYERS, PLAYER_COLORS } from '../utils/gameConstants';

function Scoreboard({ tokens, players = [], playerIndex = null }) {
  const getFinishedCount = (player) => {
    return tokens[player].filter(pos => pos === 57).length;
  };

  const playerMap = {};
  players.forEach(p => playerMap[p.color] = p);

  const getPlayerDisplayName = (color) => {
    const player = playerMap[color];
    if (player) {
      const index = players.findIndex(p => p.color === color);
      const isYou = index === playerIndex;
      return isYou ? `${player.name} (You)` : player.name;
    } else {
      return `AI (${color.charAt(0).toUpperCase() + color.slice(1)})`;
    }
  };

  const activePlayers = players
    .filter(player => playerMap[player.color]) // Only joined players
    .sort((a, b) => PLAYERS.indexOf(a.color) - PLAYERS.indexOf(b.color)); // Sort by color order

  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      {activePlayers.map(player => {
        const index = players.findIndex(p => p.color === player.color);
        const isYou = index === playerIndex;
        const displayName = isYou ? `${player.name} (You)` : player.name;
        return (
          <div className="score-row" key={player.color}>
            <span
              className="color-dot"
              style={{ backgroundColor: PLAYER_COLORS[player.color] }}
            />
            <span>{displayName}</span>
            <span>{getFinishedCount(player.color)}/4</span>
          </div>
        );
      })}
    </div>
  );
}

export default Scoreboard;
