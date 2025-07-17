import { createSlice } from '@reduxjs/toolkit'

// Fonction pure pour créer un plateau vide (respect du sujet)
const createEmptyBoard = () => 
  Array(20).fill().map(() => Array(10).fill(0))

const initialState = {
  board: createEmptyBoard(),
  currentPiece: null,
  nextPiece: null,
  score: 0,
  level: 1,
  linesCleared: 0,
  gameOver: false,
  isPlaying: false,
  opponents: [] // Spectres des adversaires
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setBoard: (state, action) => {
      state.board = action.payload
    },
    
    setCurrentPiece: (state, action) => {
      state.currentPiece = action.payload
    },
    
    setNextPiece: (state, action) => {
      state.nextPiece = action.payload
    },
    
    updateScore: (state, action) => {
      state.score = action.payload
    },
    
    updateLinesCleared: (state, action) => {
      state.linesCleared += action.payload
      // Augmenter le niveau tous les 10 lignes
      state.level = Math.floor(state.linesCleared / 10) + 1
    },
    
    setPlaying: (state, action) => {
      state.isPlaying = action.payload
    },
    
    setGameOver: (state, action) => {
      state.gameOver = action.payload
    },
    
    updateOpponents: (state, action) => {
      state.opponents = action.payload
    },
    
    resetGame: () => ({
      ...initialState,
      board: createEmptyBoard()
    })
  }
})

export const {
  setBoard,
  setCurrentPiece,
  setNextPiece,
  updateScore,
  updateLinesCleared,
  setPlaying,
  setGameOver,
  updateOpponents,
  resetGame
} = gameSlice.actions

export default gameSlice.reducer