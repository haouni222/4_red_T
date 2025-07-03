import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const [roomName, setRoomName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const navigate = useNavigate()

  const handleJoinRoom = (e) => {
    e.preventDefault()
    
    if (roomName.trim() && playerName.trim()) {
      // Navigate to game room using React Router
      navigate(`/${roomName}/${playerName}`)
    } else {
      alert('Please enter both room name and player name')
    }
  }

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '500px', 
      margin: '0 auto', 
      textAlign: 'center' 
    }}>
      <h1>🎮 Red Tetris</h1>
      <p>Enter a room name and your player name to start playing!</p>
      
      <form onSubmit={handleJoinRoom} style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Room name (e.g., room1)"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '300px',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Your name (e.g., alice)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '300px',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>
        
        <button
          type="submit"
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Join Room
        </button>
      </form>
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>Or use URL format: <code>localhost:8080/#room1[alice]</code></p>
      </div>
    </div>
  )
}

export default Home
