import React from 'react'

const Board = ({ board, currentPiece }) => {
  // Fonction pure pour combiner le plateau et la pièce courante
  const renderBoard = () => {
    // Clone du plateau pour ne pas modifier l'original
    const displayBoard = board.map(row => [...row])
    
    // Ajouter la pièce courante si elle existe
    if (currentPiece) {
      // Logique pour placer la pièce courante sur le plateau d'affichage
      // À implémenter avec les fonctions pures de gameLogic
    }
    
    return displayBoard
  }

  const displayBoard = renderBoard()

  return (
    <div className="tetris-board">
      {displayBoard.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`cell ${cell ? `piece-${cell}` : 'empty'}`}
            data-x={x}
            data-y={y}
          />
        ))
      )}
    </div>
  )
}

export default Board