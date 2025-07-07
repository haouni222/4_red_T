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
    else if (action.type === 'LEAVE_GAME')
    {
        const room = gameRooms.get(action.roomName);
        if (!room) 
        {
            socket.emit('action', {type: 'LEAVE_ERROR', message: 'Room not found'});
            console.log("TEST 3-0-1")
            return;
        }
        const player = playerSockets.get(socket.id);
        if (!player) 
        {
            socket.emit('action', {type: 'LEAVE_ERROR', message: 'Player not found'});
            console.log("TEST 3-0-2")
            return;
        }
        const ret = room.removeplayer(player);
        if (ret === 0)
        {
            socket.emit('action', {type: 'LEAVE_ERROR', message: '????'});
            console.log("TEST 3-0-3")
            return;
        }
        else if (ret === -1) 
        {
            //dev fct stop async loop style stopLoop(action.roomName);
            gameRooms.delete(action.roomName);
            loginfo(`Room ${action.roomName} VIDE et supprimee`);
            console.log("TEST 3-1");
        }
        socket.emit('action', {type: 'LEAVE_GOOD', message: 'Il est parti !'});
        if (ret === 1) 
        {
            socket.to(action.roomName).emit('action', {
                type: 'HOST_CHANGED',
                new_host: room.host,
                new_host_socket_id: room.host_socket_id,
                new_player_count : room.player_count,
            });
            loginfo(`l\'hote est maintenant ${room.host} in room ${action.roomName}`);
            console.log("Test 3-2");
        }
        else if (ret === 2) 
        {
                socket.to(action.roomName).emit('action', {
                    type: 'PLAYER_LEFT',
                    player_name: player.name,
                    player_id: player.id,
                    new_player_count : room.player_count,
                });
                loginfo(`${player.name} est parti de la room`);
                console.log("Test 3-3");
        }
        playerSockets.delete(socket.id);
        socket.leave(action.roomName);
        return;
    }
    else if (action.type === 'START_GAME') 
    {
        const room = gameRooms.get(action.roomName);
        if (!room) {
            socket.emit('action', {type: 'START_ERROR', message: '?????'});
            console.log("TEST 4-0-1");
            return;
        }
        
        const player = playerSockets.get(socket.id);
        if (!player || player.name !== room.host) 
        {
            socket.emit('action', {type: 'START_ERROR', message: 'Seul l\'host peut lancer'});
            console.log("TEST 4-1");
            return;
        }
        
        if (room.game_state !== 'en attente') 
        {
            socket.emit('action', {type: 'START_ERROR', message: 'Deja en cours !'});
            console.log("TEST 4-2-1");
            return;
        }
        if (room.player_count < 1) 
        {
            socket.emit('action', {type: 'START_ERROR', message: '????'});
            console.log("TEST 4-2-2");
            return;
        }
        room.game_state = 'en cours';
        //room.initGame();
        
        io.to(action.roomName).emit('action', {
            type: 'START_GOOD',
            gameState: room.getGameState(),
            message: 'Game started!'
        });
        
        // Dev fct loop async style startloop(action.roomName, io) ??? 
        
        loginfo(`La partie a demarre room : ${action.roomName}`);
        return;
    }
    /*
    else if (action.type === 'GAME_ACTION')
    {

        const room = gameRooms.get(action.roomName);
        if (!room || room.game_state !== 'en cours') 
        {
            socket.emit('action', {type: 'GAME_ERROR', message: '????'});
            console.log("TEST 5-1-1")
            return;
        }
        
        const player = playerSockets.get(socket.id);
        if (!player) 
        {
            socket.emit('action', {type: 'GAME_ERROR', message: '"?????"'});
            console.log("TEST 5-1-2")
            return;
        }
    */
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
        /*
        COMPRENDRE COMMENT LE CLEAR EST FAIR DANS LA PROPOSITION D'IA.
        // Clean up all game loops
        for (const [roomName, intervalId] of gameLoops) {
          clearInterval(intervalId);
          loginfo(`Game loop stopped for room ${roomName}`);
        }
        gameLoops.clear();
        
        // Clear game data
        gameRooms.clear();
        playerSockets.clear();
        */
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
