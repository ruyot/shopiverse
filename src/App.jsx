import { useState, useEffect, useCallback, useRef } from 'react'
import { navigationConfig, initialViewpoint } from './config/navigation'
import { PLYViewer } from './components/PLYViewer'
import { ProductCard } from './components/ProductCard'
import { CartSidebar } from './components/CartSidebar'
import { SuccessModal } from './components/SuccessModal'
import { Terminal, X, ShoppingCart, Send } from 'lucide-react'
import { getSettings } from './config/settings'
import { getSceneHotspotsAsync } from './config/hotspots'
import { sendChatMessage, loadInventory } from './utils/backboardChat'
import analytics from './utils/analytics'
import './App.css'

/**
 * Shopiverse - Google Street View Style Store Navigation
 * 
 * Supports both 2D images and 3D PLY models.
 * When a viewpoint has a `ply` path, the 3D viewer is shown.
 * Otherwise, falls back to the 2D image.
 */
function App() {
    const [currentId, setCurrentId] = useState(initialViewpoint)
    const [history, setHistory] = useState([initialViewpoint])
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showCommands, setShowCommands] = useState(false)
    const [showHotspots, setShowHotspots] = useState(() => getSettings().showHotspots)
    const [contentVisible, setContentVisible] = useState(() => !navigationConfig[initialViewpoint].ply) // Controls delayed visibility of arrows/hotspots
    const [currentHotspots, setCurrentHotspots] = useState([])
    const [selectedHotspot, setSelectedHotspot] = useState(null)
    const [cartItems, setCartItems] = useState(() => {
        // Load cart from localStorage on mount
        const savedCart = localStorage.getItem('shopiverse_cart')
        return savedCart ? JSON.parse(savedCart) : []
    })
    const [showCart, setShowCart] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [orderDetails, setOrderDetails] = useState(null)
    const [showChatbot, setShowChatbot] = useState(false)
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', content: "Hi! I'm Lobo, your shopping assistant. How can I help you today?" }
    ])
    const [chatInput, setChatInput] = useState('')
    const [isChatLoading, setIsChatLoading] = useState(false)
    const [inventory, setInventory] = useState({})
    const chatMessagesEndRef = useRef(null)

    const currentViewpoint = navigationConfig[currentId]
    const connections = currentViewpoint?.connections || {}
    const isStoreFront = currentId === 'storeFront'
    const hasPLY = !!currentViewpoint?.ply

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('shopiverse_cart', JSON.stringify(cartItems))
    }, [cartItems])

    // Track initial scene entry on mount (guard against StrictMode double-mount)
    const hasTrackedInitialScene = useRef(false)
    useEffect(() => {
        if (!hasTrackedInitialScene.current) {
            hasTrackedInitialScene.current = true
            analytics.enterScene(initialViewpoint)
        }
    }, [])

    // Add item to cart
    const addToCart = useCallback((hotspot) => {
        analytics.addToCart(hotspot)
        setCartItems(prevItems => {
            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(item => item.hotspotId === hotspot.id)

            if (existingItemIndex > -1) {
                // Item exists, increment quantity
                const updatedItems = [...prevItems]
                updatedItems[existingItemIndex].quantity += 1
                return updatedItems
            } else {
                // New item, add to cart
                const newItem = {
                    id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    hotspotId: hotspot.id,
                    title: hotspot.title || hotspot.label || 'Product',
                    price: hotspot.price ? parseFloat(hotspot.price.replace('$', '')) : 49.99,
                    quantity: 1,
                    image: hotspot.images && hotspot.images.length > 0 ? hotspot.images[0] : null
                }
                return [...prevItems, newItem]
            }
        })
    }, [])

    // Remove item from cart
    const removeFromCart = useCallback((cartItemId) => {
        setCartItems(prevItems => {
            const item = prevItems.find(i => i.id === cartItemId)
            if (item) analytics.removeFromCart(item)
            return prevItems.filter(item => item.id !== cartItemId)
        })
    }, [])

    // Update item quantity
    const updateQuantity = useCallback((cartItemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(cartItemId)
            return
        }
        setCartItems(prevItems => {
            const item = prevItems.find(i => i.id === cartItemId)
            if (item) analytics.updateQuantity(item, newQuantity)
            return prevItems.map(item =>
                item.id === cartItemId ? { ...item, quantity: newQuantity } : item
            )
        })
    }, [removeFromCart])

    // Clear entire cart
    const clearCart = useCallback(() => {
        setCartItems([])
    }, [])

    // Handle hotspot click (stable reference to prevent PLYViewer re-renders)
    const handleHotspotClick = useCallback((hotspot) => {
        analytics.viewProduct(hotspot)
        setSelectedHotspot(hotspot)
    }, [])

    // Stripe checkout - redirect to Stripe hosted page
    const handleCheckout = useCallback(async () => {
        try {
            const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            analytics.startCheckout(cartItems, total)

            // Close cart
            setShowCart(false)

            // Create checkout session
            const response = await fetch('http://localhost:3001/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems }),
            })

            const { url } = await response.json()

            // Redirect to Stripe Checkout
            window.location.href = url
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Failed to start checkout. Please make sure the server is running.')
        }
    }, [cartItems])

    // Check for Stripe success redirect
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const success = urlParams.get('success')
        const sessionId = urlParams.get('session_id')

        if (success === 'true' && sessionId) {
            // Fetch session details from backend
            fetch(`http://localhost:3001/session/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    const session = data.session

                    // Calculate total
                    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    const tax = subtotal * 0.13
                    const total = subtotal + tax

                    // Create order details
                    const details = {
                        orderNumber: sessionId.substring(8, 16).toUpperCase(),
                        customerName: session.customer_details?.name || 'Customer',
                        customerEmail: session.customer_details?.email || 'N/A',
                        items: cartItems,
                        total: total,
                        timestamp: new Date().toISOString()
                    }

                    setOrderDetails(details)
                    setShowSuccess(true)
                    analytics.completeCheckout(details.orderNumber, details.total)
                    clearCart()

                    // Clean up URL
                    window.history.replaceState({}, '', '/')
                })
                .catch(err => {
                    console.error('Error fetching session:', err)
                    // Still show success with basic info
                    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    const tax = subtotal * 0.13
                    const total = subtotal + tax

                    setOrderDetails({
                        orderNumber: sessionId.substring(8, 16).toUpperCase(),
                        customerName: 'Customer',
                        customerEmail: 'N/A',
                        items: cartItems,
                        total: total,
                        timestamp: new Date().toISOString()
                    })
                    setShowSuccess(true)
                    clearCart()
                    window.history.replaceState({}, '', '/')
                })
        }
    }, [cartItems, clearCart])

    // Close success modal
    const handleSuccessClose = useCallback(() => {
        setShowSuccess(false)
        setOrderDetails(null)
    }, [])

    // Load hotspots for current scene
    useEffect(() => {
        const loadHotspots = async () => {
            const hotspots = await getSceneHotspotsAsync(currentId)
            setCurrentHotspots(hotspots)
        }
        loadHotspots()
    }, [currentId])

    // Set content visible after initial load (for PLY scenes)
    useEffect(() => {
        if (hasPLY && !contentVisible) {
            const timer = setTimeout(() => {
                setContentVisible(true)
            }, 1200) // Allow time for splat to load
            return () => clearTimeout(timer)
        }
    }, [hasPLY])

    // Load inventory when chatbot opens
    useEffect(() => {
        if (showChatbot && Object.keys(inventory).length === 0) {
            loadInventory().then(setInventory)
        }
    }, [showChatbot])

    // Scroll to bottom of chat messages
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Handle sending chat message with streaming
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return

        const userMessage = chatInput.trim()
        analytics.sendChatMessage(userMessage)
        setChatInput('')

        // Add user message to chat
        const newMessages = [...chatMessages, { role: 'user', content: userMessage }]
        setChatMessages(newMessages)
        setIsChatLoading(true)

        try {
            let streamedContent = ''
            let assistantMessageAdded = false
            const assistantMessageIndex = newMessages.length
            
            // Get AI response with streaming and inventory
            const result = await sendChatMessage(
                userMessage,
                (chunk) => {
                    // Add assistant message on first chunk
                    if (!assistantMessageAdded) {
                        assistantMessageAdded = true
                        setChatMessages([...newMessages, { role: 'assistant', content: '' }])
                    }
                    
                    // Update the assistant message with streamed content
                    streamedContent += chunk
                    setChatMessages(msgs => {
                        const updated = [...msgs]
                        updated[assistantMessageIndex] = {
                            role: 'assistant',
                            content: streamedContent
                        }
                        return updated
                    })
                },
                inventory
            )
            
            // Add LLM-selected products to final message
            if (result.products && result.products.length > 0) {
                setChatMessages(msgs => {
                    const updated = [...msgs]
                    updated[assistantMessageIndex] = {
                        ...updated[assistantMessageIndex],
                        products: result.products
                    }
                    return updated
                })
            }
        } catch (error) {
            console.error('Chat error:', error)
            setChatMessages(msgs => {
                const updated = [...msgs]
                updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: "I'm sorry, I encountered an error. Please try again."
                }
                return updated
            })
        } finally {
            setIsChatLoading(false)
        }
    }

    // Handle Enter key in chat input
    const handleChatKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Listen for hotspot changes
    useEffect(() => {
        const handleHotspotsChange = async (event) => {
            // Reload hotspots if they changed for current scene
            if (!event.detail.sceneId || event.detail.sceneId === currentId) {
                const hotspots = await getSceneHotspotsAsync(currentId)
                setCurrentHotspots(hotspots)
            }
        }

        window.addEventListener('hotspotsChanged', handleHotspotsChange)
        return () => window.removeEventListener('hotspotsChanged', handleHotspotsChange)
    }, [currentId])

    // Navigate to a new viewpoint
    const navigateTo = useCallback((targetId) => {
        if (!targetId || isTransitioning) return

        analytics.navigate(currentId, targetId)
        setIsTransitioning(true)
        setContentVisible(false) // Hide arrows/hotspots during transition

        setTimeout(() => {
            setCurrentId(targetId)
            setHistory(prev => [...prev, targetId])
            setIsTransitioning(false)

            // Delay showing content to match splat loading
            setTimeout(() => {
                setContentVisible(true)
            }, 800)
        }, 200)
    }, [isTransitioning, currentId])

    // Listen for settings changes from admin panel
    useEffect(() => {
        const handleSettingsChange = (event) => {
            setShowHotspots(event.detail.showHotspots)
        }

        window.addEventListener('settingsChanged', handleSettingsChange)
        return () => window.removeEventListener('settingsChanged', handleSettingsChange)
    }, [])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    if (connections.forward) navigateTo(connections.forward)
                    break
                case 'ArrowDown':
                    if (connections.back) navigateTo(connections.back)
                    break
                case 'ArrowLeft':
                    if (connections.left) navigateTo(connections.left)
                    break
                case 'ArrowRight':
                    if (connections.right) navigateTo(connections.right)
                    break
                case 'Enter':
                    if (hasPLY) break
                    if (connections.forward) navigateTo(connections.forward)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [connections, navigateTo, hasPLY])

    return (
        <div className="app">
            {/* 3D PLY Viewer (shown when PLY model is available) */}
            <PLYViewer
                plyPath={currentViewpoint.ply}
                isActive={hasPLY}
                hotspots={showHotspots ? currentHotspots : []}
                onHotspotClick={handleHotspotClick}
            />

            {/* Background image (shown when no PLY, or as fallback) */}
            <div
                className={`viewpoint-image ${isTransitioning ? 'fading' : ''}`}
                style={{
                    backgroundImage: `url(${currentViewpoint.image})`,
                    opacity: hasPLY ? 0 : 1
                }}
            />

            {/* Location indicator */}
            <header className="location-header">
                <span>{currentViewpoint.name}</span>
            </header>

            {/* Ground-level navigation arrows */}
            {(
                <nav className="ground-nav" style={{
                    opacity: contentVisible ? 1 : 0,
                    transition: 'opacity 0.6s ease-in'
                }}>
                    {/* Forward arrow */}
                    {connections.forward && (
                        <button
                            className="ground-arrow forward"
                            onClick={() => navigateTo(connections.forward)}
                            aria-label="Move forward"
                        >
                            <ChevronIcon />
                        </button>
                    )}

                    {/* Back arrow */}
                    {connections.back && (
                        <button
                            className="ground-arrow back"
                            onClick={() => navigateTo(connections.back)}
                            aria-label="Go back"
                        >
                            <ChevronIcon />
                        </button>
                    )}

                    {/* Left arrow */}
                    {connections.left && (
                        <button
                            className="ground-arrow left"
                            onClick={() => navigateTo(connections.left)}
                            aria-label="Look left"
                        >
                            <ChevronIcon />
                        </button>
                    )}

                    {/* Right arrow */}
                    {connections.right && (
                        <button
                            className="ground-arrow right"
                            onClick={() => navigateTo(connections.right)}
                            aria-label="Look right"
                        >
                            <ChevronIcon />
                        </button>
                    )}
                </nav>
            )}

            {/* Product hotspots - Only for 2D image scenes (3D scenes use mesh hotspots in PLYViewer) */}
            {showHotspots && !hasPLY && currentHotspots.map((hotspot) => {
                const settings = getSettings()
                const isDisabled = settings.disabledHotspots[hotspot.id]

                if (isDisabled || !hotspot.x || !hotspot.y) return null

                return (
                    <button
                        key={hotspot.id}
                        className="product-hotspot"
                        style={{
                            left: `${hotspot.x}%`,
                            top: `${hotspot.y}%`,
                            opacity: contentVisible ? 1 : 0,
                            transition: 'opacity 0.6s ease-in'
                        }}
                        onClick={() => {
                            analytics.viewProduct(hotspot)
                            setSelectedHotspot(hotspot)
                        }}
                        aria-label={hotspot.label}
                    >
                        <span className="hotspot-ring" />
                        <span className="hotspot-core" />
                    </button>
                )
            })}



            {/* Lobo Chatbot Character - Only on Storefront */}
            {isStoreFront && (
                <button
                    className="lobo-character"
                    onClick={() => {
                        const newState = !showChatbot
                        newState ? analytics.openChatbot() : analytics.closeChatbot()
                        setShowChatbot(newState)
                    }}
                    title="Chat with Lobo"
                >
                    <img src="/lobo.png" alt="Lobo Assistant" />
                </button>
            )}

            {/* Shopping Cart Icon */}
            <button
                className="cart-icon"
                onClick={() => {
                    const newState = !showCart
                    newState ? analytics.openCart() : analytics.closeCart()
                    setShowCart(newState)
                }}
                title="Shopping Cart"
            >
                <ShoppingCart size={20} strokeWidth={2} />
                {cartItems.length > 0 && (
                    <span className="cart-badge">{cartItems.length}</span>
                )}
            </button>

            {/* Command Palette Toggle */}
            <button
                className="command-toggle"
                onClick={() => setShowCommands(!showCommands)}
                title="Show Controls"
            >
                <Terminal size={20} strokeWidth={2} />
            </button>

            {/* Command Palette */}
            {showCommands && (
                <div className="command-palette">
                    <div className="command-header">
                        <h3>CONTROLS</h3>
                        <button
                            className="command-close"
                            onClick={() => setShowCommands(false)}
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>
                    <div className="command-list">
                        <div className="command-section">
                            <div className="command-section-title">3D MODE CONTROLS</div>
                            <div className="command-item">
                                <span className="command-key">W</span>
                                <span className="command-desc">Move Forward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">A</span>
                                <span className="command-desc">Strafe Left</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">S</span>
                                <span className="command-desc">Move Backward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">D</span>
                                <span className="command-desc">Strafe Right</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">Q</span>
                                <span className="command-desc">Move Down</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">E</span>
                                <span className="command-desc">Move Up</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">MOUSE</span>
                                <span className="command-desc">Look Around</span>
                            </div>
                        </div>
                        <div className="command-section">
                            <div className="command-section-title">INTERACTIONS</div>
                            <div className="command-item">
                                <span className="command-key">CLICK</span>
                                <span className="command-desc">Navigate / Interact</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">SPACE</span>
                                <span className="command-desc">Move Forward</span>
                            </div>
                        </div>
                        <div className="command-section">
                            <div className="command-section-title">NAVIGATION (2D MODE)</div>
                            <div className="command-item">
                                <span className="command-key">↑</span>
                                <span className="command-desc">Move Forward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">↓</span>
                                <span className="command-desc">Move Backward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">←</span>
                                <span className="command-desc">Look Left</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">→</span>
                                <span className="command-desc">Look Right</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">ENTER</span>
                                <span className="command-desc">Move Forward</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {selectedHotspot && (
                <ProductCard
                    hotspot={selectedHotspot}
                    position={{ x: selectedHotspot.x, y: selectedHotspot.y }}
                    onClose={() => setSelectedHotspot(null)}
                    onAddToCart={addToCart}
                />
            )}

            {/* Cart Sidebar */}
            <CartSidebar
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                cartItems={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={handleCheckout}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccess}
                onClose={handleSuccessClose}
                orderDetails={orderDetails}
            />

            {/* Lobo Chatbot Modal */}
            {showChatbot && (
                <div className="chatbot-modal">
                    <div className="chatbot-header">
                        <div className="chatbot-avatar">
                            <img src="/lobo.png" alt="Lobo" />
                        </div>
                        <div className="chatbot-title">
                            <h3>Lobo Assistant</h3>
                            <span className="chatbot-status">Online</span>
                        </div>
                        <button className="chatbot-close" onClick={() => setShowChatbot(false)}>
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>
                    <div className="chatbot-messages">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={`chatbot-message ${message.role === 'assistant' ? 'bot' : 'user'}`}>
                                {message.role === 'assistant' && (
                                    <div className="message-avatar">
                                        <img src="/lobo.png" alt="Lobo" />
                                    </div>
                                )}
                                <div className="message-bubble">
                                    {message.content}
                                    {message.products && message.products.length > 0 && (
                                        <div className="product-buttons">
                                            {message.products.map((product, idx) => (
                                                <button 
                                                    key={idx}
                                                    className="product-teleport-btn"
                                                    onClick={() => {
                                                        navigateTo(product.scene)
                                                        setShowChatbot(false)
                                                    }}
                                                >
                                                    📍 Go to {product.title} in {product.sceneName}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="chatbot-message bot">
                                <div className="message-avatar">
                                    <img src="/lobo.png" alt="Lobo" />
                                </div>
                                <div className="message-bubble typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <div className="chatbot-input">
                        <input 
                            type="text" 
                            placeholder="Type your message..." 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={handleChatKeyPress}
                            disabled={isChatLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isChatLoading || !chatInput.trim()}
                        >
                            <Send size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Google Street View style chevron arrow
function ChevronIcon() {
    return (
        <svg viewBox="0 0 36 36" fill="none">
            <path
                d="M18 8 L30 22 L18 18 L6 22 Z"
                fill="currentColor"
            />
        </svg>
    )
}

export default App
