import { useMemo } from 'react'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './NavigationOverlay.css'

/**
 * Navigation arrows overlaid on top of the viewer
 * Google Street View style - clickable arrows to move between pivot points
 */
export function NavigationOverlay() {
    const { currentPivotId, navigateTo, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    if (!currentPivot || isTransitioning) return null

    return (
        <div className="navigation-overlay">
            {currentPivot.connections.map((connection) => (
                <NavigationArrow
                    key={connection.target}
                    connection={connection}
                    onNavigate={() => navigateTo(connection.target)}
                />
            ))}
        </div>
    )
}

function NavigationArrow({ connection, onNavigate }) {
    // Position arrows based on direction
    const positionStyle = useMemo(() => {
        switch (connection.direction) {
            case 'forward':
                return { bottom: '15%', left: '50%', transform: 'translateX(-50%)' }
            case 'back':
                return { top: '20%', left: '50%', transform: 'translateX(-50%) rotate(180deg)' }
            case 'left':
                return { bottom: '30%', left: '15%', transform: 'rotate(-90deg)' }
            case 'right':
                return { bottom: '30%', right: '15%', transform: 'rotate(90deg)' }
            default:
                return { bottom: '15%', left: '50%', transform: 'translateX(-50%)' }
        }
    }, [connection.direction])

    return (
        <button
            className="nav-arrow"
            style={positionStyle}
            onClick={onNavigate}
            aria-label={connection.label}
        >
            <div className="arrow-glow" />
            <svg
                className="arrow-icon"
                viewBox="0 0 48 48"
                fill="none"
            >
                {/* Chevron shape like Google Street View */}
                <path
                    d="M24 8 L40 28 L24 20 L8 28 Z"
                    fill="currentColor"
                />
            </svg>
            <span className="arrow-label">{connection.label}</span>
        </button>
    )
}
