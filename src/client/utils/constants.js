export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const INITIAL_PIECE_X = 4
export const INITIAL_PIECE_Y = 0

// a voir si on veut les changer ou pas (wasd ????)
export const CONTROLS = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  UP: 'ArrowUp',
  SPACE: ' ',
  ROTATE: 'ArrowUp',
  SOFT_DROP: 'ArrowDown',
  HARD_DROP: ' '
}

export const GAME_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  WAITING: 'en attente',
  PLAYING: 'en cours',
  ERROR: 'error'
}

export const SOCKET_EVENTS = {
  PING: 'server/ping',
  JOIN_GAME: 'JOIN_GAME',
  LEAVE_GAME: 'LEAVE_GAME',
  START_GAME: 'START_GAME',
  MOVE_PIECE: 'MOVE_PIECE',

  PONG: 'pong',
  JOIN_GOOD: 'JOIN_GOOD',
  JOIN_ERROR: 'JOIN_ERROR',
  START_GOOD: 'START_GOOD',
  PLAYER_JOINED: 'TEST',
  HOST_CHANGED: 'HOST_CHANGED',
  PLAYER_LEFT: 'PLAYER_LEFT'
}

export const PIECE_COLORS = {
  I: '#00f0f0', // Cyan
  O: '#f0f000', // Jaune
  T: '#a000f0', // Violet
  S: '#00f000', // Vert
  Z: '#f00000', // Rouge
  J: '#0000f0', // Bleu
  L: '#f0a000'  // Orange
}

// si on veut modifier la vitesse de chute
export const DROP_SPEED = {
  INITIAL: 1000,
  SOFT_DROP: 100,
  LEVEL_INCREASE: 100
}

// a voir si on met le systeme de point ou pas
export const SCORING = {
  SINGLE_LINE: 100,
  DOUBLE_LINE: 300,
  TRIPLE_LINE: 500,
  TETRIS: 800,
  SOFT_DROP: 1,
  HARD_DROP: 2
}

export const SERVER_CONFIG = {
  URL: 'http://localhost:8080',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000
}