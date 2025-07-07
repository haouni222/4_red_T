import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useSocket, createJoinAction, createLeaveAction, createStartAction } from '../hooks/useSocket'
import { setConnecting, resetRoom } from '../store/roomSlice'
import Board from './Board'
import PlayerList from './PlayerList'

const GameRoom = () => {
  const { room, player } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const socket = useSocket()
  
  const roomState = useSelector(state => state.room)
  const gameState = useSelector(state => state.game)

  useEffect(() => {
    if (room && player && socket) {
      console.log('🎮 Joining room:', room, 'as:', player)    
      dispatch(setConnecting())
      const joinAction = createJoinAction(room, player)
      socket.emit('action', joinAction)
    }

    return () => {
      if (socket && roomState.currentRoom) {
        const leaveAction = createLeaveAction(room)
        socket.emit('action', leaveAction)
        dispatch(resetRoom())
      }
    }
  }, [room, player, socket])

  const handleLeaveRoom = () => {
    if (socket) {
      const leaveAction = createLeaveAction(room)
      socket.emit('action', leaveAction)
    }
    dispatch(resetRoom())
    navigate('/')
  }

  const handleStartGame = () => {
    if (socket) {
      const startAction = createStartAction(room)
      socket.emit('action', startAction)
    }
  }

  const renderGameContent = () => {
    switch (roomState.gameState) {
      case 'connecting':
        return (
          <div className="game-status">
            <h2>🔄 Connecting...</h2>
            <p>Joining room {room} as {player}</p>
          </div>
        )

      case 'en attente':
        return (
          <div className="lobby">
            <div className="lobby-info">
              <h2>🎮 Room: {roomState.currentRoom}</h2>
              <p>👤 Player: {roomState.playerName}</p>
              <p>👑 You are {roomState.isHost ? 'the host' : 'a player'}</p>
            </div>
            
            <PlayerList players={roomState.players} />
            
            {roomState.isHost && (
              <button 
                onClick={handleStartGame}
                className="start-button"
              >
                🚀 Start Game
              </button>
            )}
          </div>
        )

      case 'en cours':
        return (
          <div className="game-area">
            <div className="main-game">
              <Board 
                board={gameState.board} 
                currentPiece={gameState.currentPiece} 
              />
              <div className="game-info">
                <div className="next-piece">
                  <h3>Next:</h3>
                  {/* Affichage de la prochaine pièce */}
                </div>
                <div className="score">
                  <h3>Score: {gameState.score}</h3>
                  <p>Level: {gameState.level}</p>
                </div>
              </div>
            </div>
            
            <div className="opponents">
              <h3>Opponents:</h3>
              {gameState.opponents.map(opponent => (
                <div key={opponent.id} className="opponent-spectrum">
                  <p>{opponent.name}</p>
                  {/* Spectrum de l'adversaire */}
                </div>
              ))}
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="error-state">
            <h2>❌ Error</h2>
            <p>{roomState.error}</p>
            <button onClick={() => navigate('/')}>Go Home</button>
          </div>
        )

      default:
        return <div>Loading...</div>
    }
  }

  return (
    <div className="game-room">
      <header className="room-header">
        <button 
          onClick={handleLeaveRoom}
          className="leave-button"
        >
          ← Leave Room
        </button>
      </header>
      
      <main className="room-content">
        {renderGameContent()}
      </main>
    </div>
  )
}

export default GameRoom