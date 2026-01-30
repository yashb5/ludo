import { useState, useCallback, useEffect, useRef } from 'react';
import { PLAYERS, START_POSITIONS, SAFE_POSITIONS } from '../utils/gameConstants';
import { 
  calculateNewPosition, 
  getMovableTokens, 
  selectAIMove, 
  checkWin 
} from '../utils/gameUtils';

const initialTokens = {
  red: [-1, -1, -1, -1],
  green: [-1, -1, -1, -1],
  yellow: [-1, -1, -1, -1],
  blue: [-1, -1, -1, -1]
};

export function useGame() {
  const [tokens, setTokens] = useState(initialTokens);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(0);
  const [canRoll, setCanRoll] = useState(true);
  const [canMove, setCanMove] = useState(false);
  const [movableTokens, setMovableTokens] = useState([]);
  const [message, setMessage] = useState('Roll the dice to start!');
  const [winner, setWinner] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  
  // Use refs to avoid stale closures in timeouts
  const gameStateRef = useRef({
    tokens,
    currentPlayer,
    winner,
    diceValue
  });
  
  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = { tokens, currentPlayer, winner, diceValue };
  }, [tokens, currentPlayer, winner, diceValue]);

  const resetGame = useCallback(() => {
    setTokens({ ...initialTokens });
    setCurrentPlayer(0);
    setDiceValue(0);
    setCanRoll(true);
    setCanMove(false);
    setMovableTokens([]);
    setMessage('Roll the dice to start!');
    setWinner(null);
    setIsRolling(false);
  }, []);

  const processMove = useCallback((player, tokenIndex, currentTokens, dice) => {
    const pos = currentTokens[player][tokenIndex];
    let newPos;
    
    if (pos === -1) {
      newPos = START_POSITIONS[player];
    } else {
      newPos = calculateNewPosition(player, pos, dice);
    }
    
    const newTokens = { ...currentTokens };
    newTokens[player] = [...currentTokens[player]];
    newTokens[player][tokenIndex] = newPos;
    
    let captureMessage = null;
    
    // Check for captures
    if (newPos < 52 && !SAFE_POSITIONS.includes(newPos)) {
      for (const otherPlayer of PLAYERS) {
        if (otherPlayer === player) continue;
        for (let i = 0; i < 4; i++) {
          if (currentTokens[otherPlayer][i] === newPos) {
            newTokens[otherPlayer] = [...newTokens[otherPlayer]];
            newTokens[otherPlayer][i] = -1;
            captureMessage = `${player.charAt(0).toUpperCase() + player.slice(1)} captured ${otherPlayer}'s token!`;
          }
        }
      }
    }
    
    return { newTokens, newPos, captureMessage };
  }, []);

  // Main game loop for AI
  const runAITurn = useCallback(() => {
    const { currentPlayer: player, tokens: currentTokens, winner: gameWinner } = gameStateRef.current;
    
    if (gameWinner || player === 0) return;
    
    setIsRolling(true);
    setMessage(`${PLAYERS[player].charAt(0).toUpperCase() + PLAYERS[player].slice(1)} is rolling...`);
    
    setTimeout(() => {
      const dice = Math.floor(Math.random() * 6) + 1;
      setDiceValue(dice);
      setIsRolling(false);
      
      const playerName = PLAYERS[player];
      const movable = getMovableTokens(playerName, currentTokens, dice);
      
      if (movable.length === 0) {
        setMessage(`${playerName.charAt(0).toUpperCase() + playerName.slice(1)} rolled ${dice}. No valid moves!`);
        
        setTimeout(() => {
          if (dice === 6) {
            // AI gets another turn
            runAITurn();
          } else {
            // Next player
            const nextPlayer = (player + 1) % 4;
            setCurrentPlayer(nextPlayer);
            setCanRoll(true);
            if (nextPlayer === 0) {
              setMessage("Your turn! Roll the dice.");
            } else {
              setTimeout(runAITurn, 800);
            }
          }
        }, 1000);
        return;
      }
      
      // AI selects and makes move
      setTimeout(() => {
        const tokenIndex = selectAIMove(playerName, movable, currentTokens, dice);
        const { newTokens, newPos, captureMessage } = processMove(playerName, tokenIndex, currentTokens, dice);
        
        setTokens(newTokens);
        
        if (captureMessage) {
          setMessage(captureMessage);
        } else {
          setMessage(`${playerName.charAt(0).toUpperCase() + playerName.slice(1)} moved.`);
        }
        
        // Check for win
        if (checkWin(playerName, newTokens)) {
          setWinner(playerName);
          return;
        }
        
        // Check if AI gets another turn
        const gotSix = dice === 6;
        const finished = newPos === 57;
        
        setTimeout(() => {
          if (gotSix && !finished) {
            setMessage(`${playerName.charAt(0).toUpperCase() + playerName.slice(1)} gets another turn!`);
            // Update ref with new tokens before next AI turn
            gameStateRef.current.tokens = newTokens;
            setTimeout(runAITurn, 800);
          } else {
            // Next player
            const nextPlayer = (player + 1) % 4;
            setCurrentPlayer(nextPlayer);
            setCanRoll(true);
            
            if (nextPlayer === 0) {
              setMessage("Your turn! Roll the dice.");
            } else {
              // Update ref and continue AI
              gameStateRef.current.tokens = newTokens;
              gameStateRef.current.currentPlayer = nextPlayer;
              setTimeout(runAITurn, 800);
            }
          }
        }, 500);
      }, 600);
    }, 500);
  }, [processMove]);

  const moveToken = useCallback((player, tokenIndex) => {
    if (winner || player !== 'red') return;
    
    setCanMove(false);
    setMovableTokens([]);
    
    const { newTokens, newPos, captureMessage } = processMove(player, tokenIndex, tokens, diceValue);
    
    setTokens(newTokens);
    
    if (captureMessage) {
      setMessage(captureMessage);
    }
    
    // Check for win
    if (checkWin(player, newTokens)) {
      setWinner(player);
      return;
    }
    
    // Check if player gets another turn
    const gotSix = diceValue === 6;
    const finished = newPos === 57;
    
    if (gotSix && !finished) {
      setMessage('You get another turn!');
      setCanRoll(true);
    } else {
      // Move to next player (AI)
      setTimeout(() => {
        setCurrentPlayer(1);
        setCanRoll(false);
        // Update ref with new tokens
        gameStateRef.current.tokens = newTokens;
        gameStateRef.current.currentPlayer = 1;
        setTimeout(runAITurn, 800);
      }, 500);
    }
  }, [tokens, diceValue, winner, processMove, runAITurn]);

  const rollDice = useCallback(() => {
    if (!canRoll || winner || currentPlayer !== 0) return;
    
    setIsRolling(true);
    setCanRoll(false);
    
    setTimeout(() => {
      const dice = Math.floor(Math.random() * 6) + 1;
      setDiceValue(dice);
      setIsRolling(false);
      
      const movable = getMovableTokens('red', tokens, dice);
      
      if (movable.length === 0) {
        setMessage(`You rolled ${dice}. No valid moves!`);
        
        setTimeout(() => {
          if (dice === 6) {
            setCanRoll(true);
            setMessage('You get another turn! Roll again.');
          } else {
            // Move to AI
            setCurrentPlayer(1);
            gameStateRef.current.currentPlayer = 1;
            setTimeout(runAITurn, 800);
          }
        }, 1000);
        return;
      }
      
      setCanMove(true);
      setMovableTokens(movable);
      
      if (movable.length === 1) {
        // Auto-move if only one option
        moveToken('red', movable[0]);
      } else {
        setMessage(`You rolled ${dice}. Click a token to move!`);
      }
    }, 500);
  }, [canRoll, winner, currentPlayer, tokens, moveToken, runAITurn]);

  return {
    tokens,
    currentPlayer,
    diceValue,
    canRoll,
    canMove,
    movableTokens,
    message,
    winner,
    isRolling,
    rollDice,
    moveToken,
    resetGame
  };
}
