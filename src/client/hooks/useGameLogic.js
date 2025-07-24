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
  createLinesClearedAction,
  createSpectrumUpdateAction,
  createGameOverAction,
  createScoreUpdateAction
} from '../hooks/useSocket'
import { 
  createEmptyBoard,
  isValidPosition,
  placePiece,
  rotatePiece,
  movePiece,
  getCompletedLines,
  clearLines,
  getDropPosition,
  calculateScore,
  calculateSpectrum
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
  
  // Refs pour éviter les re-renders dans les timers
  const gameLoopRef = useRef(null)
  const pieceSequenceRef = useRef([])
  const sequenceIndexRef = useRef(0)
  const dropTimeRef = useRef(1000) // Vitesse de chute en ms
  const lastSpectrumRef = useRef([])
  
  // 💥 Gérer les penalty lines reçues
  useEffect(() => {
    const handlePenaltyLines = (event) => {
      const { lines, fromPlayer } = event.detail
      console.log(`💥 Adding ${lines} penalty lines from ${fromPlayer}`)
      
      // Ajouter les lignes de pénalité au plateau actuel
      const currentBoard = gameState.board
      const penaltyBoard = addPenaltyLines(currentBoard, lines)
      dispatch(setBoard(penaltyBoard))
      
      // Vérifier si la pièce courante est encore valide
      const { currentPiece } = gameState
      if (currentPiece && !isValidPosition(penaltyBoard, currentPiece, currentPiece.x, currentPiece.y)) {
        // Game over si la pièce ne peut plus être placée
        handleGameOver()
      }
    }

    window.addEventListener('penaltyLines', handlePenaltyLines)
    return () => window.removeEventListener('penaltyLines', handlePenaltyLines)
  }, [gameState.board, gameState.currentPiece])

  // 🎯 Fonction pour ajouter des lignes de pénalité
  const addPenaltyLines = (board, lineCount) => {
    // Créer des lignes de pénalité (pleines avec un trou aléatoire)
    const penaltyLines = []
    for (let i = 0; i < lineCount; i++) {
      const line = Array(10).fill('penalty')
      // Ajouter un trou aléatoire
      const holeIndex = Math.floor(Math.random() * 10)
      line[holeIndex] = 0
      penaltyLines.push(line)
    }
    
    // Supprimer les lignes du haut et ajouter les penalty lines en bas
    const newBoard = board.slice(0, 20 - lineCount)
    return [...Array(lineCount).fill().map(() => Array(10).fill(0)), ...newBoard.slice(0, 20 - lineCount), ...penaltyLines].slice(0, 20)
  }

  // 💀 Gérer game over
  const handleGameOver = useCallback(() => {
    dispatch(setGameOver(true))
    dispatch(setPlaying(false))
    
    // Envoyer game over au serveur
    if (socket && roomState.currentRoom && roomState.playerName) {
      const gameOverAction = createGameOverAction(roomState.currentRoom, roomState.playerName)
      socket.emit('action', gameOverAction)
    }
    
    console.log('💀 Game Over!')
  }, [dispatch, socket, roomState])

  // 📊 Envoyer le spectrum au serveur
  const sendSpectrumUpdate = useCallback((board) => {
    if (!socket || !roomState.currentRoom || !roomState.playerName) return
    
    const spectrum = calculateSpectrum(board)
    
    // Éviter d'envoyer le même spectrum plusieurs fois
    if (JSON.stringify(spectrum) !== JSON.stringify(lastSpectrumRef.current)) {
      lastSpectrumRef.current = spectrum
      const spectrumAction = createSpectrumUpdateAction(
        roomState.currentRoom, 
        roomState.playerName, 
        spectrum
      )
      socket.emit('action', spectrumAction)
    }
  }, [socket, roomState])

  // Initialiser le jeu avec les pièces synchronisées
  const initGame = useCallback(() => {
    console.log('🎮 Initializing Tetris game...')
    
    // Créer un plateau vide
    const emptyBoard = createEmptyBoard()
    dispatch(setBoard(emptyBoard))
    
    // Utiliser la séquence partagée si disponible, sinon générer
    if (window.sharedPieceSequence && window.sharedPieceSequence.length > 0) {
      pieceSequenceRef.current = window.sharedPieceSequence
      sequenceIndexRef.current = window.sharedPieceIndex || 0
      console.log('🎲 Using shared piece sequence from server')
    } else {
      pieceSequenceRef.current = generatePieceSequence()
      sequenceIndexRef.current = 0
      console.log('🎲 Generated local piece sequence')
    }
    
    // Créer la première pièce
    const { piece: firstPiece, newSequence, newIndex } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    
    pieceSequenceRef.current = newSequence
    sequenceIndexRef.current = newIndex
    
    dispatch(setCurrentPiece(firstPiece))
    
    // Créer la pièce suivante
    const { piece: nextPiece } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    dispatch(setNextPiece(nextPiece))
    
    // Reset score
    dispatch(updateScore(0))
    dispatch(setGameOver(false))
    dispatch(setPlaying(true))
    
    // Envoyer spectrum initial
    sendSpectrumUpdate(emptyBoard)
    
    console.log('✅ Game initialized!')
  }, [dispatch, sendSpectrumUpdate])
  
  // Placer une pièce définitivement et spawn la suivante
  const lockPiece = useCallback(() => {
    const { board, currentPiece } = gameState
    
    if (!currentPiece) return
    
    // Placer la pièce sur le plateau
    const newBoard = placePiece(board, currentPiece, currentPiece.x, currentPiece.y)
    
    // Vérifier les lignes complètes
    const completedLines = getCompletedLines(newBoard)
    let finalBoard = newBoard
    
    if (completedLines.length > 0) {
      finalBoard = clearLines(newBoard, completedLines)
      
      // Mettre à jour les lignes cleared
      dispatch(updateLinesCleared(completedLines.length))
      
      // Calculer le score
      const points = calculateScore(completedLines.length, gameState.level)
      const newScore = gameState.score + points
      dispatch(updateScore(newScore))
      
      // 💥 Envoyer penalty lines aux adversaires
      if (socket && roomState.currentRoom && roomState.playerName) {
        const linesClearedAction = createLinesClearedAction(
          roomState.currentRoom,
          roomState.playerName,
          completedLines.length
        )
        socket.emit('action', linesClearedAction)
        
        // Envoyer score update
        const scoreAction = createScoreUpdateAction(
          roomState.currentRoom,
          roomState.playerName,
          newScore
        )
        socket.emit('action', scoreAction)
      }
      
      console.log(`🎉 Cleared ${completedLines.length} lines! Score: ${newScore}`)
    }
    
    dispatch(setBoard(finalBoard))
    
    // 📊 Envoyer spectrum mis à jour
    sendSpectrumUpdate(finalBoard)
    
    // Spawn nouvelle pièce
    const { piece: newPiece, newSequence, newIndex } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    
    pieceSequenceRef.current = newSequence
    sequenceIndexRef.current = newIndex
    
    // Vérifier game over
    if (!isValidPosition(finalBoard, newPiece, newPiece.x, newPiece.y)) {
      handleGameOver()
      return
    }
    
    dispatch(setCurrentPiece(newPiece))
    
    // Préparer la pièce d'après
    const { piece: nextNextPiece } = getNextPieceFromSequence(
      pieceSequenceRef.current, 
      sequenceIndexRef.current
    )
    dispatch(setNextPiece(nextNextPiece))
    
  }, [gameState, dispatch, socket, roomState, sendSpectrumUpdate, handleGameOver])
  
  // Game loop principal
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.gameOver) return
    
    const { board, currentPiece } = gameState
    if (!currentPiece) return
    
    // Essayer de faire descendre la pièce
    const movedPiece = movePiece(currentPiece, 0, 1)
    
    if (isValidPosition(board, movedPiece, movedPiece.x, movedPiece.y)) {
      // La pièce peut descendre
      dispatch(setCurrentPiece(movedPiece))
    } else {
      // La pièce ne peut plus descendre, la verrouiller
      lockPiece()
    }
  }, [gameState, dispatch, lockPiece])
  
  // Démarrer/arrêter le game loop
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
  
  // Actions de jeu
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
      // Reset le timer pour éviter double drop
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
    
    // Force immediate lock
    setTimeout(lockPiece, 50)
  }, [gameState, dispatch, lockPiece])
  
  return {
    // Actions
    initGame,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
    
    // État calculé
    ghostPiece: gameState.currentPiece ? getDropPosition(gameState.board, gameState.currentPiece) : null
  }
}