import React, { useState, useEffect, useRef } from 'react';

function Dice({ value, onRoll, canRoll, isRolling: externalIsRolling }) {
  const [displayValue, setDisplayValue] = useState(value || '?');
  const [isWaitingForRoll, setIsWaitingForRoll] = useState(false);
  const [isSix, setIsSix] = useState(false);
  const prevValueRef = useRef();
  const timeoutRef = useRef();

  useEffect(() => {
    if (value && value !== prevValueRef.current) {
      setDisplayValue(value);
      setIsWaitingForRoll(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (value === 6) {
        setIsSix(true);
        playSixSound();
        setTimeout(() => setIsSix(false), 1500);
      }
      prevValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const playSixSound = () => {
    // Simple celebratory sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleRoll = () => {
    if (!canRoll || externalIsRolling || isWaitingForRoll) return;

    setIsWaitingForRoll(true);
    setDisplayValue('?');
    onRoll();

    // Timeout in case server doesn't respond
    timeoutRef.current = setTimeout(() => {
      if (displayValue === '?') {
        setDisplayValue('⚠️');
        setIsWaitingForRoll(false);
        timeoutRef.current = null;
      }
    }, 5000);
  };

  return (
    <div className="dice-container">
      <div className={`dice ${(externalIsRolling || isWaitingForRoll) ? 'rolling' : ''} ${isSix ? 'six-celebration' : ''}`}>
        {displayValue}
      </div>
      <button
        className="roll-btn"
        onClick={handleRoll}
        disabled={!canRoll || externalIsRolling || isWaitingForRoll}
      >
        Roll Dice
      </button>
    </div>
  );
}

export default Dice;
