/**
 * Hotspot Storage Manager
 * Fetches hotspot data from backend API
 */

const HOTSPOTS_KEY = 'shopiverse_hotspots_v7'
const API_BASE = 'http://localhost:5000/api'

// Default hotspots - all using 3D positions for orb rendering
// Default hotspots (fallback if API unavailable)
const defaultHotspots = {
    storeP1: [
        // Single hotspot for main store view - position needs verification with P key
        { id: 'featured-item', position: [0, 0.2, -3.0], label: 'Featured', title: 'Featured Collection', description: 'New arrivals for the season.', price: '$99.00', images: [] }
    ],
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
        // User-verified coordinate from P key
        { id: 'item-l2-1', position: [-1.59639, 0.25532, -4.51801], label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] }
    ],
    storeP2Right: [
        { id: 'item-r2-1', position: [-0.5, 0.2, -3.5], label: 'Wallet', title: 'Wallet', images: ['/wallet-black.png', '/wallet-dark-brown.jpg', '/wallet-grey.jpg', '/wallet-light-brown.jpg'] },
        { id: 'item-r2-2', position: [0.3, 0.1, -4.0], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r2-3', position: [0.8, 0.2, -4.5], label: 'Product 3', title: 'Product 3', images: [] }
    ]
}

// In-memory cache for sync access
let hotspotsCache = null

/**
 * Get all hotspots from API
 */
export const getAllHotspots = async () => {
    try {
        const response = await fetch(`${API_BASE}/hotspots`)
        if (response.ok) {
            const data = await response.json()
            hotspotsCache = data
            return data
        }
        throw new Error('API unavailable')
    } catch (error) {
        console.warn('API unavailable, using defaults:', error.message)
        return defaultHotspots
    }
}

/**
 * Get all hotspots synchronously (from cache only)
 */
export const getAllHotspotsSync = () => {
    return hotspotsCache || defaultHotspots
}

/**
 * Get hotspots for a specific scene (sync version for React)
 */
export const getSceneHotspots = (sceneId) => {
    const allHotspots = getAllHotspotsSync()
    return allHotspots[sceneId] || []
}

/**
 * Get hotspots for a specific scene (async from API)
 */
export const getSceneHotspotsAsync = async (sceneId) => {
    try {
        const response = await fetch(`${API_BASE}/hotspots/${sceneId}`)
        if (response.ok) {
            return await response.json()
        }
        throw new Error('API unavailable')
    } catch (error) {
        return getSceneHotspots(sceneId)
    }
}

/**
 * Save hotspots for a specific scene (to API)
 */
export const saveSceneHotspots = async (sceneId, hotspots) => {
    try {
        const response = await fetch(`${API_BASE}/hotspots/${sceneId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hotspots)
        })

        if (response.ok) {
            // Update in-memory cache
            if (hotspotsCache) {
                hotspotsCache[sceneId] = hotspots
            }

            window.dispatchEvent(new CustomEvent('hotspotsChanged', {
                detail: { sceneId, hotspots }
            }))
            return true
        }
        throw new Error('API save failed')
    } catch (error) {
        console.error('Failed to save hotspots:', error.message)
        return false
    }
}

/**
 * Update images for a specific hotspot (API)
 */
export const updateHotspotImages = async (sceneId, hotspotId, images) => {
    try {
        const response = await fetch(`${API_BASE}/hotspots/${sceneId}/${hotspotId}/images`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images })
        })

        if (response.ok) {
            // Update in-memory cache
            if (hotspotsCache) {
                const sceneHotspots = hotspotsCache[sceneId] || []
                const hotspotIndex = sceneHotspots.findIndex(h => h.id === hotspotId)
                if (hotspotIndex >= 0) {
                    sceneHotspots[hotspotIndex].images = images
                }
            }

            window.dispatchEvent(new CustomEvent('hotspotsChanged', {
                detail: { sceneId, hotspotId, images }
            }))
            return true
        }
        throw new Error('API update failed')
    } catch (error) {
        console.error('Failed to update images:', error.message)
        return false
    }
}

/**
 * Delete an image from a hotspot (API)
 */
export const deleteHotspotImage = async (sceneId, hotspotId, imageIndex) => {
    try {
        const response = await fetch(`${API_BASE}/hotspots/${sceneId}/${hotspotId}/images/${imageIndex}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            // Update in-memory cache
            if (hotspotsCache) {
                const sceneHotspots = hotspotsCache[sceneId] || []
                const hotspotIndex = sceneHotspots.findIndex(h => h.id === hotspotId)
                if (hotspotIndex >= 0) {
                    sceneHotspots[hotspotIndex].images.splice(imageIndex, 1)
                }
            }

            window.dispatchEvent(new CustomEvent('hotspotsChanged', {
                detail: { sceneId, hotspotId, imageIndex, deleted: true }
            }))
            return true
        }
        throw new Error('API delete failed')
    } catch (error) {
        console.error('Failed to delete image:', error.message)
        return false
    }
}

/**
 * Export hotspots as JSON file
 */
export const exportHotspots = async () => {
    const allHotspots = await getAllHotspots()
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
export const importHotspots = async (jsonData) => {
    try {
        const hotspots = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

        // Save each scene to API
        for (const [sceneId, sceneHotspots] of Object.entries(hotspots)) {
            await saveSceneHotspots(sceneId, sceneHotspots)
        }

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
export const resetHotspots = async () => {
    try {
        const response = await fetch(`${API_BASE}/hotspots/reset`, {
            method: 'POST'
        })

        if (response.ok) {
            hotspotsCache = { ...defaultHotspots }
            window.dispatchEvent(new CustomEvent('hotspotsChanged', {
                detail: { reset: true }
            }))
            return true
        }
        throw new Error('API reset failed')
    } catch (error) {
        console.error('Failed to reset hotspots:', error.message)
        return false
    }
}

/**
 * Delete all hotspots for a scene
 */
export const deleteSceneHotspots = (sceneId) => {
    return saveSceneHotspots(sceneId, [])
}

