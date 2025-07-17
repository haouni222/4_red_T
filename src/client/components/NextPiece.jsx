import React from 'react'

const NextPiece = ({ piece }) => {
  if (!piece || !piece.shape) {
    return (
      <div className="next-piece-display">
        <div className="next-piece-grid empty">
          <span>No piece</span>
        </div>
      </div>
    )
  }

  const renderPieceGrid = () => {
    const { shape, type } = piece
    
    return (
      <div className="next-piece-grid">
        {shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`next-cell ${cell ? `piece-${type}` : 'empty'}`}
            />
          ))
        )}
      </div>
    )
  }

  return (
    <div className="next-piece-display">
      {renderPieceGrid()}
    </div>
  )
}

export default NextPiece