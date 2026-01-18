const ANALYTICS_API_URL = 'http://localhost:5000/api/analytics'

/**
 * Track a user action and send it to the backend
 * @param {string} action - The action name (e.g., "add_to_cart", "navigate", "view_product")
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
  // Navigation
  navigate: (fromScene, toScene) => trackEvent('navigate', { fromScene, toScene }),

  // Product interactions
  viewProduct: (hotspot) => trackEvent('view_product', {
    productId: hotspot.id,
    title: hotspot.title,
    price: hotspot.price
  }),

  // Cart actions
  addToCart: (hotspot) => trackEvent('add_to_cart', {
    productId: hotspot.id,
    title: hotspot.title,
    price: hotspot.price
  }),
  removeFromCart: (item) => trackEvent('remove_from_cart', {
    productId: item.hotspotId,
    title: item.title
  }),
  updateQuantity: (item, newQuantity) => trackEvent('update_quantity', {
    productId: item.hotspotId,
    title: item.title,
    quantity: newQuantity
  }),

  // Checkout
  startCheckout: (cartItems, total) => trackEvent('start_checkout', {
    itemCount: cartItems.length,
    total
  }),
  completeCheckout: (orderNumber, total) => trackEvent('complete_checkout', {
    orderNumber,
    total
  }),

  // Chatbot
  openChatbot: () => trackEvent('open_chatbot', {}),
  closeChatbot: () => trackEvent('close_chatbot', {}),
  sendChatMessage: (message) => trackEvent('send_chat_message', {
    messageLength: message.length
  }),

  // Cart sidebar
  openCart: () => trackEvent('open_cart', {}),
  closeCart: () => trackEvent('close_cart', {}),

  // Hotspot click (3D scene)
  clickHotspot: (hotspot) => trackEvent('click_hotspot', {
    hotspotId: hotspot.id,
    label: hotspot.label
  })
}

export default analytics
