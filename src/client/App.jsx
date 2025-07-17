import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import Home from './components/Home'
import GameRoom from './components/GameRoom'
import './styles/App.css'

function App() {
  const socket = useSocket()

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔴 Red Tetris</h1>
        <div className="connection-status">
          {socket?.connected ? (
            <span className="status connected">🟢 Connected</span>
          ) : (
            <span className="status disconnected">🔴 Disconnected</span>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:room/:player" element={<GameRoom />} />
        </Routes>
      </main>
    </div>
  )
}

export default App