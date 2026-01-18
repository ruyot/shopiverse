/**
 * Hotspot Storage Manager
 * Fetches hotspot data from backend API with localStorage fallback
 */

const API_BASE = 'http://localhost:5000/api'
const HOTSPOTS_KEY = 'shopiverse_hotspots_v2'

// Default hotspots (fallback if API unavailable)
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
 * Get all hotspots from API (with localStorage fallback)
 */
export const getAllHotspots = async () => {
    try {
        const response = await fetch(`${API_BASE}/hotspots`)
        if (response.ok) {
            const data = await response.json()
            // Cache in localStorage for offline fallback
            localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(data))
            return data
        }
        throw new Error('API unavailable')
    } catch (error) {
        console.warn('API unavailable, using localStorage fallback:', error.message)
        // Fallback to localStorage
        const stored = localStorage.getItem(HOTSPOTS_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
        return defaultHotspots
    }
}

/**
 * Get all hotspots synchronously (from cache only)
 */
export const getAllHotspotsSync = () => {
    try {
        const stored = localStorage.getItem(HOTSPOTS_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
        return defaultHotspots
    } catch (error) {
        return defaultHotspots
    }
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
            // Update local cache
            const allHotspots = getAllHotspotsSync()
            allHotspots[sceneId] = hotspots
            localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(allHotspots))
            
            window.dispatchEvent(new CustomEvent('hotspotsChanged', { 
                detail: { sceneId, hotspots } 
            }))
            return true
        }
        throw new Error('API save failed')
    } catch (error) {
        console.warn('API unavailable, saving to localStorage:', error.message)
        // Fallback to localStorage only
        const allHotspots = getAllHotspotsSync()
        allHotspots[sceneId] = hotspots
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(allHotspots))
        
        window.dispatchEvent(new CustomEvent('hotspotsChanged', { 
            detail: { sceneId, hotspots } 
        }))
        return true
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
            // Update local cache
            const allHotspots = getAllHotspotsSync()
            const sceneHotspots = allHotspots[sceneId] || []
            const hotspotIndex = sceneHotspots.findIndex(h => h.id === hotspotId)
            if (hotspotIndex >= 0) {
                sceneHotspots[hotspotIndex].images = images
                allHotspots[sceneId] = sceneHotspots
                localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(allHotspots))
            }
            
            window.dispatchEvent(new CustomEvent('hotspotsChanged', { 
                detail: { sceneId, hotspotId, images } 
            }))
            return true
        }
        throw new Error('API update failed')
    } catch (error) {
        console.warn('API unavailable for image update:', error.message)
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
            // Update local cache
            const allHotspots = getAllHotspotsSync()
            const sceneHotspots = allHotspots[sceneId] || []
            const hotspotIndex = sceneHotspots.findIndex(h => h.id === hotspotId)
            if (hotspotIndex >= 0) {
                sceneHotspots[hotspotIndex].images.splice(imageIndex, 1)
                allHotspots[sceneId] = sceneHotspots
                localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(allHotspots))
            }
            
            window.dispatchEvent(new CustomEvent('hotspotsChanged', { 
                detail: { sceneId, hotspotId, imageIndex, deleted: true } 
            }))
            return true
        }
        throw new Error('API delete failed')
    } catch (error) {
        console.warn('API unavailable for image delete:', error.message)
        return false
    }
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
export const importHotspots = async (jsonData) => {
    try {
        const hotspots = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
        
        // Try to save each scene to API
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
            localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(defaultHotspots))
            window.dispatchEvent(new CustomEvent('hotspotsChanged', {
                detail: { reset: true }
            }))
            return true
        }
        throw new Error('API reset failed')
    } catch (error) {
        console.warn('API unavailable, resetting localStorage only:', error.message)
        localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(defaultHotspots))
        window.dispatchEvent(new CustomEvent('hotspotsChanged', {
            detail: { reset: true }
        }))
        return true
    }
}

/**
 * Delete all hotspots for a scene
 */
export const deleteSceneHotspots = (sceneId) => {
    return saveSceneHotspots(sceneId, [])
}
