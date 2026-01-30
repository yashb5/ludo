import React, { useRef, useEffect, useCallback } from 'react';
import { 
  BOARD_SIZE, 
  CELL_SIZE, 
  PLAYERS, 
  PLAYER_COLORS,
  SAFE_POSITIONS,
  HOME_PATHS,
  TRACK
} from '../utils/gameConstants';
import { getTokenScreenPosition, shadeColor } from '../utils/gameUtils';

function Board({ tokens, movableTokens, onTokenClick }) {
  const canvasRef = useRef(null);

  const drawBoard = useCallback((ctx) => {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    
    // Background
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    
    // Draw home bases
    drawHomeBase(ctx, 0, 0, '#e74c3c');
    drawHomeBase(ctx, 9, 0, '#27ae60');
    drawHomeBase(ctx, 9, 9, '#f1c40f');
    drawHomeBase(ctx, 0, 9, '#3498db');
    
    // Draw center
    drawCenter(ctx);
    
    // Draw track
    drawTrack(ctx);
    
    // Draw home paths
    drawHomePaths(ctx);
    
    // Draw grid lines
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, BOARD_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(BOARD_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, []);

  const drawTokens = useCallback((ctx) => {
    for (const player of PLAYERS) {
      const positionMap = {};
      tokens[player].forEach((pos, idx) => {
        const key = pos.toString();
        if (!positionMap[key]) positionMap[key] = [];
        positionMap[key].push(idx);
      });
      
      for (const [pos, indices] of Object.entries(positionMap)) {
        indices.forEach((idx, stackIdx) => {
          const screenPos = getTokenScreenPosition(player, idx, tokens);
          const offset = stackIdx * 5;
          const isMovable = player === 'red' && movableTokens.includes(idx);
          drawToken(ctx, screenPos.x - offset, screenPos.y - offset, PLAYER_COLORS[player], isMovable);
        });
      }
    }
  }, [tokens, movableTokens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    drawBoard(ctx);
    drawTokens(ctx);
  }, [drawBoard, drawTokens]);

  const handleClick = (event) => {
    if (movableTokens.length === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    for (const idx of movableTokens) {
      const tokenPos = getTokenScreenPosition('red', idx, tokens);
      const dist = Math.sqrt((x - tokenPos.x) ** 2 + (y - tokenPos.y) ** 2);
      
      if (dist < CELL_SIZE * 0.6) {
        onTokenClick(idx);
        return;
      }
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      id="gameBoard"
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      onClick={handleClick}
      style={{ cursor: movableTokens.length > 0 ? 'pointer' : 'default' }}
    />
  );
}

function drawHomeBase(ctx, startX, startY, color) {
  ctx.fillStyle = color;
  ctx.fillRect(startX * CELL_SIZE, startY * CELL_SIZE, 6 * CELL_SIZE, 6 * CELL_SIZE);
  
  ctx.fillStyle = '#fff';
  ctx.fillRect((startX + 0.8) * CELL_SIZE, (startY + 0.8) * CELL_SIZE, 4.4 * CELL_SIZE, 4.4 * CELL_SIZE);
  
  const positions = [
    { x: startX + 1.5, y: startY + 1.5 },
    { x: startX + 3.5, y: startY + 1.5 },
    { x: startX + 1.5, y: startY + 3.5 },
    { x: startX + 3.5, y: startY + 3.5 }
  ];
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  positions.forEach(pos => {
    ctx.beginPath();
    ctx.arc(pos.x * CELL_SIZE, pos.y * CELL_SIZE, CELL_SIZE * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawCenter(ctx) {
  const cx = 7.5 * CELL_SIZE;
  const cy = 7.5 * CELL_SIZE;
  
  const colors = ['#e74c3c', '#27ae60', '#f1c40f', '#3498db'];
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const angle1 = angles[i] - Math.PI / 4;
    const angle2 = angles[i] + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(angle1) * CELL_SIZE * 2.1, cy + Math.sin(angle1) * CELL_SIZE * 2.1);
    ctx.lineTo(cx + Math.cos(angle2) * CELL_SIZE * 2.1, cy + Math.sin(angle2) * CELL_SIZE * 2.1);
    ctx.closePath();
    ctx.fill();
  });
}

function drawTrack(ctx) {
  const safeCoords = SAFE_POSITIONS.map(pos => TRACK[pos]);
  
  safeCoords.forEach(coord => {
    ctx.fillStyle = '#ddd';
    ctx.fillRect(coord.x * CELL_SIZE + 2, coord.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    
    ctx.fillStyle = '#ffd700';
    drawStar(ctx, (coord.x + 0.5) * CELL_SIZE, (coord.y + 0.5) * CELL_SIZE, 5, CELL_SIZE * 0.25, CELL_SIZE * 0.12);
  });
  
  const startColors = { 0: '#e74c3c', 13: '#27ae60', 26: '#f1c40f', 39: '#3498db' };
  for (const [pos, color] of Object.entries(startColors)) {
    const coord = TRACK[parseInt(pos)];
    ctx.fillStyle = color;
    ctx.fillRect(coord.x * CELL_SIZE + 2, coord.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }
}

function drawHomePaths(ctx) {
  for (const [player, path] of Object.entries(HOME_PATHS)) {
    const color = PLAYER_COLORS[player];
    path.forEach(coord => {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(coord.x * CELL_SIZE + 2, coord.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.globalAlpha = 1;
    });
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function drawToken(ctx, x, y, color, highlight = false) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, CELL_SIZE * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  // Token body
  const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, CELL_SIZE * 0.35);
  gradient.addColorStop(0, '#fff');
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, shadeColor(color, -30));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, CELL_SIZE * 0.35, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlight ring for movable tokens
  if (highlight) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, CELL_SIZE * 0.35, 0, Math.PI * 2);
  ctx.stroke();
}

export default Board;
