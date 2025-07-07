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

export const getGhostPosition = (board, piece, x, y) => {
  if (!piece) return { x, y }
  let ghostY = y
  while (isValidPosition(board, piece, x, ghostY + 1)) {
    ghostY++
  }
  return { x, y: ghostY }
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

export const addPenaltyLines = (board, count) => {
  if (count <= 0) return board
  
  const penaltyLines = Array(count).fill().map(() => {
    const line = Array(10).fill(8)
    const holePosition = Math.floor(Math.random() * 10)
    line[holePosition] = 0
    return line
  })
  const newBoard = board.slice(count)
  return [...newBoard, ...penaltyLines]
}