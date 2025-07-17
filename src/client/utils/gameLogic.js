export const createEmptyBoard = () => 
  Array(20).fill().map(() => Array(10).fill(0))
export const isValidPosition = (board, piece, x, y) => {
  if (!piece || !piece.shape) return false
  
  return piece.shape.every((row, dy) =>
    row.every((cell, dx) => {
      if (!cell) return true
      
      const newX = x + dx
      const newY = y + dy
      if (newX < 0 || newX >= 10 || newY >= 20) return false
      if (newY < 0) return true
      return !board[newY][newX]
    })
  )
}

export const placePiece = (board, piece, x, y) => {
  if (!piece || !piece.shape) return board
  
  const newBoard = board.map(row => [...row])
  
  piece.shape.forEach((row, dy) => {
    row.forEach((cell, dx) => {
      if (cell && y + dy >= 0) {
        newBoard[y + dy][x + dx] = piece.type
      }
    })
  })
  
  return newBoard
}

export const rotatePiece = (piece) => {
  if (!piece || !piece.shape) return piece
  
  const rotatedShape = piece.shape[0].map((_, index) =>
    piece.shape.map(row => row[index]).reverse()
  )
  
  return {
    ...piece,
    shape: rotatedShape
  }
}

export const movePiece = (piece, dx, dy) => {
  if (!piece) return piece
  
  return {
    ...piece,
    x: piece.x + dx,
    y: piece.y + dy
  }
}

export const getCompletedLines = (board) => {
  const completedLines = []
  
  board.forEach((row, index) => {
    if (row.every(cell => cell !== 0)) {
      completedLines.push(index)
    }
  })
  
  return completedLines
}

export const clearLines = (board, linesToClear) => {
  if (linesToClear.length === 0) return board
  const newBoard = board.filter((_, index) => !linesToClear.includes(index))
  const emptyLines = Array(linesToClear.length)
    .fill()
    .map(() => Array(10).fill(0))
  return [...emptyLines, ...newBoard]
}

// Calculer la position de chute libre (ghost piece)
export const getDropPosition = (board, piece) => {
  if (!piece) return piece
  
  let ghostY = piece.y
  
  while (isValidPosition(board, piece, piece.x, ghostY + 1)) {
    ghostY++
  }
  
  return { ...piece, y: ghostY }
}
export const getBoardWithPiece = (board, piece, ghostPiece = null) => {
  const displayBoard = board.map(row => [...row])
  if (ghostPiece && ghostPiece.x !== undefined && ghostPiece.y !== undefined) {
    ghostPiece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell && ghostPiece.y + dy >= 0 && ghostPiece.y + dy < 20) {
          const x = ghostPiece.x + dx
          const y = ghostPiece.y + dy
          if (x >= 0 && x < 10 && !displayBoard[y][x]) {
            displayBoard[y][x] = 'ghost'
          }
        }
      })
    })
  }
  
  // Ajouter la pièce courante (par-dessus la ghost) !!!! ne marche pas
  if (piece && piece.x !== undefined && piece.y !== undefined) {
    piece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell && piece.y + dy >= 0 && piece.y + dy < 20) {
          const x = piece.x + dx
          const y = piece.y + dy
          if (x >= 0 && x < 10) {
            displayBoard[y][x] = piece.type
          }
        }
      })
    })
  }
  
  return displayBoard
}

export const calculateSpectrum = (board) => {
  const spectrum = Array(10).fill(0)
  
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 20; y++) {
      if (board[y][x] !== 0) {
        spectrum[x] = 20 - y
        break
      }
    }
  }
  
  return spectrum
}

export const calculateScore = (linesCleared, level) => {
  const basePoints = {
    1: 100,  // Single
    2: 300,  // Double  
    3: 500,  // Triple
    4: 800   // Tetris
  }
  
  return (basePoints[linesCleared] || 0) * level
}