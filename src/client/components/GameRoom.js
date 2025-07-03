import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import io from 'socket.io-client'

const socket = io('http://localhost:3004')

const GameRoom = () => {
  const { roomName, playerName } = useParams()
  const [gameState, setGameState] = useState('connecting')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    console.log('Room:', roomName, 'Player:', playerName)
    
    if (roomName && playerName) {
        // Fonction d'écoute 
        const handleServerMessage = (action) => {
        console.log('Serveur dit :', action);
        
        if (action.type === 'JOINED_GOOD' && action.is_host === true) {
            console.log('Bienvenue, tu es l\'host de cette room', action.roomName);
            setGameState('joined')
        }
        else if (action.type === 'JOINED_GOOD' && action.is_host === false) {
            console.log('Bienvenue dans la room', action.roomName);
            setGameState('joined')
        } else if (action.type === 'JOIN_ERROR') {
            console.log(action.message);
            setErrorMessage(action.message)
            setGameState('error')
        }
        else if (action.type === 'TEST') {
            console.log('🎉 TEST MESSAGE:', action.message)
        }
        };
        
        // Ecoute le serv UP 
        socket.on('action', handleServerMessage);
        
        // Envoie au serv 
        socket.emit('action', {
        type: 'JOIN_GAME',
        roomName: roomName,
        playerName: playerName
        });
        
        // Tuer la connexion a tester quand quit dev
        return () => {
        socket.off('action', handleServerMessage);
        };
    } else {
        setErrorMessage('Probleme dans l\'adresse name ou room manquant');
        setGameState('error')
    }
  }, [roomName, playerName]);

  const renderContent = () => {
    switch(gameState) {
      case 'connecting':
        return <div>Connecting to room {roomName} as {playerName}...</div>
        
      case 'joined':
        return (
          <div>
            <h2>Welcome to room: {roomName}</h2>
            <p>Playing as: {playerName}</p>
            {/* Add your Tetris game UI here later */}
          </div>
        )
        
      case 'error':
        return (
          <div>
            <h2>Error</h2>
            <p>{errorMessage}</p>
            <p>Please check your URL format: /room/player</p>
          </div>
        )
        
      default:
        return <div>Loading...</div>
    }
  }

  return (
    <div>
      {renderContent()}
    </div>
  )
}

export default GameRoom
