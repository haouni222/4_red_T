import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useSocket, createJoinAction, createLeaveAction, createStartAction } from '../hooks/useSocket'
import { useGameLogic } from '../hooks/useGameLogic'
import { useGameControls } from '../hooks/useGameControls'
import { setConnecting, resetRoom } from '../store/roomSlice'
import { resetGame } from '../store/gameSlice'
import Board from './Board'
import NextPiece from './NextPiece'
import PlayerList from './PlayerList'

const GameRoom = () => {
  const { room, player } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const socket = useSocket()
  
  const roomState = useSelector(state => state.room)
  const gameState = useSelector(state => state.game)

  // 🎮 Logique de jeu
  const gameLogic = useGameLogic(socket)
  
  // ⌨️ Contrôles clavier
  useGameControls({
    moveLeft: gameLogic.moveLeft,
    moveRight: gameLogic.moveRight,
    rotate: gameLogic.rotate,
    softDrop: gameLogic.softDrop,
    hardDrop: gameLogic.hardDrop
  })

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
        dispatch(resetGame())
      }
    }
  }, [room, player, socket])

  // 🚀 Initialiser le jeu quand la partie démarre
  useEffect(() => {
    if (roomState.gameState === 'en cours' && !gameState.isPlaying) {
      console.log('🎮 Game starting! Initializing...')
      gameLogic.initGame()
    }
  }, [roomState.gameState, gameState.isPlaying, gameLogic])

  const handleLeaveRoom = () => {
    if (socket) {
      const leaveAction = createLeaveAction(room)
      socket.emit('action', leaveAction)
    }
    dispatch(resetRoom())
    dispatch(resetGame())
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
            
            <div className="controls-info">
              <h3>🎮 Controls</h3>
              <p>← → Move | ↑ Rotate | ↓ Soft Drop | Space Hard Drop</p>
            </div>
          </div>
        )

      case 'en cours':
        return (
          <div className="game-area">
            <div className="main-game">
              <Board 
                board={gameState.board} 
                currentPiece={gameState.currentPiece}
                showGhost={true}
              />
              
              <div className="game-info">
                <div className="next-piece">
                  <h3>Next:</h3>
                  <NextPiece piece={gameState.nextPiece} />
                </div>
                
                <div className="score-info">
                  <h3>Score: {gameState.score}</h3>
                  <p>Level: {gameState.level}</p>
                  <p>Lines: {gameState.linesCleared}</p>
                </div>
                
                {gameState.gameOver && (
                  <div className="game-over">
                    <h3>💀 Game Over!</h3>
                    <button onClick={gameLogic.initGame}>🔄 Restart</button>
                  </div>
                )}
                
                <div className="controls-help">
                  <h4>Controls:</h4>
                  <p>← → Move</p>
                  <p>↑ Rotate</p>
                  <p>↓ Soft Drop</p>
                  <p>Space Hard Drop</p>
                </div>
              </div>
            </div>
            
            <div className="opponents">
              <h3>Opponents:</h3>
              {roomState.players
                .filter(p => p.name !== roomState.playerName)
                .map(opponent => (
                <div key={opponent.id} className="opponent-spectrum">
                  <p>{opponent.name}</p>
                  <div className="spectrum">
                    <div className="spectrum-placeholder">
                      📊 Spectrum
                    </div>
                  </div>
                </div>
              ))}
              
              {roomState.players.length === 1 && (
                <p className="no-opponents">No opponents yet</p>
              )}
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
        
        <div className="room-info">
          <span>Room: {room}</span>
          <span>Player: {player}</span>
          {gameState.isPlaying && (
            <span className="playing-indicator">🎮 Playing</span>
          )}
        </div>
      </header>
      
      <main className="room-content">
        {renderGameContent()}
      </main>
    </div>
  )
}

export default GameRoom