import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'

/**
 * PLYViewer Component
 * 
 * Renders Gaussian Splat PLY files using @mkkellogg/gaussian-splats-3d
 * This is required because standard PLY loaders cannot render splats correctly.
 */
export function PLYViewer({ plyPath, isActive }) {
    const containerRef = useRef(null)
    const viewerRef = useRef(null)
    const [progress, setProgress] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (!containerRef.current || !plyPath) return

        setIsLoaded(false)
        setProgress(0)

        // Dispose previous viewer if exists
        if (viewerRef.current) {
            viewerRef.current.dispose()
            viewerRef.current = null
        }

        // Initialize Gaussian Splat Viewer
        const viewer = new GaussianSplats3D.Viewer({
            'rootElement': containerRef.current,
            'cameraUp': [0, 1, 0],
            'initialCameraPosition': [0, 0, 1], // Start from the front (positive Z)
            'initialCameraLookAt': [0, 0, 0],
            'halfPrecisionCovariancesOnGPU': true,
            'antialiased': true,
            'alphaRemovalThreshold': 2,
        })

        viewerRef.current = viewer

        // Load the splat file
        // Rotation: quaternion [x, y, z, w]
        // [1, 0, 0, 0] = 180 deg X rotation
        // [0, 0, 1, 0] = 180 deg Z rotation
        viewer.addSplatScene(plyPath, {
            'showLoadingUI': false,
            'position': [0, 0, 0],
            'rotation': [1, 0, 0, 0], // Flip 180 around X
            'scale': [1, 1, 1],
            'splatAlphaRemovalThreshold': 5 // Hide very transparent splats
        })
            .then(() => {
                console.log('Splat loaded successfully')
                setIsLoaded(true)
                viewer.start()
            })
            .catch(err => {
                console.error('Failed to load splat:', err)
            })

        // Cleanup
        return () => {
            if (viewerRef.current) {
                viewerRef.current.dispose()
                viewerRef.current = null
            }
        }

    }, [plyPath])

    if (!plyPath) return null

    return (
        <div
            ref={containerRef}
            className="ply-viewer"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: isActive ? 5 : -1,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: isActive ? 'auto' : 'none',
                background: '#000'
            }}
        >
            {!isLoaded && isActive && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '1rem',
                    borderRadius: '8px',
                    pointerEvents: 'none'
                }}>
                    Loading 3D Scene...
                </div>
            )}
        </div>
    )
}
