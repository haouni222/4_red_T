import { useEffect, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  setBoard, 
  setCurrentPiece, 
  setNextPiece, 
  updateScore, 
  updateLinesCleared,
  setPlaying,
  setGameOver 
} from '../store/gameSlice'
import { 
  createEmptyBoard,
  isValidPosition,
  placePiece,
  rotatePiece,
  movePiece,
  getCompletedLines,
  clearLines,
  getDropPosition,
  calculateScore
} from '../utils/gameLogic'
import { 
  generatePieceSequence,
  getNextPiece as getNextPieceFromSequence,
  createPiece
} from '../utils/tetriminos'

export const useGameLogic = (socket) => {
  const dispatch = useDispatch()
  const gameState = useSelector(state => state.game)
  const roomState = useSelector(state => state.room)
  const gameLoopRef = useRef(null)
  const pieceSequenceRef = useRef([])
  const sequenceIndexRef = useRef(0)
  const dropTimeRef = useRef(1000)

  const initGame = useCallback(() => {
    console.log('🎮 Initializing Tetris game...')
    const emptyBoard = createEmptyBoard()
    dispatch(setBoard(emptyBoard))
    pieceSequenceRef.current = generatePieceSequence()
    sequenceIndexRef.current = 0
    const { piece: firstPiece, newSequence, newIndex } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    pieceSequenceRef.current = newSequence
    sequenceIndexRef.current = newIndex
    dispatch(setCurrentPiece(firstPiece))
    const { piece: nextPiece } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    dispatch(setNextPiece(nextPiece))
    dispatch(updateScore(0))
    dispatch(setGameOver(false))
    dispatch(setPlaying(true))
    console.log('✅ Game initialized!')
  }, [dispatch])
  const lockPiece = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece) return
    const newBoard = placePiece(board, currentPiece, currentPiece.x, currentPiece.y)
    const completedLines = getCompletedLines(newBoard)
    let finalBoard = newBoard
    if (completedLines.length > 0) {
      finalBoard = clearLines(newBoard, completedLines)
      dispatch(updateLinesCleared(completedLines.length))
      const points = calculateScore(completedLines.length, gameState.level)
      dispatch(updateScore(gameState.score + points))
      if (completedLines.length > 1 && socket) {
        socket.emit('action', {
          type: 'LINES_CLEARED',
          roomName: roomState.currentRoom,
          playerName: roomState.playerName,
          linesCount: completedLines.length
        })
      }
    }
    dispatch(setBoard(finalBoard))
    const { piece: newPiece, newSequence, newIndex } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    pieceSequenceRef.current = newSequence
    sequenceIndexRef.current = newIndex
    if (!isValidPosition(finalBoard, newPiece, newPiece.x, newPiece.y)) {
      dispatch(setGameOver(true))
      dispatch(setPlaying(false))
      console.log('💀 Game Over!')
      return
    }
    
    dispatch(setCurrentPiece(newPiece))
    const { piece: nextNextPiece } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    dispatch(setNextPiece(nextNextPiece))
    
  }, [gameState, dispatch, socket, roomState])
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.gameOver) return
    const { board, currentPiece } = gameState
    if (!currentPiece) return
    const movedPiece = movePiece(currentPiece, 0, 1)
    if (isValidPosition(board, movedPiece, movedPiece.x, movedPiece.y)) {
      dispatch(setCurrentPiece(movedPiece))
    } else {
      lockPiece()
    }
  }, [gameState, dispatch, lockPiece])
  useEffect(() => {
    if (gameState.isPlaying && !gameState.gameOver) {
      gameLoopRef.current = setInterval(gameLoop, dropTimeRef.current)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.gameOver, gameLoop])
  const moveLeft = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece || !gameState.isPlaying) return
    
    const movedPiece = movePiece(currentPiece, -1, 0)
    if (isValidPosition(board, movedPiece, movedPiece.x, movedPiece.y)) {
      dispatch(setCurrentPiece(movedPiece))
    }
  }, [gameState, dispatch])
  
  const moveRight = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece || !gameState.isPlaying) return
    
    const movedPiece = movePiece(currentPiece, 1, 0)
    if (isValidPosition(board, movedPiece, movedPiece.x, movedPiece.y)) {
      dispatch(setCurrentPiece(movedPiece))
    }
  }, [gameState, dispatch])
  
  const rotate = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece || !gameState.isPlaying) return
    
    const rotatedPiece = rotatePiece(currentPiece)
    if (isValidPosition(board, rotatedPiece, rotatedPiece.x, rotatedPiece.y)) {
      dispatch(setCurrentPiece(rotatedPiece))
    }
  }, [gameState, dispatch])
  
  const softDrop = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece || !gameState.isPlaying) return
    
    const movedPiece = movePiece(currentPiece, 0, 1)
    if (isValidPosition(board, movedPiece, movedPiece.x, movedPiece.y)) {
      dispatch(setCurrentPiece(movedPiece))
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = setInterval(gameLoop, dropTimeRef.current)
      }
    }
  }, [gameState, dispatch, gameLoop])
  const hardDrop = useCallback(() => {
    const { board, currentPiece } = gameState
    if (!currentPiece || !gameState.isPlaying) return
    const droppedPiece = getDropPosition(board, currentPiece)
    dispatch(setCurrentPiece(droppedPiece))
    setTimeout(lockPiece, 50)
  }, [gameState, dispatch, lockPiece])
  
  return {
    initGame,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
    ghostPiece: gameState.currentPiece ? getDropPosition(gameState.board, gameState.currentPiece) : null
  }
}