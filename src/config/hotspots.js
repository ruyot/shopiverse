/**
 * Hotspot Storage Manager
 * Fetches hotspot data from backend API
 */

const HOTSPOTS_KEY = 'shopiverse_hotspots_v10'
const API_BASE = 'http://localhost:5001/api'

// Default hotspots - all using 3D positions for orb rendering
// Default hotspots (fallback if API unavailable)
const defaultHotspots = {
    storeP1: [], // No hotspots on main view
    storeP1Left: [
        // Denim jeans collection
        { id: 'item-l1-1', position: [-1.26739, 0.32712, -4.65165], label: 'Denim Black', title: 'Denim Black', images: ['/Jean1.png'] },
        { id: 'item-l1-2', position: [-0.83359, 0.30862, -5.07713], label: 'Denim Sky', title: 'Denim Sky', images: ['/Jean2.png'] },
        { id: 'item-l1-3', position: [-1.20999, -0.46658, -4.60951], label: 'Denim Pink', title: 'Denim Pink', images: ['/Jean3.png'] },
        { id: 'item-l1-4', position: [-0.75232, -0.41847, -5.02241], label: 'Denim Navy', title: 'Denim Navy', images: ['/Jean4.png'] }
    ],
    storeP1Right: [
        // User-verified coordinates from P key
        { id: 'item-r1-1', position: [3.78809, 0.51201, -10.14587], label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'item-r1-2', position: [-1.79493, 0.18883, -9.57033], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r1-3', position: [1.96905, 0.00492, -12.68238], label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Left: [
        // User-verified coordinates from P key
        { id: 'item-l2-1', position: [-1.67787, 0.24783, -4.99441], label: 'Wallet', title: 'Wallet', images: ['/wallet-light-brown.jpg'] },
        { id: 'item-l2-2', position: [-1.37476, 0.17952, -6.40852], label: 'White Shirt', title: 'White Shirt', images: ['/Shirt_p2l.png'] },
        { id: 'item-l2-3', position: [1.38637, -0.20432, -3.86578], label: 'White Sweater', title: 'White Sweater', images: ['/Sweater_p2l.png'] }
    ],
    storeP2Right: [
        // User-verified coordinates from P key
        { id: 'item-r2-1', position: [-1.12, -0.0, -8.96], label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'item-r2-2', position: [1.1706, 0.23128, -19.74972], label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'item-r2-3', position: [2.40998, 0.0527, -8.3369], label: 'Product 3', title: 'Product 3', images: [] }
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

