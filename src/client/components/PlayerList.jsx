import React from 'react'

const PlayerList = ({ players = [] }) => {
  const formatPlayerInfo = (player) => ({
    ...player,
    displayName: player.name,
    status: player.is_alive ? 'alive' : 'eliminated'
  })

  return (
    <div className="player-list">
      <h3>👥 Players ({players.length})</h3>
      <div className="players">
        {players.map(player => {
          const playerInfo = formatPlayerInfo(player)
          
          return (
            <div 
              key={player.id} 
              className={`player ${playerInfo.status}`}
            >
              <span className="player-name">
                {playerInfo.displayName}
              </span>
              <span className="player-status">
                {playerInfo.status === 'alive' ? '🟢' : '🔴'}
              </span>
            </div>
          )
        })}
      </div>
      
      {players.length === 0 && (
        <p className="no-players">No players yet...</p>
      )}
    </div>
  )
}

export default PlayerList