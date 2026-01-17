import { useState, useEffect, useCallback } from 'react'
import { navigationConfig, initialViewpoint } from './config/navigation'
import './App.css'

/**
 * Shopiverse - Google Street View Style Store Navigation
 * 
 * Navigation System:
 * - Each viewpoint has connections to other viewpoints (forward, back, left, right)
 * - Arrows only appear for valid directions
 * - Browser history supports back navigation
 * - Keyboard arrows work for navigation
 */
function App() {
    const [currentId, setCurrentId] = useState(initialViewpoint)
    const [history, setHistory] = useState([initialViewpoint])
    const [isTransitioning, setIsTransitioning] = useState(false)

    const currentViewpoint = navigationConfig[currentId]
    const connections = currentViewpoint?.connections || {}

    // Navigate to a new viewpoint
    const navigateTo = useCallback((targetId) => {
        if (!targetId || isTransitioning) return

        setIsTransitioning(true)

        // Brief transition effect
        setTimeout(() => {
            setCurrentId(targetId)
            setHistory(prev => [...prev, targetId])
            setIsTransitioning(false)
        }, 200)
    }, [isTransitioning])

    // Go back to previous viewpoint
    const goBack = useCallback(() => {
        if (history.length > 1 && !isTransitioning) {
            setIsTransitioning(true)
            setTimeout(() => {
                const newHistory = history.slice(0, -1)
                setHistory(newHistory)
                setCurrentId(newHistory[newHistory.length - 1])
                setIsTransitioning(false)
            }, 200)
        }
    }, [history, isTransitioning])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    if (connections.forward) navigateTo(connections.forward)
                    break
                case 'ArrowDown':
                    if (connections.back) navigateTo(connections.back)
                    else goBack()
                    break
                case 'ArrowLeft':
                    if (connections.left) navigateTo(connections.left)
                    break
                case 'ArrowRight':
                    if (connections.right) navigateTo(connections.right)
                    break
                case 'Backspace':
                    e.preventDefault()
                    goBack()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [connections, navigateTo, goBack])

    return (
        <div className="app">
            {/* Background image */}
            <div
                className={`viewpoint-image ${isTransitioning ? 'fading' : ''}`}
                style={{ backgroundImage: `url(${currentViewpoint.image})` }}
            />

            {/* Location indicator */}
            <header className="location-header">
                <h1>{currentViewpoint.name}</h1>
            </header>

            {/* Navigation arrows */}
            <nav className="navigation-arrows">
                {connections.forward && (
                    <button
                        className="nav-arrow forward"
                        onClick={() => navigateTo(connections.forward)}
                        aria-label="Move forward"
                    >
                        <ArrowIcon direction="up" />
                    </button>
                )}

                {connections.left && (
                    <button
                        className="nav-arrow left"
                        onClick={() => navigateTo(connections.left)}
                        aria-label="Look left"
                    >
                        <ArrowIcon direction="left" />
                    </button>
                )}

                {connections.right && (
                    <button
                        className="nav-arrow right"
                        onClick={() => navigateTo(connections.right)}
                        aria-label="Look right"
                    >
                        <ArrowIcon direction="right" />
                    </button>
                )}

                {connections.back && (
                    <button
                        className="nav-arrow back"
                        onClick={() => navigateTo(connections.back)}
                        aria-label="Go back"
                    >
                        <ArrowIcon direction="down" />
                    </button>
                )}
            </nav>

            {/* Back button (browser history style) */}
            {history.length > 1 && (
                <button className="history-back" onClick={goBack}>
                    ← Back
                </button>
            )}

            {/* Keyboard hints */}
            <div className="keyboard-hints">
                Use arrow keys to navigate
            </div>
        </div>
    )
}

// Arrow icon component
function ArrowIcon({ direction }) {
    const rotations = {
        up: 0,
        right: 90,
        down: 180,
        left: 270
    }

    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ transform: `rotate(${rotations[direction]}deg)` }}
        >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
        </svg>
    )
}

export default App
