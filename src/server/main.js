const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3004

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../client")))

// 🔧 Route de debug pour voir l'état des rooms
app.get('/debug/rooms', (req, res) => {
  const roomsStatus = {}
  gameState.rooms.forEach((room, roomName) => {
    const players = Array.from(room.players.values()).map(player => ({
      id: player.socket.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: player.socket.connected,
      isAlive: player.isAlive
    }))
    
    roomsStatus[roomName] = {
      playerCount: room.players.size,
      gameStarted: room.gameStarted,
      gameState: room.gameState,
      players: players
    }
  })
  
  res.json({
    totalRooms: gameState.rooms.size,
    rooms: roomsStatus
  })
})

// 🧹 Route pour forcer le nettoyage des rooms vides
app.post('/debug/cleanup', (req, res) => {
  let cleaned = 0
  const roomsToRemove = []
  
  gameState.rooms.forEach((room, roomName) => {
    // Supprimer les joueurs déconnectés
    const disconnectedPlayers = []
    room.players.forEach((player, socketId) => {
      if (!player.socket.connected) {
        disconnectedPlayers.push(socketId)
      }
    })
    
    disconnectedPlayers.forEach(socketId => {
      room.removePlayer(socketId)
      cleaned++
    })
    
    // Marquer les rooms vides pour suppression
    if (room.players.size === 0) {
      roomsToRemove.push(roomName)
    }
  })
  
  // Supprimer les rooms vides
  roomsToRemove.forEach(roomName => {
    gameState.removeRoom(roomName)
  })
  
  res.json({
    message: `Cleaned ${cleaned} disconnected players and ${roomsToRemove.length} empty rooms`,
    removedRooms: roomsToRemove
  })
})

// 🎮 GAME STATE MANAGEMENT
class GameState {
  constructor() {
    this.rooms = new Map() // roomName -> Room
  }

  createRoom(roomName, hostSocket) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Room(roomName, hostSocket))
    }
    return this.rooms.get(roomName)
  }

  getRoom(roomName) {
    return this.rooms.get(roomName)
  }

  removeRoom(roomName) {
    this.rooms.delete(roomName)
  }
}

class Room {
  constructor(name, hostSocket) {
    this.name = name
    this.players = new Map() // socketId -> Player
    this.host = hostSocket
    this.gameStarted = false
    this.pieceSequence = [] // Séquence partagée des pièces
    this.currentPieceIndex = 0
    this.gameState = 'waiting' // waiting, playing, finished
  }

  addPlayer(socket, playerName) {
    const player = new Player(socket, playerName, this.players.size === 0)
    this.players.set(socket.id, player)
    
    // Si c'est le premier joueur, il devient host
    if (this.players.size === 1) {
      this.host = socket
      player.isHost = true
    }
    
    return player
  }

  removePlayer(socketId) {
    const removedPlayer = this.players.get(socketId)
    this.players.delete(socketId)
    
    // Si le host part, choisir un nouveau host
    if (removedPlayer && removedPlayer.isHost && this.players.size > 0) {
      const newHost = this.players.values().next().value
      newHost.isHost = true
      this.host = newHost.socket
      return newHost
    }
    
    return null
  }

  getPlayersArray() {
    return Array.from(this.players.values()).map(p => ({
      id: p.socket.id,
      name: p.name,
      is_alive: p.isAlive,
      spectrum: p.spectrum,
      score: p.score
    }))
  }

  // 🎲 Générer une nouvelle séquence de pièces (identique pour tous)
  generatePieceSequence() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    const sequence = []
    
    // Générer plusieurs sacs de pièces
    for (let bag = 0; bag < 10; bag++) {
      const bagPieces = [...pieces]
      
      // Mélange Fisher-Yates
      for (let i = bagPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bagPieces[i], bagPieces[j]] = [bagPieces[j], bagPieces[i]]
      }
      
      sequence.push(...bagPieces)
    }
    
    this.pieceSequence = sequence
    this.currentPieceIndex = 0
  }

  startGame() {
    // Reset l'état de la room pour une nouvelle partie
    this.gameStarted = true
    this.gameState = 'playing'
    this.generatePieceSequence()
    
    // Reset all players
    this.players.forEach(player => {
      player.isAlive = true
      player.spectrum = Array(10).fill(0)
      player.score = 0
    })
    
    // Envoyer START_GOOD à tous les joueurs
    this.players.forEach(player => {
      player.socket.emit('action', {
        type: 'START_GOOD',
        roomName: this.name,
        pieceSequence: this.pieceSequence.slice(0, 20), // Première batch
        players: this.getPlayersArray()
      })
    })
    
    console.log(`🎮 Game started in room ${this.name} with ${this.players.size} players`)
  }

  // 📊 Distribuer les penalty lines
  distributePenaltyLines(fromPlayerId, linesCount) {
    const penaltyLines = Math.max(0, linesCount - 1) // n-1 selon le sujet
    
    if (penaltyLines > 0) {
      this.players.forEach((player, socketId) => {
        if (socketId !== fromPlayerId && player.isAlive) {
          player.socket.emit('action', {
            type: 'PENALTY_LINES',
            roomName: this.name,
            fromPlayer: this.players.get(fromPlayerId).name,
            lines: penaltyLines
          })
        }
      })
      
      console.log(`💥 ${this.players.get(fromPlayerId).name} sent ${penaltyLines} penalty lines`)
    }
  }

  // 📡 Distribuer les spectres à tous
  updateSpectrums() {
    const spectrums = {}
    this.players.forEach((player, socketId) => {
      spectrums[player.name] = player.spectrum
    })
    
    this.players.forEach(player => {
      player.socket.emit('action', {
        type: 'SPECTRUM_UPDATE',
        roomName: this.name,
        spectrums: spectrums
      })
    })
  }

  // 💀 Gérer game over d'un joueur
  playerGameOver(socketId) {
    const player = this.players.get(socketId)
    if (player) {
      player.isAlive = false
      
      // Vérifier s'il reste des joueurs vivants
      const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive)
      
      // Notifier tous les joueurs
      this.players.forEach(p => {
        p.socket.emit('action', {
          type: 'PLAYER_GAME_OVER',
          roomName: this.name,
          playerName: player.name,
          alivePlayers: alivePlayers.length
        })
      })
      
      // Si un seul joueur reste, fin de partie
      if (alivePlayers.length <= 1) {
        this.endGame(alivePlayers[0])
      }
      
      console.log(`💀 ${player.name} game over. ${alivePlayers.length} players remaining`)
    }
  }

  endGame(winner) {
    this.gameState = 'finished'
    this.gameStarted = false
    
    this.players.forEach(player => {
      player.socket.emit('action', {
        type: 'GAME_END',
        roomName: this.name,
        winner: winner ? winner.name : null,
        finalPlayers: this.getPlayersArray()
      })
    })
    
    console.log(`🏆 Game ended in room ${this.name}. Winner: ${winner ? winner.name : 'None'}`)
  }
}

class Player {
  constructor(socket, name, isHost = false) {
    this.socket = socket
    this.name = name
    this.isHost = isHost
    this.isAlive = true
    this.spectrum = Array(10).fill(0) // Hauteur de chaque colonne
    this.score = 0
  }
}

// 🌐 GAME STATE GLOBAL
const gameState = new GameState()

// 🔌 SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log(`🔗 New connection: ${socket.id}`)

  socket.on("action", (action) => {
    console.log(`📡 Received from ${socket.id}:`, action.type)

    switch (action.type) {
      case "server/ping":
        socket.emit("action", { type: "pong" })
        break

      case "JOIN_GAME": {
        console.log('🚨 SERVER DEBUG: JOIN_GAME received')
        console.log('🚨 SERVER DEBUG: Action data:', action)
        console.log('🚨 SERVER DEBUG: Socket ID:', socket.id)
        console.log('🚨 SERVER DEBUG: Current time:', new Date().toISOString())
        
        const { roomName, playerName } = action
        
        if (!roomName || !playerName) {
          console.log('❌ SERVER DEBUG: Missing data - sending JOIN_ERROR')
          socket.emit("action", {
            type: "JOIN_ERROR",
            message: "Room name and player name are required"
          })
          return
        }
        
        console.log('✅ SERVER DEBUG: Data OK, proceeding...')
        
        // Version ultra-simple : toujours accepter
        console.log('🟢 SERVER DEBUG: Creating/joining room (force mode)')
        
        const room = gameState.createRoom(roomName, socket)
        const player = room.addPlayer(socket, playerName)
        
        console.log('✅ SERVER DEBUG: Player added, sending JOIN_GOOD')
        
        const response = {
          type: "JOIN_GOOD",
          roomName: roomName,
          playerName: playerName,
          is_host: player.isHost,
          players: room.getPlayersArray()
        }
        
        console.log('📡 SERVER DEBUG: Response:', response)
        socket.emit("action", response)
        
        socket.join(roomName)
        console.log(`✅ SERVER DEBUG: SUCCESS - ${playerName} joined ${roomName}`)
        break
      }

      case "LEAVE_GAME": {
        const { roomName } = action
        const room = gameState.getRoom(roomName)
        
        if (room) {
          const newHost = room.removePlayer(socket.id)
          
          // Si nouveau host, le notifier
          if (newHost) {
            newHost.socket.emit("action", {
              type: "HOST_CHANGED",
              isNewHost: true
            })
          }
          
          // Notifier les autres joueurs
          socket.to(roomName).emit("action", {
            type: "PLAYER_LEFT",
            players: room.getPlayersArray()
          })
          
          // Supprimer la room si vide
          if (room.players.size === 0) {
            gameState.removeRoom(roomName)
          }
        }
        
        socket.leave(roomName)
        break
      }

      case "START_GAME": {
        const { roomName } = action
        const room = gameState.getRoom(roomName)
        
        if (room && room.players.get(socket.id)?.isHost) {
          // Permettre le redémarrage même si une partie était en cours
          room.startGame()
        } else {
          socket.emit("action", {
            type: "START_ERROR",
            message: "Only the host can start the game"
          })
        }
        break
      }

      // 🎮 GAME EVENTS - Nouveaux événements de synchronisation

      case "LINES_CLEARED": {
        const { roomName, linesCount } = action
        const room = gameState.getRoom(roomName)
        
        if (room && room.gameStarted) {
          room.distributePenaltyLines(socket.id, linesCount)
        }
        break
      }

      case "SPECTRUM_UPDATE": {
        const { roomName, spectrum } = action
        const room = gameState.getRoom(roomName)
        const player = room?.players.get(socket.id)
        
        if (player) {
          player.spectrum = spectrum
          room.updateSpectrums()
        }
        break
      }

      case "GAME_OVER": {
        const { roomName } = action
        const room = gameState.getRoom(roomName)
        
        if (room && room.gameStarted) {
          room.playerGameOver(socket.id)
        }
        break
      }

      case "SCORE_UPDATE": {
        const { roomName, score } = action
        const room = gameState.getRoom(roomName)
        const player = room?.players.get(socket.id)
        
        if (player) {
          player.score = score
        }
        break
      }

      default:
        console.log(`❓ Unknown action: ${action.type}`)
    }
  })

  socket.on("disconnect", () => {
    console.log(`🔌 Disconnected: ${socket.id}`)
    
    // Nettoyer TOUTES les rooms de ce socket
    const roomsToClean = []
    gameState.rooms.forEach((room, roomName) => {
      if (room.players.has(socket.id)) {
        console.log(`🧹 Cleaning ${socket.id} from room ${roomName}`)
        
        const player = room.players.get(socket.id)
        const playerName = player ? player.name : 'Unknown'
        
        const newHost = room.removePlayer(socket.id)
        
        if (newHost) {
          newHost.socket.emit("action", {
            type: "HOST_CHANGED", 
            isNewHost: true
          })
          console.log(`👑 ${newHost.name} is now host of ${roomName}`)
        }
        
        // Notifier les autres
        socket.to(roomName).emit("action", {
          type: "PLAYER_LEFT",
          message: `${playerName} disconnected`,
          players: room.getPlayersArray()
        })
        
        // Marquer pour suppression si vide
        if (room.players.size === 0) {
          roomsToClean.push(roomName)
        }
      }
    })
    
    // Supprimer les rooms vides
    roomsToClean.forEach(roomName => {
      console.log(`🗑️ Removing empty room: ${roomName}`)
      gameState.removeRoom(roomName)
    })
    
    console.log(`✅ Cleanup complete for ${socket.id}`)
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Red Tetris server running on port ${PORT}`)
  console.log(`🌐 Access the game at: http://localhost:${PORT}`)
})