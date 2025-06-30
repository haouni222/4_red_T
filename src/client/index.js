import React from 'react'
import { createRoot } from 'react-dom/client'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'                                                                                                                                                    
import {storeStateMiddleWare} from './middleware/storeStateMiddleWare'
import reducer from './reducers'
import App from './containers/app'
import {alert} from './actions/alert'

const initialState = {}

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(thunk, createLogger())
)

const container = document.getElementById('tetris')
const root = createRoot(container)

root.render(
  <Provider store={store}>
    <App/>
  </Provider>
)

store.dispatch(alert('Soon, will be here a fantastic Tetris ...'))
