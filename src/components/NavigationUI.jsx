import { useMemo } from 'react'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './NavigationUI.css'

export function NavigationUI() {
    const { currentPivotId } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    return (
        <div className="navigation-ui">
            {/* Store header */}
            <header className="store-header glass-panel">
                <div className="store-brand">
                    <svg className="store-logo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <div className="store-info">
                        <span className="store-name">{storeConfig.store.name}</span>
                        <span className="store-tagline">Virtual Experience</span>
                    </div>
                </div>
            </header>

            {/* Current location indicator */}
            <div className="location-indicator glass-panel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{currentPivot?.name || 'Store'}</span>
            </div>

            {/* Controls hint */}
            <div className="controls-hint glass-panel">
                <div className="hint-item">
                    <span className="hint-key">Drag</span>
                    <span>Look around</span>
                </div>
                <div className="hint-item">
                    <span className="hint-key">Click arrow</span>
                    <span>Move</span>
                </div>
            </div>

            {/* Minimap */}
            <div className="minimap glass-panel">
                <div className="minimap-title">Location</div>
                <div className="minimap-grid">
                    {storeConfig.pivotPoints.map((pivot) => (
                        <div
                            key={pivot.id}
                            className={`minimap-node ${pivot.id === currentPivotId ? 'active' : ''}`}
                            title={pivot.name}
                        >
                            {pivot.id === currentPivotId && (
                                <div className="minimap-pulse" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
