import React from 'react'
import { getBoardWithPiece, getDropPosition } from '../utils/gameLogic'

const Board = ({ board, currentPiece, showGhost = true }) => {
  const renderBoard = () => {
    const ghostPiece = showGhost && currentPiece ? getDropPosition(board, currentPiece) : null
    return getBoardWithPiece(board, currentPiece, ghostPiece)
  }

  const displayBoard = renderBoard()

  return (
    <div className="tetris-board">
      {displayBoard.map((row, y) =>
        row.map((cell, x) => {
          let cellClass = 'cell'
          
          if (cell === 'ghost') {
            cellClass += ' ghost'
          } else if (cell && cell !== 0) {
            cellClass += ` piece-${cell}`
          } else {
            cellClass += ' empty'
          }
          
          return (
            <div
              key={`${x}-${y}`}
              className={cellClass}
              data-x={x}
              data-y={y}
            />
          )
        })
      )}
    </div>
  )
}

export default Board