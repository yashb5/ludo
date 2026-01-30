export const BOARD_SIZE = 600;
export const CELL_SIZE = BOARD_SIZE / 15;

export const PLAYERS = ['red', 'green', 'yellow', 'blue'];

export const PLAYER_COLORS = {
  red: '#e74c3c',
  green: '#27ae60',
  yellow: '#f1c40f',
  blue: '#3498db'
};

export const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };

export const HOME_ENTRY = { red: 50, green: 11, yellow: 24, blue: 37 };

export const HOME_BASES = {
  red: [{ x: 1.5, y: 1.5 }, { x: 3.5, y: 1.5 }, { x: 1.5, y: 3.5 }, { x: 3.5, y: 3.5 }],
  green: [{ x: 10.5, y: 1.5 }, { x: 12.5, y: 1.5 }, { x: 10.5, y: 3.5 }, { x: 12.5, y: 3.5 }],
  yellow: [{ x: 10.5, y: 10.5 }, { x: 12.5, y: 10.5 }, { x: 10.5, y: 12.5 }, { x: 12.5, y: 12.5 }],
  blue: [{ x: 1.5, y: 10.5 }, { x: 3.5, y: 10.5 }, { x: 1.5, y: 12.5 }, { x: 3.5, y: 12.5 }]
};

export const HOME_PATHS = {
  red: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }],
  green: [{ x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }],
  yellow: [{ x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }],
  blue: [{ x: 7, y: 13 }, { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 }]
};

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Initialize track coordinates
export const TRACK = (() => {
  const track = [];
  // Bottom-left to top (red's path start)
  for (let i = 5; i >= 0; i--) track.push({ x: 6, y: i });
  track.push({ x: 7, y: 0 });
  for (let i = 0; i <= 5; i++) track.push({ x: 8, y: i });
  
  // Top side (green's path start)
  for (let i = 9; i <= 14; i++) track.push({ x: i, y: 6 });
  track.push({ x: 14, y: 7 });
  for (let i = 14; i >= 9; i--) track.push({ x: i, y: 8 });
  
  // Right side going down (yellow's path start)
  for (let i = 9; i <= 14; i++) track.push({ x: 8, y: i });
  track.push({ x: 7, y: 14 });
  for (let i = 14; i >= 9; i--) track.push({ x: 6, y: i });
  
  // Bottom side (blue's path start)
  for (let i = 5; i >= 0; i--) track.push({ x: i, y: 8 });
  track.push({ x: 0, y: 7 });
  for (let i = 0; i <= 5; i++) track.push({ x: i, y: 6 });
  
  return track;
})();
