export const TETRIMINOS = {
  I: {
    type: 'I',
    color: 'cyan',
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  
  O: {
    type: 'O',
    color: 'yellow',
    shape: [
      [1, 1],
      [1, 1]
    ]
  },
  
  T: {
    type: 'T',
    color: 'purple',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  
  S: {
    type: 'S',
    color: 'green',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]
  },
  
  Z: {
    type: 'Z',
    color: 'red',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  },
  
  J: {
    type: 'J',
    color: 'blue',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  
  L: {
    type: 'L',
    color: 'orange',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  }
}

export const PIECE_TYPES = Object.keys(TETRIMINOS)

export const createPiece = (type, x = 4, y = 0) => {
  const tetrimino = TETRIMINOS[type]
  if (!tetrimino) return null
  
  return {
    type: tetrimino.type,
    color: tetrimino.color,
    shape: tetrimino.shape.map(row => [...row]),
    x,
    y
  }
}

export const generatePieceSequence = () => {
  const sequence = [...PIECE_TYPES]
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]]
  }
  
  return sequence
}

export const getNextPiece = (sequence, index) => {
  if (index >= sequence.length) {
    const newSequence = generatePieceSequence()
    return { 
      piece: createPiece(newSequence[0]), 
      newSequence, 
      newIndex: 1 
    }
  }
  
  return { 
    piece: createPiece(sequence[index]), 
    newSequence: sequence, 
    newIndex: index + 1 
  }
}