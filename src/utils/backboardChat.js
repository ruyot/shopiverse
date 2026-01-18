/**
 * Backboard.io Chat Service with Persistent Memory
 * Uses Backboard SDK for chatbot functionality with memory across conversations
 * Includes inventory checking against hotspots.json
 */

import { BackboardClient } from 'backboard-sdk'

const BACKBOARD_API_KEY = import.meta.env.VITE_BACKBOARD_API_KEY

// Singleton client and assistant
let client = null
let assistant = null
let currentThread = null

/**
 * Initialize Backboard client and assistant
 */
async function initializeBackboard() {
    if (!BACKBOARD_API_KEY) {
        throw new Error('Backboard API key not configured')
    }

    if (!client) {
        client = new BackboardClient({
            apiKey: BACKBOARD_API_KEY
        })
    }

    if (!assistant) {
        try {
            // Try to get existing assistant or create new one
            assistant = await client.createAssistant({
                name: 'Lobo Shopping Assistant',
                system_prompt: `You are Lobo, a helpful shopping assistant for Shopiverse, a 3D virtual store. 
You help customers find products, check availability, and answer questions about items in the store.

Guidelines:
- Be friendly, helpful, and concise
- Remember customer preferences and past conversations
- When customers ask about products, check if they're in stock
- Help guide customers through the virtual store
- Suggest products based on their interests and previous interactions
- Use your memory to provide personalized recommendations`
            })
        } catch (error) {
            console.error('Error creating assistant:', error)
            throw error
        }
    }

    return { client, assistant }
}

/**
 * Get or create a thread for the current session
 */
async function getThread() {
    if (!currentThread) {
        const { client, assistant } = await initializeBackboard()
        currentThread = await client.createThread(assistant.assistantId)
    }
    return currentThread
}

/**
 * Send a message with streaming response and memory enabled
 * @param {string} userMessage - User's message
 * @param {Object} inventory - Current inventory from hotspots.json
 * @param {Function} onChunk - Callback for streaming chunks
 * @returns {Promise<string>} - Complete AI response
 */
export async function sendChatMessage(userMessage, inventory, onChunk = null) {
    if (!BACKBOARD_API_KEY) {
        return "I'm sorry, but the chat service is not configured. Please add your Backboard API key to the .env file."
    }

    try {
        const thread = await getThread()
        const inventoryContext = buildInventoryContext(inventory)
        
        // Add inventory context to the message
        const messageWithContext = `${userMessage}

[Current Store Inventory:
${inventoryContext}]`

        // Send message with memory enabled and streaming
        const stream = await client.addMessage(thread.threadId, {
            content: messageWithContext,
            memory: 'Auto',  // Enable automatic memory saving and retrieval
            stream: true
        })

        let fullResponse = ''
        let memoriesFound = 0

        // Process streaming chunks
        for await (const chunk of stream) {
            if (chunk.type === 'content_streaming') {
                const content = chunk.content || ''
                fullResponse += content
                if (onChunk) {
                    onChunk({ type: 'content', content })
                }
            } else if (chunk.type === 'memory_retrieved') {
                // Memories were retrieved from previous conversations
                const memories = chunk.memories || []
                memoriesFound = memories.length
                if (memoriesFound > 0 && onChunk) {
                    onChunk({ type: 'memory', count: memoriesFound })
                }
            } else if (chunk.type === 'run_ended') {
                // Memory operation ID for tracking
                if (chunk.memoryOperationId && onChunk) {
                    onChunk({ type: 'memory_saved', operationId: chunk.memoryOperationId })
                }
            }
        }

        return fullResponse
    } catch (error) {
        console.error('Error in Backboard chat:', error)
        return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
    }
}

/**
 * Reset the current thread (start a new conversation)
 */
export async function resetThread() {
    currentThread = null
}

/**
 * Build inventory context string from hotspots data
 * @param {Object} inventory - Hotspots data organized by scene
 * @returns {string} - Formatted inventory context
 */
function buildInventoryContext(inventory) {
    if (!inventory || typeof inventory !== 'object') {
        return 'No inventory data available.'
    }

    const scenes = Object.entries(inventory)
    if (scenes.length === 0) {
        return 'No products currently in stock.'
    }

    let context = ''
    
    scenes.forEach(([sceneName, products]) => {
        if (products && products.length > 0) {
            context += `\n${formatSceneName(sceneName)}:\n`
            products.forEach(product => {
                const title = product.title || product.label || 'Unnamed Product'
                const price = product.price ? ` - $${product.price}` : ''
                const hasImages = product.images && product.images.length > 0 ? ' (with images)' : ''
                context += `  - ${title}${price}${hasImages}\n`
            })
        }
    })

    return context || 'No products currently in stock.'
}

/**
 * Format scene name for display
 * @param {string} sceneName - Scene ID like 'storeP1Left'
 * @returns {string} - Formatted name like 'Store P1 Left'
 */
function formatSceneName(sceneName) {
    return sceneName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
}

/**
 * Load current inventory from API
 * @returns {Promise<Object>} - Inventory data
 */
export async function loadInventory() {
    try {
        const response = await fetch('http://localhost:5000/api/hotspots')
        if (!response.ok) {
            throw new Error('Failed to load inventory')
        }
        return await response.json()
    } catch (error) {
        console.error('Error loading inventory:', error)
        return {}
    }
}
