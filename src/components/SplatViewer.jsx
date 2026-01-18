import { useEffect, useRef, useMemo, useState } from 'react'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './SplatViewer.css'

/**
 * Gaussian Splat Viewer
 * Renders .ply/.splat files using gaussian-splats-3d library
 */
export function SplatViewer() {
    const containerRef = useRef(null)
    const viewerRef = useRef(null)
    const [status, setStatus] = useState('initializing')

    const { currentPivotId, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    const splatPath = currentPivot?.gaussian

    useEffect(() => {
        if (!containerRef.current || !splatPath) {
            setStatus('no-file')
            return
        }

        setStatus('loading')

        // Cleanup previous
        if (viewerRef.current) {
            try {
                viewerRef.current.dispose()
            } catch (e) { }
            viewerRef.current = null
        }

        // Clear container
        containerRef.current.innerHTML = ''

        try {
            const viewer = new GaussianSplats3D.Viewer({
                cameraUp: [0, 1, 0],
                initialCameraPosition: [0, 2, 6],
                initialCameraLookAt: [0, 0, 0],
                rootElement: containerRef.current,
                selfDrivenMode: true,
                useBuiltInControls: true,
                dynamicScene: false,
                sharedMemoryForWorkers: false,
                antialiased: true,
                focalAdjustment: 1.0
            })

            viewerRef.current = viewer

            viewer.addSplatScene(splatPath)
                .then(() => {
                    setStatus('ready')
                    viewer.start()
                })
                .catch((err) => {
                    console.error('Splat load error:', err)
                    setStatus('error')
                })

        } catch (err) {
            console.error('Viewer error:', err)
            setStatus('error')
        }

        return () => {
            if (viewerRef.current) {
                try {
                    viewerRef.current.dispose()
                } catch (e) { }
                viewerRef.current = null
            }
        }
    }, [splatPath])

    return (
        <div className="splat-viewer">
            <div ref={containerRef} className="splat-container" />

            {status === 'loading' && (
                <div className="splat-status">
                    <div className="spinner" />
                    <p>Loading...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="splat-status error">
                    <p>Failed to load splat file</p>
                    <small>Check console for details</small>
                </div>
            )}

            {status === 'no-file' && (
                <div className="splat-status">
                    <p>{currentPivot?.name || 'No location'}</p>
                    <small>No splat file configured</small>
                </div>
            )}

            <div className={`splat-transition ${isTransitioning ? 'active' : ''}`} />
        </div>
    )
}
