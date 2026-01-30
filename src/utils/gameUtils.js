import { 
  START_POSITIONS, 
  HOME_ENTRY, 
  SAFE_POSITIONS, 
  PLAYERS,
  CELL_SIZE,
  HOME_BASES,
  HOME_PATHS,
  TRACK
} from './gameConstants';

export function calculateNewPosition(player, currentPos, dice) {
  const startPos = START_POSITIONS[player];
  
  // Check if token is in home stretch
  if (currentPos >= 52) {
    const homePos = currentPos - 52;
    const newHomePos = homePos + dice;
    if (newHomePos === 6) return 57; // Exact to finish
    if (newHomePos > 6) return null; // Overshoot
    return 52 + newHomePos;
  }
  
  // Calculate absolute position based on player's perspective
  const absolutePos = (currentPos - startPos + 52) % 52;
  const newAbsolutePos = absolutePos + dice;
  
  if (newAbsolutePos > 50 && newAbsolutePos <= 56) {
    // Entering home stretch
    return 52 + (newAbsolutePos - 51);
  } else if (newAbsolutePos > 56) {
    // Would overshoot
    return null;
  }
  
  // Normal move on track
  return (currentPos + dice) % 52;
}

export function getMovableTokens(player, tokens, dice) {
  const movable = [];
  const playerTokens = tokens[player];
  
  for (let i = 0; i < 4; i++) {
    const pos = playerTokens[i];
    
    if (pos === 57) continue; // Already finished
    
    if (pos === -1) {
      // Token in home base, needs 6 to come out
      if (dice === 6) movable.push(i);
    } else {
      // Token on board
      const newPos = calculateNewPosition(player, pos, dice);
      if (newPos !== null) movable.push(i);
    }
  }
  
  return movable;
}

export function canCapture(player, position, tokens) {
  if (SAFE_POSITIONS.includes(position)) return false;
  
  for (const otherPlayer of PLAYERS) {
    if (otherPlayer === player) continue;
    for (let i = 0; i < 4; i++) {
      if (tokens[otherPlayer][i] === position) return true;
    }
  }
  return false;
}

export function selectAIMove(player, movableTokens, tokens, diceValue) {
  const playerTokens = tokens[player];
  
  // Check for capture opportunity
  for (const idx of movableTokens) {
    const pos = playerTokens[idx];
    let newPos;
    if (pos === -1) {
      newPos = START_POSITIONS[player];
    } else {
      newPos = calculateNewPosition(player, pos, diceValue);
    }
    
    if (newPos !== null && newPos < 52 && canCapture(player, newPos, tokens)) {
      return idx;
    }
  }
  
  // Check for finishing move
  for (const idx of movableTokens) {
    const pos = playerTokens[idx];
    const newPos = calculateNewPosition(player, pos, diceValue);
    if (newPos === 57) return idx;
  }
  
  // Prefer moving token closest to home
  let bestIdx = movableTokens[0];
  let bestProgress = -1;
  
  for (const idx of movableTokens) {
    const pos = playerTokens[idx];
    const progress = pos === -1 ? 0 : (pos >= 52 ? 52 + pos : pos);
    if (progress > bestProgress) {
      bestProgress = progress;
      bestIdx = idx;
    }
  }
  
  return bestIdx;
}

export function checkWin(player, tokens) {
  return tokens[player].every(pos => pos === 57);
}

export function getTokenScreenPosition(player, tokenIndex, tokens) {
  const pos = tokens[player][tokenIndex];
  
  if (pos === -1) {
    // In home base
    const base = HOME_BASES[player][tokenIndex];
    return { x: base.x * CELL_SIZE, y: base.y * CELL_SIZE };
  } else if (pos === 57) {
    // Finished - in center
    const angle = (tokenIndex / 4) * Math.PI * 2;
    return { 
      x: 7.5 * CELL_SIZE + Math.cos(angle) * CELL_SIZE * 0.5,
      y: 7.5 * CELL_SIZE + Math.sin(angle) * CELL_SIZE * 0.5
    };
  } else if (pos >= 52) {
    // In home stretch
    const homePos = pos - 52;
    const coord = HOME_PATHS[player][homePos];
    return { x: (coord.x + 0.5) * CELL_SIZE, y: (coord.y + 0.5) * CELL_SIZE };
  } else {
    // On main track
    const coord = TRACK[pos];
    return { x: (coord.x + 0.5) * CELL_SIZE, y: (coord.y + 0.5) * CELL_SIZE };
  }
}

export function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
