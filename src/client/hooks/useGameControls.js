import { useEffect, useRef } from 'react'
const CONTROLS = {
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight', 
  ArrowUp: 'rotate',
  ArrowDown: 'softDrop',
  ' ': 'hardDrop' // Spacebar
}

export const useGameControls = (actions) => {
  const keysPressed = useRef(new Set())
  const repeatTimeouts = useRef(new Map())
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      const action = CONTROLS[event.key]
      if (!action) return
      event.preventDefault()
      if (keysPressed.current.has(event.key)) return
      keysPressed.current.add(event.key)
      if (actions[action]) {
        actions[action]()
      }
      if (action === 'moveLeft' || action === 'moveRight' || action === 'softDrop') {
        const startRepeat = () => {
          const intervalId = setInterval(() => {
            if (keysPressed.current.has(event.key) && actions[action]) {
              actions[action]()
            }
          }, action === 'softDrop' ? 50 : 150)
          repeatTimeouts.current.set(event.key, intervalId)
        }
        const timeoutId = setTimeout(startRepeat, 250)
        repeatTimeouts.current.set(event.key + '_initial', timeoutId)
      }
    }
    
    const handleKeyUp = (event) => {
      const action = CONTROLS[event.key]
      if (!action) return
      keysPressed.current.delete(event.key)
      const intervalId = repeatTimeouts.current.get(event.key)
      const timeoutId = repeatTimeouts.current.get(event.key + '_initial')
      
      if (intervalId) {
        clearInterval(intervalId)
        repeatTimeouts.current.delete(event.key)
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        repeatTimeouts.current.delete(event.key + '_initial')
      }
    }
    
    // Focus sur la fenêtre pour capturer les événements
    const handleFocus = () => {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    }
    
    const handleBlur = () => {
      // Nettoyer quand la fenêtre perd le focus
      keysPressed.current.clear()
      repeatTimeouts.current.forEach((id, key) => {
        if (key.endsWith('_initial')) {
          clearTimeout(id)
        } else {
          clearInterval(id)
        }
      })
      repeatTimeouts.current.clear()
      
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
    handleFocus()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      handleBlur()
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [actions])
  
  return {
    controls: {
      '←/→': 'Move',
      '↑': 'Rotate', 
      '↓': 'Soft Drop',
      'Space': 'Hard Drop'
    }
  }
}