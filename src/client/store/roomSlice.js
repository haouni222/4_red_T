import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentRoom: null,
  playerName: null,
  isHost: false,
  players: [],
  gameState: 'disconnected', // disconnected, connecting, en attente, en cours, finished, error
  error: null,
  gameResult: null // Résultat de la partie (winner, etc.)
}

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setConnecting: (state) => {
      state.gameState = 'connecting'
      state.error = null
      state.gameResult = null
    },
    
    joinSuccess: (state, action) => {
      state.currentRoom = action.payload.roomName
      state.playerName = action.payload.playerName
      state.isHost = action.payload.is_host
      state.players = action.payload.players || []
      state.gameState = 'en attente'
      state.error = null
      state.gameResult = null
    },
    
    joinError: (state, action) => {
      state.error = action.payload.message
      state.gameState = 'error'
    },
    
    updatePlayers: (state, action) => {
      state.players = action.payload.players
    },
    
    hostChanged: (state, action) => {
      state.isHost = action.payload.isNewHost
    },
    
    gameStarted: (state) => {
      state.gameState = 'en cours'
      state.gameResult = null
    },
    
    gameFinished: (state, action) => {
      state.gameState = 'finished'
      state.gameResult = {
        winner: action.payload.winner,
        finalPlayers: action.payload.finalPlayers
      }
    },
    
    resetToLobby: (state) => {
      state.gameState = 'en attente'
      state.gameResult = null
      // Garder les players et room info
    },
    
    resetRoom: () => initialState
  }
})

export const {
  setConnecting,
  joinSuccess,
  joinError,
  updatePlayers,
  hostChanged,
  gameStarted,
  gameFinished,
  resetToLobby,
  resetRoom
} = roomSlice.actions

export default roomSlice.reducer