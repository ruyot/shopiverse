import { useState, useEffect, useCallback } from 'react'
import { navigationConfig, initialViewpoint } from './config/navigation'
import { PLYViewer } from './components/PLYViewer'
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

    const currentViewpoint = navigationConfig[currentId]
    const connections = currentViewpoint?.connections || {}
    const isStoreFront = currentId === 'storeFront'
    const hasPLY = !!currentViewpoint?.ply

    // Navigate to a new viewpoint
    const navigateTo = useCallback((targetId) => {
        if (!targetId || isTransitioning) return

        setIsTransitioning(true)

        setTimeout(() => {
            setCurrentId(targetId)
            setHistory(prev => [...prev, targetId])
            setIsTransitioning(false)
        }, 200)
    }, [isTransitioning])

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
                case ' ':
                    if (connections.forward) navigateTo(connections.forward)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [connections, navigateTo])

    return (
        <div className="app">
            {/* 3D PLY Viewer (shown when PLY model is available) */}
            <PLYViewer plyPath={currentViewpoint.ply} isActive={hasPLY} />

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

            {/* Store front entrance - pulsating dot */}
            {isStoreFront && connections.forward && (
                <button
                    className="entrance-dot"
                    onClick={() => navigateTo(connections.forward)}
                    aria-label="Enter store"
                >
                    <span className="dot-ring" />
                    <span className="dot-core" />
                </button>
            )}

            {/* Ground-level navigation arrows (not shown on store front) */}
            {!isStoreFront && (
                <nav className="ground-nav">
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

            {/* Product hotspots */}
            {currentViewpoint.hotspots?.map((hotspot) => (
                <button
                    key={hotspot.id}
                    className="product-hotspot"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => console.log('Clicked:', hotspot.label)}
                    aria-label={hotspot.label}
                >
                    <span className="hotspot-ring" />
                    <span className="hotspot-core" />
                </button>
            ))}

            {/* Keyboard hints */}
            <div className="keyboard-hints">
                {isStoreFront ? 'Click the door to enter' : 'Use arrow keys to navigate'}
            </div>
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
