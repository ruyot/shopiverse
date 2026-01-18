/**
 * Hotspot Storage Manager
 * Manages hotspot data separately from navigation config for persistence
 */

const HOTSPOTS_KEY = 'shopiverse_hotspots_v2'

// Default hotspots from original navigation config
const defaultHotspots = {
    storeP1: [
        {
            id: 'jeans-main',
            x: 65, y: 50,
            label: 'Classic Denim',
            title: 'Classic Denim Jeans',
            description: 'Premium raw denim with a classic straight leg fit.',
            price: '$129.00',
            images: []
        },
        {
            id: 'shirt-main',
            x: 35, y: 50,
            label: 'Summer Shirt',
            title: 'Linen Summer Shirt',
            description: 'Lightweight linen shirt perfect for warm weather.',
            price: '$89.00',
            images: []
        },
        // Test hotspot center
        {
            id: 'test-center',
            x: 50, y: 50,
            label: 'Center Item',
            title: 'Featured Collection',
            description: 'New arrivals for the season.',
            price: '$49.00',
            images: []
        }
    ],
    storeP1Left: [
        { id: 'jeans-1', x: 38, y: 42, label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-2', x: 28, y: 42, label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-3', x: 28, y: 65, label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-4', x: 39, y: 64, label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] }
    ],
    storeP1Right: [
        { id: 'item-r1-1', x: 30, y: 35, label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-r1-2', x: 50, y: 45, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r1-3', x: 70, y: 40, label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Left: [
        { id: 'item-l2-1', x: 21, y: 45, label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-l2-2', x: 30, y: 35, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-l2-3', x: 80, y: 55, label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Right: [
        { id: 'item-r2-1', x: 39, y: 50, label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-r2-2', x: 57, y: 46, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r2-3', x: 68, y: 42, label: 'Product 3', title: 'Product 3', images: [] }
    ]
}

/**
 * Get all hotspots from storage
 */
export const getAllHotspots = () => {
    try {
        const stored = localStorage.getItem(HOTSPOTS_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
        // Initialize with defaults if not found
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(defaultHotspots))
        return defaultHotspots
    } catch (error) {
        console.error('Error loading hotspots:', error)
        return defaultHotspots
    }
}

/**
 * Get hotspots for a specific scene
 */
export const getSceneHotspots = (sceneId) => {
    const allHotspots = getAllHotspots()
    return allHotspots[sceneId] || []
}

/**
 * Save hotspots for a specific scene
 */
export const saveSceneHotspots = (sceneId, hotspots) => {
    try {
        const allHotspots = getAllHotspots()
        allHotspots[sceneId] = hotspots
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(allHotspots))

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('hotspotsChanged', {
            detail: { sceneId, hotspots }
        }))

        return true
    } catch (error) {
        console.error('Error saving hotspots:', error)
        return false
    }
}

/**
 * Delete all hotspots for a scene
 */
export const deleteSceneHotspots = (sceneId) => {
    return saveSceneHotspots(sceneId, [])
}

/**
 * Export hotspots as JSON file
 */
export const exportHotspots = () => {
    const allHotspots = getAllHotspots()
    const dataStr = JSON.stringify(allHotspots, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `shopiverse-hotspots-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
    console.log('📥 Hotspot metadata exported')
}

/**
 * Import hotspots from JSON file
 */
export const importHotspots = (jsonData) => {
    try {
        const hotspots = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(hotspots))

        // Notify all components
        window.dispatchEvent(new CustomEvent('hotspotsChanged', {
            detail: { imported: true }
        }))

        return true
    } catch (error) {
        console.error('Error importing hotspots:', error)
        return false
    }
}

/**
 * Reset hotspots to defaults
 */
export const resetHotspots = () => {
    localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(defaultHotspots))
    window.dispatchEvent(new CustomEvent('hotspotsChanged', {
        detail: { reset: true }
    }))
}
