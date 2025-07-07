import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const [roomName, setRoomName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (roomName.trim() && playerName.trim()) {
      navigate(`/${roomName.trim()}/${playerName.trim()}`)
    }
  }

  return (
    <div className="home">
      <div className="home-content">
        <h2>🎮 Join a Tetris Game</h2>
        <p>Enter a room name and your player name to start playing!</p>
        
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="roomName">Room Name:</label>
            <input
              id="roomName"
              type="text"
              placeholder="e.g., room1"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="playerName">Player Name:</label>
            <input
              id="playerName"
              type="text"
              placeholder="e.g., alice"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="join-button">
            Join Game
          </button>
        </form>
        
        <div className="info">
          <p>URL format: <code>localhost:8080/room/player</code></p>
          <p>Example: <code>localhost:8080/room1/alice</code></p>
        </div>
      </div>
    </div>
  )
}

export default Home