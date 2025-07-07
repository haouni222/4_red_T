import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentRoom: null,
  playerName: null,
  isHost: false,
  players: [],
  gameState: 'disconnected', // penser a le changer en fnction de l'etat
  error: null
}

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setConnecting: (state) => {
      state.gameState = 'connecting'
      state.error = null
    },
    
    joinSuccess: (state, action) => {
      state.currentRoom = action.payload.roomName
      state.playerName = action.payload.playerName
      state.isHost = action.payload.is_host
      state.players = action.payload.players || []
      state.gameState = 'en attente'
      state.error = null
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
  resetRoom
} = roomSlice.actions

export default roomSlice.reducer