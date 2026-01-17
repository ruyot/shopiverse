/**
 * Navigation Configuration
 * 
 * Maps each viewpoint to its neighboring viewpoints by direction.
 * - forward: move deeper into the store
 * - back: return to previous viewpoint
 * - left: view left side
 * - right: view right side
 * 
 * Each viewpoint has:
 * - image: fallback 2D image
 * - ply: 3D Gaussian splat model (set to null to use image fallback)
 */
export const navigationConfig = {
    // Store entrance (outside)
    storeFront: {
        id: 'storeFront',
        name: 'Store Entrance',
        image: '/store_front.png',
        ply: '/store_front_gaussian.ply',
        connections: {
            forward: 'storeP1'
        }
    },

    // First position inside
    storeP1: {
        id: 'storeP1',
        name: 'Inside - Position 1',
        image: '/store_p1.png',
        ply: '/store_p1_gaussian.ply',
        connections: {
            back: 'storeFront',
            forward: 'storeP2'
        }
    },

    // Left view from first position
    storeP1Left: {
        id: 'storeP1Left',
        name: 'Position 1 - Left View',
        image: '/store_p1_left.png',
        ply: '/store_p1_left_gaussian.ply',
        connections: {
            back: 'storeP1'
        },
        hotspots: [
            { id: 'jeans-1', x: 38, y: 42, label: 'Classic Denim' },
            { id: 'jeans-2', x: 28, y: 42, label: 'Classic Denim' },
            { id: 'jeans-3', x: 28, y: 65, label: 'Classic Denim' },
            { id: 'jeans-4', x: 39, y: 64, label: 'Classic Denim' }
        ]
    },

    // Right view from first position
    storeP1Right: {
        id: 'storeP1Right',
        name: 'Position 1 - Right View',
        image: '/store_p1_right.png',
        ply: '/store_p1_right_gaussian.ply',
        connections: {
            back: 'storeP1'
        },
        hotspots: [
            { id: 'item-r1-1', x: 30, y: 35, label: 'Product 1' },
            { id: 'item-r1-2', x: 50, y: 45, label: 'Product 2' },
            { id: 'item-r1-3', x: 70, y: 40, label: 'Product 3' }
        ]
    },

    // Second position (deeper inside)
    storeP2: {
        id: 'storeP2',
        name: 'Inside - Position 2',
        image: '/store_p2.png',
        ply: '/store_p2_gaussian.ply',
        connections: {
            back: 'storeP1',
            left: 'storeP2Left',
            right: 'storeP2Right'
        }
    },

    // Left view from second position
    storeP2Left: {
        id: 'storeP2Left',
        name: 'Position 2 - Left View',
        image: '/store_p2_left.png',
        ply: '/store_p2_left_gaussian.ply',
        connections: {
            back: 'storeP2'
        },
        hotspots: [
            { id: 'item-l2-1', x: 21, y: 45, label: 'Product 1' },
            { id: 'item-l2-2', x: 30, y: 35, label: 'Product 2' },
            { id: 'item-l2-3', x: 80, y: 55, label: 'Product 3' }
        ]
    },

    // Right view from second position
    storeP2Right: {
        id: 'storeP2Right',
        name: 'Position 2 - Right View',
        image: '/store_p2_right.png',
        ply: '/store_p2_right_gaussian.ply',
        connections: {
            back: 'storeP2'
        },
        hotspots: [
            { id: 'item-r2-1', x: 39, y: 50, label: 'Product 1' },
            { id: 'item-r2-2', x: 57, y: 46, label: 'Product 2' },
            { id: 'item-r2-3', x: 68, y: 42, label: 'Product 3' }
        ]
    }
}

// Starting viewpoint
export const initialViewpoint = 'storeFront'
