import { useMemo } from 'react'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './PlayCanvasViewer.css'

/**
 * PlayCanvas Model Viewer embed
 * 
 * The PlayCanvas model-viewer supports:
 * - glTF/GLB models
 * - 3D Gaussian Splats (.ply files from ML-SHARP)
 * - Equirectangular images (360° panoramas as fallback)
 * 
 * URL parameters:
 * - ?load=URL - Load a 3D model or Gaussian splat
 * - ?cameraPosition=x,y,z - Set initial camera position
 */
export function PlayCanvasViewer() {
    const { currentPivotId, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    // Build the PlayCanvas viewer URL with current pivot's model/image
    const viewerUrl = useMemo(() => {
        const baseUrl = 'https://playcanvas.com/viewer'

        // If pivot has a gaussian splat file, load it
        if (currentPivot?.gaussian) {
            return `${baseUrl}?load=${encodeURIComponent(currentPivot.gaussian)}`
        }

        // If pivot has an image, we'll show a placeholder for now
        // In production, this would be a processed Gaussian splat
        return baseUrl
    }, [currentPivot])

    return (
        <div className="playcanvas-viewer">
            {/* Embed PlayCanvas model-viewer */}
            <iframe
                src={viewerUrl}
                title="3D Store View"
                className={`viewer-iframe ${isTransitioning ? 'transitioning' : ''}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />

            {/* Placeholder when no model is loaded */}
            {!currentPivot?.gaussian && (
                <div className="viewer-placeholder">
                    <div className="placeholder-content">
                        <div className="placeholder-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                <polyline points="3.27 6.96 12 12 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <h3>{currentPivot?.name || 'Store View'}</h3>
                        <p>Gaussian splat will be loaded here</p>
                        <span className="placeholder-hint">
                            Add .ply files from ML-SHARP to see 3D views
                        </span>
                    </div>
                </div>
            )}

            {/* Transition overlay */}
            <div className={`viewer-transition ${isTransitioning ? 'active' : ''}`} />
        </div>
    )
}
