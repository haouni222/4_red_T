import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Home from '../components/Home'
import GameRoom from '../components/GameRoom'

const App = ({message}) => {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle hash-based URLs like /#room1[alice] for backwards compatibility
    const hash = window.location.hash
    if (hash) {
      const match = hash.match(/#(.+)\[(.+)\]/)
      if (match) {
        const [, roomName, playerName] = match
        console.log('🔄 Converting hash URL to router path:', `/${roomName}/${playerName}`)
        navigate(`/${roomName}/${playerName}`, { replace: true })
        // Clear the hash
        window.location.hash = ''
      }
    }
  }, [navigate])

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:roomName/:playerName" element={<GameRoom />} />
        <Route path="*" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <p>Use format: /roomName/playerName</p>
            <p>Example: /room1/alice</p>
          </div>
        } />
      </Routes>
      
      {/* Show Redux message at bottom */}
      {message && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          left: '10px', 
          background: '#333', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          Redux: {message}
        </div>
      )}
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    message: state.message
  }
}

export default connect(mapStateToProps)(App)
