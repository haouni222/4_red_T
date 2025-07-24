import React from 'react'

const OpponentSpectrum = ({ playerName, spectrum = [] }) => {
  // Normaliser le spectrum (hauteur max = 20)
  const normalizedSpectrum = spectrum.map(height => Math.min(height, 20))
  
  const renderSpectrum = () => {
    return (
      <div className="spectrum-grid">
        {normalizedSpectrum.map((height, columnIndex) => (
          <div key={columnIndex} className="spectrum-column">
            {/* Afficher les blocs de bas en haut */}
            {Array.from({ length: 20 }, (_, rowIndex) => {
              const blockIndex = 19 - rowIndex // Inverser pour commencer du bas
              const isBlock = blockIndex < height
              
              return (
                <div
                  key={`${columnIndex}-${rowIndex}`}
                  className={`spectrum-block ${isBlock ? 'filled' : 'empty'}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="opponent-spectrum">
      <div className="opponent-name">{playerName}</div>
      <div className="spectrum-container">
        {normalizedSpectrum.length > 0 ? (
          renderSpectrum()
        ) : (
          <div className="spectrum-placeholder">
            <span>No data</span>
          </div>
        )}
      </div>
      <div className="spectrum-stats">
        <span>Max: {Math.max(...normalizedSpectrum, 0)}</span>
        <span>Avg: {normalizedSpectrum.length > 0 ? Math.round(normalizedSpectrum.reduce((a, b) => a + b, 0) / normalizedSpectrum.length) : 0}</span>
      </div>
    </div>
  )
}

export default OpponentSpectrum