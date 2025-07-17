class GameRoom {
    constructor(player) {
        this.host = player.name;
        this.host_socket_id = player.id;
        this.name = player.room;
        this.players = [player];
        this.ids = [player.id];
        this.player_count = 1;
        this.pieces = [];
        this.is_running = false;
        this.game_state = 'en attente';
    }

    addplayer(player)
    {
        if (this.players.find(p => p.id === player.id))
            return false;
        this.players.push(player);
        this.player_count++;
        this.ids.push(player.id);
        return true;
    }
    removeplayer(player)
    {
        const foundPlayer = this.players.find(p => p.id === player.id);
        if (foundPlayer) {
            this.players = this.players.filter(p => p.id !== player.id);
            this.player_count--;
            this.ids = this.ids.filter(id => id !== player.id);
            if (this.player_count === 0)
                return -1;
            if (this.player_count > 0 && this.host_socket_id === player.id) 
            {
                this.host = this.players[0].name;
                this.host_socket_id = this.players[0].id;
                return 1; 
            }
            return 2;
        }
        return 0;
    }

    getGameState() {
        return {
            roomName: this.name,
            players: this.players,
            gameState: this.game_state,
            playerCount: this.player_count,
            host: this.host,
            pieces: this.pieces,
            isRunning: this.is_running
        }
    }
}

class Player {
    constructor(socketId, name, roomName) {
        this.id = socketId;
        this.name = name;
        this.room = roomName;
        this.lines_cleared = 0;
        this.is_alive = true;
        this.current_piece = null;
        this.next_piece = null;
        //this.score = 0;
        //this.level = 1;
        //this.terain = list ou autre ?;
    }
}

/*
class Pieces {
    constructor()
    {
        [2.2.0.0.3.3]
        [1.2.2.3.3.1]
    }

}
*/

export default GameRoom;
export { Player };
