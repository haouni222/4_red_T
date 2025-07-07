import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import io from 'socket.io-client'
import {
  joinSuccess,
  joinError,
  updatePlayers,
  hostChanged,
  gameStarted
} from '../store/roomSlice'

export const useSocket = () => {
  const [socket, setSocket] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const newSocket = io('http://localhost:8080')
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
          dispatch(joinError({ message: action.message }))
          break

        case 'TEST':
          dispatch(updatePlayers({ players: action.players }))
          console.log('🎉', action.message)
          break

        case 'HOST_CHANGED':
          dispatch(hostChanged({ isNewHost: true }))
          break

        case 'PLAYER_LEFT':
          break

        case 'START_GOOD':
          dispatch(gameStarted())
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

export const createJoinAction = (roomName, playerName) => ({
  type: 'JOIN_GAME',
  roomName,
  playerName
})

export const createLeaveAction = (roomName) => ({
  type: 'LEAVE_GAME',
  roomName
})

export const createStartAction = (roomName) => ({
  type: 'START_GAME',
  roomName
})