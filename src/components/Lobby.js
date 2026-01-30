import React, { useState } from 'react';

function Lobby({ onCreateRoom, onJoinRoom, error }) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showForm, setShowForm] = useState(null); // 'join' or 'create'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !playerName.trim()) return;

    if (showForm === 'create') {
      onCreateRoom(roomId.trim(), playerName.trim());
    } else {
      onJoinRoom(roomId.trim(), playerName.trim());
    }
  };

  const handleCreateClick = () => setShowForm('create');
  const handleJoinClick = () => setShowForm('join');
  const handleBack = () => setShowForm(null);

  if (showForm) {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <button className="back-btn" onClick={handleBack}>← Back</button>
          <h1>{showForm === 'create' ? 'Create Room' : 'Join Room'}</h1>
          <p>Enter your details to {showForm === 'create' ? 'create' : 'join'} a game</p>

          <form onSubmit={handleSubmit} className="lobby-form">
            <div className="form-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn">
              {showForm === 'create' ? '🎲 Create Room' : '🚪 Join Room'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="hero-section">
          <h1 className="main-title">🎲 Ludo Masters</h1>
          <p className="subtitle">Challenge friends in the ultimate multiplayer board game experience</p>
        </div>

        <div className="cta-section">
          <button className="cta-btn primary" onClick={handleJoinClick}>
            <span className="icon">🚪</span>
            <span className="text">Join Room</span>
          </button>
          <button className="cta-btn secondary" onClick={handleCreateClick}>
            <span className="icon">🎯</span>
            <span className="text">Create Room</span>
          </button>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">👥</span>
            <span>2-4 Players</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Real-time</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span>Competitive</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;