import { useEffect, useRef, useMemo } from 'react'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './PlayCanvasViewer.css'

/**
 * PlayCanvas Gaussian Splat Viewer
 * Renders .ply Gaussian splat files using PlayCanvas engine
 */
export function PlayCanvasViewer() {
    const canvasRef = useRef(null)
    const appRef = useRef(null)
    const { currentPivotId, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    // Initialize PlayCanvas app
    useEffect(() => {
        if (!canvasRef.current || typeof pc === 'undefined') return

        // Create PlayCanvas application
        const app = new pc.Application(canvasRef.current, {
            mouse: new pc.Mouse(canvasRef.current),
            touch: new pc.TouchDevice(canvasRef.current),
            graphicsDeviceOptions: {
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: false,
                preferWebGl2: true
            }
        })

        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
        app.setCanvasResolution(pc.RESOLUTION_AUTO)

        // Configure scene
        app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2)
        app.scene.rendering.toneMapping = pc.TONEMAP_ACES
        app.scene.rendering.gammaCorrection = pc.GAMMA_SRGB

        // Create camera
        const camera = new pc.Entity('camera')
        camera.addComponent('camera', {
            clearColor: new pc.Color(0.05, 0.05, 0.08),
            fov: 75,
            nearClip: 0.1,
            farClip: 1000
        })
        camera.setPosition(0, 1.6, 3)
        camera.lookAt(0, 1, 0)
        app.root.addChild(camera)

        // Add orbit camera controls
        const script = camera.addComponent('script')

        // Simple orbit controls via mouse
        let isDragging = false
        let lastX = 0, lastY = 0
        let rotX = 0, rotY = 0

        canvasRef.current.addEventListener('mousedown', (e) => {
            isDragging = true
            lastX = e.clientX
            lastY = e.clientY
        })

        canvasRef.current.addEventListener('mousemove', (e) => {
            if (!isDragging) return
            const dx = e.clientX - lastX
            const dy = e.clientY - lastY
            rotY -= dx * 0.3
            rotX -= dy * 0.3
            rotX = Math.max(-60, Math.min(60, rotX))
            camera.setEulerAngles(rotX, rotY, 0)
            lastX = e.clientX
            lastY = e.clientY
        })

        canvasRef.current.addEventListener('mouseup', () => { isDragging = false })
        canvasRef.current.addEventListener('mouseleave', () => { isDragging = false })

        // Scroll to zoom
        canvasRef.current.addEventListener('wheel', (e) => {
            const pos = camera.getPosition()
            const forward = camera.forward.clone().mulScalar(e.deltaY * 0.01)
            camera.setPosition(pos.sub(forward))
        })

        // Add ambient light
        const light = new pc.Entity('light')
        light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1, 1, 1),
            intensity: 1
        })
        light.setEulerAngles(45, 45, 0)
        app.root.addChild(light)

        app.start()
        appRef.current = app

        // Handle resize
        const handleResize = () => {
            app.resizeCanvas()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            app.destroy()
        }
    }, [])

    // Load Gaussian splat when pivot changes
    useEffect(() => {
        if (!appRef.current || !currentPivot?.gaussian) return

        const app = appRef.current
        const plyPath = currentPivot.gaussian

        // Remove existing splat entity if any
        const existingSplat = app.root.findByName('splat')
        if (existingSplat) {
            existingSplat.destroy()
        }

        // Load the PLY file as a GSplat asset
        const asset = new pc.Asset('splat', 'gsplat', {
            url: plyPath
        })

        asset.on('load', () => {
            const splatEntity = new pc.Entity('splat')
            splatEntity.addComponent('gsplat', {
                asset: asset
            })
            splatEntity.setLocalScale(1, 1, 1)
            app.root.addChild(splatEntity)
            console.log('Gaussian splat loaded:', plyPath)
        })

        asset.on('error', (err) => {
            console.error('Failed to load Gaussian splat:', err)
        })

        app.assets.add(asset)
        app.assets.load(asset)

    }, [currentPivot])

    return (
        <div className="playcanvas-viewer">
            <canvas ref={canvasRef} className={`viewer-canvas ${isTransitioning ? 'transitioning' : ''}`} />

            {/* Loading indicator */}
            {isTransitioning && (
                <div className="viewer-loading">
                    <div className="loading-spinner" />
                </div>
            )}

            {/* Transition overlay */}
            <div className={`viewer-transition ${isTransitioning ? 'active' : ''}`} />
        </div>
    )
}
