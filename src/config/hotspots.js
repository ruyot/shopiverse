/**
 * Hotspot Storage Manager
 * Manages hotspot data with localStorage persistence
 */

const HOTSPOTS_KEY = 'shopiverse_hotspots_v9'

// Default hotspots - all using 3D positions for orb rendering
const defaultHotspots = {
    storeP1: [], // No hotspots on main view
    storeP1Left: [
        { id: 'jeans-1', position: [-0.5, 0.3, -3.5], label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-2', position: [-1.0, 0.3, -3.0], label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-3', position: [-1.0, -0.2, -3.0], label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] },
        { id: 'jeans-4', position: [-0.5, -0.2, -3.5], label: 'Classic Denim', title: 'Classic Denim Jeans', images: [] }
    ],
    storeP1Right: [
        { id: 'item-r1-1', position: [-0.8, 0.4, -3.0], label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-r1-2', position: [0, 0.2, -3.5], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r1-3', position: [0.8, 0.3, -3.0], label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Left: [
        // User-verified coordinates from P key
        { id: 'item-l2-1', position: [-0.85463, -0.03372, -2.93187], label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'item-l2-2', position: [-2.09195, 0.00990, -8.17967], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-l2-3', position: [2.68586, 0.27952, -7.55009], label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Right: [
        { id: 'item-r2-1', position: [-0.5, 0.2, -3.5], label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-r2-2', position: [0.3, 0.1, -4.0], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r2-3', position: [0.8, 0.2, -4.5], label: 'Product 3', title: 'Product 3', images: [] }
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
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(defaultHotspots))
        return defaultHotspots
    } catch (error) {
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
