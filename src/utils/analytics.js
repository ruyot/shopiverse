const ANALYTICS_API_URL = 'http://localhost:5000/api/analytics'

// Guard against duplicate initialization (React StrictMode, HMR, etc.)
const INIT_KEY = 'shopiverse_analytics_initialized'

// Generate a unique session ID (persists for browser session)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('shopiverse_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('shopiverse_session_id', sessionId)
  }
  return sessionId
}

// Get or create a persistent user ID (persists across sessions)
const getUserId = () => {
  let userId = localStorage.getItem('shopiverse_user_id')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('shopiverse_user_id', userId)
  }
  return userId
}

// Track session start time (use existing if already set to handle re-imports)
const sessionStartTime = parseInt(sessionStorage.getItem('shopiverse_session_start')) || Date.now()
sessionStorage.setItem('shopiverse_session_start', sessionStartTime.toString())

// Track current scene and entry time for duration calculation
let currentScene = null
let sceneEntryTime = null

/**
 * Track a user action and send it to the backend
 * @param {string} action - The action name
 * @param {object} data - Additional data about the action
 */
export async function trackEvent(action, data = {}) {
  try {
    const response = await fetch(ANALYTICS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        userId: getUserId(),
        sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000), // seconds since session start
        data
      })
    })

    if (!response.ok) {
      console.warn('Failed to track event:', action)
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.warn('Analytics error:', error.message)
  }
}

// Convenience functions for common actions
export const analytics = {
  // Session
  startSession: () => trackEvent('session_start', {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    referrer: document.referrer || 'direct'
  }),

  endSession: () => {
    // Calculate final scene duration if still in a scene
    const finalSceneDuration = currentScene && sceneEntryTime
      ? Math.round((Date.now() - sceneEntryTime) / 1000)
      : 0

    return trackEvent('session_end', {
      totalDuration: Math.round((Date.now() - sessionStartTime) / 1000),
      lastScene: currentScene,
      lastSceneDuration: finalSceneDuration
    })
  },

  // Navigation with duration tracking
  navigate: (fromScene, toScene) => {
    // Calculate time spent in previous scene
    const timeInPreviousScene = sceneEntryTime
      ? Math.round((Date.now() - sceneEntryTime) / 1000)
      : 0

    const eventData = {
      fromScene,
      toScene,
      timeInPreviousScene
    }

    // Update current scene tracking
    currentScene = toScene
    sceneEntryTime = Date.now()

    return trackEvent('navigate', eventData)
  },

  // Enter scene (for initial load)
  enterScene: (sceneId) => {
    currentScene = sceneId
    sceneEntryTime = Date.now()
    return trackEvent('enter_scene', { sceneId })
  },

  // Product interactions
  viewProduct: (hotspot) => trackEvent('view_product', {
    productId: hotspot.id,
    title: hotspot.title,
    price: hotspot.price,
    scene: currentScene
  }),

  closeProduct: (hotspot, viewDuration) => trackEvent('close_product', {
    productId: hotspot?.id,
    title: hotspot?.title,
    viewDuration // how long they looked at the product
  }),

  // Cart actions
  addToCart: (hotspot) => trackEvent('add_to_cart', {
    productId: hotspot.id,
    title: hotspot.title,
    price: hotspot.price,
    scene: currentScene
  }),

  removeFromCart: (item) => trackEvent('remove_from_cart', {
    productId: item.hotspotId,
    title: item.title,
    price: item.price
  }),

  updateQuantity: (item, newQuantity) => trackEvent('update_quantity', {
    productId: item.hotspotId,
    title: item.title,
    oldQuantity: item.quantity,
    newQuantity
  }),

  // Checkout
  startCheckout: (cartItems, total) => trackEvent('start_checkout', {
    itemCount: cartItems.length,
    items: cartItems.map(i => ({ id: i.hotspotId, title: i.title, qty: i.quantity, price: i.price })),
    total
  }),

  completeCheckout: (orderNumber, total) => trackEvent('complete_checkout', {
    orderNumber,
    total,
    sessionDurationAtCheckout: Math.round((Date.now() - sessionStartTime) / 1000)
  }),

  // Chatbot
  openChatbot: () => trackEvent('open_chatbot', { scene: currentScene }),
  closeChatbot: () => trackEvent('close_chatbot', { scene: currentScene }),
  sendChatMessage: (message) => trackEvent('send_chat_message', {
    messageLength: message.length,
    scene: currentScene
  }),

  // Cart sidebar
  openCart: () => trackEvent('open_cart', { scene: currentScene }),
  closeCart: () => trackEvent('close_cart', { scene: currentScene }),

  // Hotspot interactions
  clickHotspot: (hotspot) => trackEvent('click_hotspot', {
    hotspotId: hotspot.id,
    label: hotspot.label,
    scene: currentScene
  }),

  // Scroll/interaction depth
  scrollDepth: (depth) => trackEvent('scroll_depth', { depth, scene: currentScene }),

  // Errors
  trackError: (error, context) => trackEvent('error', {
    message: error.message || error,
    context,
    scene: currentScene
  })
}

// Auto-track session start (only once per session)
if (!sessionStorage.getItem(INIT_KEY)) {
  sessionStorage.setItem(INIT_KEY, 'true')
  analytics.startSession()

  // Track session end when user leaves (only register once)
  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliable delivery on page unload
    const data = JSON.stringify({
      action: 'session_end',
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: getUserId(),
      sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000),
      data: {
        totalDuration: Math.round((Date.now() - sessionStartTime) / 1000),
        lastScene: currentScene,
        lastSceneDuration: sceneEntryTime ? Math.round((Date.now() - sceneEntryTime) / 1000) : 0
      }
    })
    navigator.sendBeacon(ANALYTICS_API_URL, data)
  })
}

export default analytics
