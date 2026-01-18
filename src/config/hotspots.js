/**
 * Hotspot Storage Manager
 * Fetches hotspot data from backend API
 */

const API_BASE = 'http://localhost:5000/api'

// Default hotspots (fallback if API unavailable)
const defaultHotspots = {
    storeP1: [
        { id: 'p1-1', x: 65, y: 50, label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'p1-2', x: 35, y: 50, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'p1-3', x: 50, y: 50, label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP1Left: [
        { id: 'p1l-1', x: 38, y: 42, label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'p1l-2', x: 28, y: 42, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'p1l-3', x: 28, y: 65, label: 'Product 3', title: 'Product 3', images: [] },
        { id: 'p1l-4', x: 39, y: 64, label: 'Product 4', title: 'Product 4', images: [] }
    ],
    storeP1Right: [
        { id: 'p1r-1', x: 30, y: 35, label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'p1r-2', x: 50, y: 45, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'p1r-3', x: 70, y: 40, label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Left: [
        { id: 'p2l-1', x: 21, y: 45, label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'p2l-2', x: 30, y: 35, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'p2l-3', x: 80, y: 55, label: 'Product 3', title: 'Product 3', images: [] }
    ],
    storeP2Right: [
        { id: 'p2r-1', x: 39, y: 50, label: 'Product 1', title: 'Product 1', images: [] },
        { id: 'p2r-2', x: 57, y: 46, label: 'Product 2', title: 'Product 2', images: [] },
        { id: 'p2r-3', x: 68, y: 42, label: 'Product 3', title: 'Product 3', images: [] }
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

