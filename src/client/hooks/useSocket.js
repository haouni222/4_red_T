import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import io from 'socket.io-client'
import {
  joinSuccess,
  joinError,
  hostChanged,
  gameStarted
} from '../store/roomSlice'
import {
  updateOpponents,
  setGameOver as setGameOverAction,
  setPlaying,
  resetGame
} from '../store/gameSlice'

export const useSocket = () => {
  const [socket, setSocket] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const newSocket = io('http://localhost:3004')
    setSocket(newSocket)

    const handleServerAction = (action) => {
      console.log('📡 Server action:', action)

      switch (action.type) {
        case 'pong':
          console.log('✅ Server ping OK')
          break

        case 'JOIN_GOOD':
          dispatch(joinSuccess({
            roomName: action.roomName,
            playerName: action.playerName,
            is_host: action.is_host,
            players: action.players
          }))
          break

        case 'JOIN_ERROR':
          console.log('🚨 CLIENT DEBUG: Received JOIN_ERROR:', action)
          console.log('🚨 CLIENT DEBUG: Error message:', action.message)
          dispatch(joinError({ message: action.message }))
          break

        case 'TEST':
          // dispatch(updatePlayers({ players: action.players })) // Commenté temporairement
          console.log('🎉', action.message)
          break

        case 'HOST_CHANGED':
          dispatch(hostChanged({ isNewHost: true }))
          break

        case 'PLAYER_LEFT':
          // dispatch(updatePlayers({ players: action.players })) // Commenté temporairement
          break

        case 'START_GOOD':
          dispatch(gameStarted())
          // Store la séquence de pièces pour synchronisation
          if (action.pieceSequence) {
            window.sharedPieceSequence = action.pieceSequence
            window.sharedPieceIndex = 0
          }
          break

        // 🎮 NOUVEAUX ÉVÉNEMENTS MULTIJOUEUR

        case 'PENALTY_LINES':
          console.log(`💥 Received ${action.lines} penalty lines from ${action.fromPlayer}`)
          // Dispatcher l'événement pour ajouter les lignes au plateau
          window.dispatchEvent(new CustomEvent('penaltyLines', {
            detail: { lines: action.lines, fromPlayer: action.fromPlayer }
          }))
          break

        case 'SPECTRUM_UPDATE':
          // Filtrer notre propre spectrum et garder seulement les adversaires
          const opponents = Object.entries(action.spectrums || {})
            .filter(([name]) => name !== window.currentPlayerName)
            .map(([name, spectrum]) => ({ name, spectrum }))
          
          dispatch(updateOpponents(opponents))
          break

        case 'PLAYER_GAME_OVER':
          console.log(`💀 ${action.playerName} game over. ${action.alivePlayers} players remaining`)
          // Mettre à jour la liste des joueurs (certains ne sont plus vivants)
          break

        case 'GAME_END':
          console.log(`🏆 Game ended. Winner: ${action.winner}`)
          
          // 🛑 ARRÊTER LE JEU POUR TOUS
          dispatch(setPlaying(false))
          
          // 💀 Mais gameOver = true SEULEMENT pour les perdants
          const isWinner = action.winner === window.currentPlayerName
          if (!isWinner) {
            dispatch(setGameOverAction(true))
          }
          
          // Clear shared sequence pour éviter les redémarrages
          window.sharedPieceSequence = null
          window.sharedPieceIndex = 0
          
          // Afficher le résultat
          setTimeout(() => {
            if (action.winner === window.currentPlayerName) {
              alert('🎉 Congratulations! You won the game!')
            } else if (action.winner) {
              alert(`🏆 ${action.winner} won the game!\n\nGame finished. The host can start a new game.`)
            } else {
              alert('🎮 Game ended with no winner.\n\nThe host can start a new game.')
            }
          }, 1000)
          break

        default:
          console.log('❓ Unknown action:', action.type)
      }
    }

    newSocket.on('action', handleServerAction)

    newSocket.emit('action', { type: 'server/ping' })

    return () => {
      newSocket.off('action', handleServerAction)
      newSocket.close()
    }
  }, [dispatch])

  return socket
}

export const createJoinAction = (roomName, playerName) => {
  // Stocker le nom du joueur pour filtrer les spectres
  window.currentPlayerName = playerName
  console.log(`🔍 CLIENT DEBUG: Creating join action for Room: "${roomName}", Player: "${playerName}"`)
  return {
    type: 'JOIN_GAME',
    roomName,
    playerName
  }
}

export const createLeaveAction = (roomName) => ({
  type: 'LEAVE_GAME',
  roomName
})

export const createStartAction = (roomName) => ({
  type: 'START_GAME',
  roomName
})

// 🎮 NOUVELLES ACTIONS POUR LA SYNCHRONISATION

export const createLinesClearedAction = (roomName, playerName, linesCount) => ({
  type: 'LINES_CLEARED',
  roomName,
  playerName,
  linesCount
})

export const createSpectrumUpdateAction = (roomName, playerName, spectrum) => ({
  type: 'SPECTRUM_UPDATE',
  roomName,
  playerName,
  spectrum
})

export const createGameOverAction = (roomName, playerName) => ({
  type: 'GAME_OVER',
  roomName,
  playerName
})

export const createScoreUpdateAction = (roomName, playerName, score) => ({
  type: 'SCORE_UPDATE',
  roomName,
  playerName,
  score
})