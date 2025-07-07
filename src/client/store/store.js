import { configureStore } from '@reduxjs/toolkit'
import roomReducer from './roomSlice'
import gameReducer from './gameSlice'

export const store = configureStore({
  reducer: {
    room: roomReducer,
    game: gameReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['room/setSocket']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})