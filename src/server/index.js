import fs  from 'fs'
import debug from 'debug'
import GameRoom, { Player } from './gameEngine.js'
const logerror = debug('tetris:error')
  , loginfo = debug('tetris:info')

const gameRooms = new Map(); // roomName -> room data
const playerSockets = new Map(); // socketId -> player data

const initApp = (app, params, cb) => {
  const {host, port} = params
  const handler = (req, res) => {
    let file;
    
    // Always serve bundle.js from root, regardless of URL path
    if (req.url === '/bundle.js' || req.url.endsWith('/bundle.js')) {
      file = '/../../build/bundle.js'
    } else if (req.url.startsWith('/static/') || req.url.endsWith('.css')) {
      // Serve other static files if needed
      file = '/../../' + req.url
    } else {
      // ALL other routes (including /room1/alice) serve index.html
      file = '/../../index.html'
    }
    
    fs.readFile(__dirname + file, (err, data) => {
      if (err) {
        logerror(err)
        res.writeHead(500)
        return res.end('Error loading file')
      }
      
      // Set correct content type
      let contentType = 'text/html';
      if (req.url.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (req.url.endsWith('.css')) {
        contentType = 'text/css';
      }
      
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    })
  }

  app.on('request', handler)

  app.listen({host, port}, () =>{
    loginfo(`tetris listen on ${params.url}`)
    cb()
  })
}

const initEngine = io => {
  io.on('connection', function(socket){
    loginfo("Socket connected: " + socket.id)
    socket.on('action', (action) => {
      if(action.type === 'server/ping'){
        socket.emit('action', {type: 'pong'})
      }
      else if(action.type === 'JOIN_GAME')
    {
        console.log("CA MARCHE ??? ")
        const {roomName, playerName} = action
        if(!roomName || !playerName)
        {
            socket.emit('action', {type: 'JOIN_ERROR', message :'Nom de joueur et donc de room requis'});
            return;
        }
        const player = new Player(socket.id, playerName, roomName);
        if(!gameRooms.has(roomName))
        {
            const newRoom = new GameRoom(player);
            gameRooms.set(roomName, newRoom);
            playerSockets.set(socket.id, player);
            socket.join(roomName);
            socket.emit('action', {type : 'JOIN_GOOD', 
                roomName: roomName,
                playerName: playerName,
                is_host: true
            });
            return;
            //loginfo('Room creee: ${roomName}');
        }
        const room = gameRooms.get(roomName);
        if (room.game_state !== 'en attente')
        {
            socket.emit('action', {type: 'JOIN_ERROR', message: 'La partie n\'est pas joigniable'});
            console.log("TEST 2-1")
            return;
        }
        
        if (room.addplayer(player) === false)
        {
            socket.emit('action', {type: 'JOIN_ERROR', message: 'Le nom de joueur est deja utilise'});
            console.log("TEST 2-2")
            return;
        }
        room.addplayer(player);
        playerSockets.set(socket.id, player);
        socket.join(roomName);
        socket.emit('action', {type: 'JOIN_GOOD', 
          roomName: roomName,
          playerName: playerName,
          ishost : false,
          players : room.players
        });
        socket.to(roomName).emit('action', {
          type: 'TEST',
          message:  player.name + ' a rejoint la room !',
          players : room.players,}
        )
        console.log('STP MARCHE');
        return;
    }
    })
  })
}

export function create(params){
  const promise = new Promise( (resolve, reject) => {
    const app = require('http').createServer()
    initApp(app, params, () =>{
      const io = require('socket.io')(app, {
        cors: 
        {
          origin: "http://localhost:8080",
          methods: ["GET", "POST"],
          credentials: true
        }
      })
      
      const stop = (cb) => {
        io.close()
        app.close( () => {
          app.unref()
        })
        loginfo(`Engine stopped.`)
        cb()
      }

      initEngine(io)
      resolve({stop})
    })
  })
  return promise
}
