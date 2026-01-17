import { create } from 'zustand'

export const useStoreState = create((set, get) => ({
    // Current location in the store
    currentPivotId: 'entrance',

    // Selected product for modal
    selectedProduct: null,

    // Loading state for transitions
    isTransitioning: false,

    // Camera state
    cameraPosition: { x: 0, y: 1.6, z: 0 },
    cameraRotation: { yaw: 0, pitch: 0 },

    // Actions
    setCurrentPivot: (pivotId) => set({ currentPivotId: pivotId }),

    setSelectedProduct: (product) => set({ selectedProduct: product }),

    setTransitioning: (isTransitioning) => set({ isTransitioning }),

    setCameraPosition: (position) => set({ cameraPosition: position }),

    setCameraRotation: (rotation) => set({ cameraRotation: rotation }),

    // Navigate to a new pivot point
    navigateTo: async (targetPivotId) => {
        const { currentPivotId, setTransitioning, setCurrentPivot } = get()

        if (targetPivotId === currentPivotId) return

        setTransitioning(true)

        // Simulate transition delay
        await new Promise(resolve => setTimeout(resolve, 600))

        setCurrentPivot(targetPivotId)
        setTransitioning(false)
    }
}))
