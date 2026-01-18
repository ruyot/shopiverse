import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'

/**
 * PLYViewer Component
 * 
 * Renders Gaussian Splat PLY files using @mkkellogg/gaussian-splats-3d
 * This is required because standard PLY loaders cannot render splats correctly.
 */
export function PLYViewer({ plyPath, isActive, hotspots = [], onHotspotClick }) {
    const containerRef = useRef(null)
    const viewerRef = useRef(null)
    const [progress, setProgress] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)
    const [showContent, setShowContent] = useState(false) // Delayed visibility for arrows/hotspots
    const keysPressed = useRef(new Set())

    useEffect(() => {
        if (!containerRef.current || !plyPath) return

        setIsLoaded(false)
        setProgress(0)
        setShowContent(false) // Hide content when loading new scene

        // Dispose previous viewer if exists
        if (viewerRef.current) {
            viewerRef.current.dispose()
            viewerRef.current = null
        }

        // Initialize Gaussian Splat Viewer
        const viewer = new GaussianSplats3D.Viewer({
            'rootElement': containerRef.current,
            'cameraUp': [0, 1, 0],
            'initialCameraPosition': [0, 0, -0.8], // Start deeper inside (past pillars)
            'initialCameraLookAt': [0, 0, -1], // Look further ahead
            'halfPrecisionCovariancesOnGPU': true,
            'antialiased': true,
            'alphaRemovalThreshold': 2,
        })

        // Restrict rotation to keep user focused on the scene and avoid black voids
        if (viewer.controls) {
            // Horizontal rotation (Azimuth): Limit to +/- 20 degrees
            viewer.controls.minAzimuthAngle = -Math.PI / 9
            viewer.controls.maxAzimuthAngle = Math.PI / 9

            // Vertical rotation (Polar): Limit to middle band (80 to 100 degrees - roughly +/- 10 degrees from horizontal)
            // 90 deg = Math.PI / 2
            // 20 deg = Math.PI / 9
            viewer.controls.minPolarAngle = (Math.PI / 2) - (Math.PI / 9)
            viewer.controls.maxPolarAngle = (Math.PI / 2) + (Math.PI / 9)

            // Smooth out the controls
            viewer.controls.enableDamping = true
            viewer.controls.dampingFactor = 0.05
        }

        viewerRef.current = viewer

        // Load the main splat file first
        // Rotation: quaternion [x, y, z, w]
        // [1, 0, 0, 0] = 180 deg X rotation
        // [0, 0, 1, 0] = 180 deg Z rotation
        const loadMain = viewer.addSplatScene(plyPath, {
            'showLoadingUI': false,
            'position': [0, 0, 0],
            'rotation': [1, 0, 0, 0], // Flip 180 around X
            'scale': [2.5, 2.5, 2.5], // Scale up world to feel "inside" it
            'splatAlphaRemovalThreshold': 5 // Hide very transparent splats
        })
            .then(() => {
                console.log('Splat loaded successfully')
                setIsLoaded(true)
                viewer.start()
                
                // Delay showing arrows/hotspots to match splat loading feel
                setTimeout(() => {
                    setShowContent(true)
                }, 800) // 800ms delay after splat loads

                // WASD keyboard controls (SHARP-ML pattern)
                const animate = () => {
                    if (!viewerRef.current) return
                    requestAnimationFrame(animate)

                    const keys = keysPressed.current
                    const moveSpeed = 0.05

                    if (keys.size > 0 && viewer.camera) {
                        const camera = viewer.camera
                        const controls = viewer.controls

                        // Get camera's forward and right vectors
                        const forward = new THREE.Vector3()
                        camera.getWorldDirection(forward)
                        const right = new THREE.Vector3()
                        right.crossVectors(forward, camera.up).normalize()

                        // W/S - move forward/backward
                        if (keys.has('w')) {
                            camera.position.addScaledVector(forward, moveSpeed)
                            if (controls?.target) {
                                controls.target.addScaledVector(forward, moveSpeed)
                            }
                        }
                        if (keys.has('s')) {
                            camera.position.addScaledVector(forward, -moveSpeed)
                            if (controls?.target) {
                                controls.target.addScaledVector(forward, -moveSpeed)
                            }
                        }

                        // A/D - strafe left/right
                        if (keys.has('a')) {
                            camera.position.addScaledVector(right, -moveSpeed)
                            if (controls?.target) {
                                controls.target.addScaledVector(right, -moveSpeed)
                            }
                        }
                        if (keys.has('d')) {
                            camera.position.addScaledVector(right, moveSpeed)
                            if (controls?.target) {
                                controls.target.addScaledVector(right, moveSpeed)
                            }
                        }

                        // Q/E - move up/down
                        // User requested: Q = up, E = down
                        if (keys.has('q')) {
                            camera.position.y += moveSpeed
                            if (controls?.target) {
                                controls.target.y += moveSpeed
                            }
                        }
                        if (keys.has('e')) {
                            camera.position.y -= moveSpeed
                            if (controls?.target) {
                                controls.target.y -= moveSpeed
                            }
                        }
                    }
                }
                animate()
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

    // WASD keyboard controls (SHARP-ML pattern)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle WASD when not typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }
            const key = e.key.toLowerCase()
            if (['w', 'a', 's', 'd', 'q', 'e'].includes(key)) {
                keysPressed.current.add(key)
            }

            // Debug: Log camera position on 'P'
            if (key === 'p' && viewerRef.current) {
                const cam = viewerRef.current.camera
                console.log(`📸 Camera Position: [${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)}]`)
            }
        }

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase()
            keysPressed.current.delete(key)
        }

        // Clear keys when window loses focus
        const handleBlur = () => {
            keysPressed.current.clear()
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('blur', handleBlur)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('blur', handleBlur)
        }
    }, [])

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
                background: '#000',
                overflow: 'hidden' // Ensure hotspots don't spill out
            }}
        >
            {/* 3D Hotspots */}
            {isActive && hotspots.map(hotspot => {
                if (!hotspot.position) return null
                return (
                    <button
                        key={hotspot.id}
                        ref={el => hotspotRefs.current[hotspot.id] = el}
                        className="product-hotspot"
                        onClick={() => onHotspotClick && onHotspotClick(hotspot)}
                        aria-label={hotspot.label}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            // transform set by animation loop
                            willChange: 'transform',
                            zIndex: 10 // Above viewer canvas
                        }}
                    >
                        <span className="hotspot-ring" />
                        <span className="hotspot-core" />
                    </button>
                )
            })}

            {/* Admin Icon - Top Left */}
            {isActive && (
                <a
                    href="/admin.html"
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        left: '1.5rem',
                        width: '48px',
                        height: '48px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textDecoration: 'none',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.2s ease',
                        zIndex: 100,
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title="Admin Panel"
                >
                    {/* Admin/Settings Icon SVG */}
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M19.78 4.22l-4.24 4.24M9.46 14.54l-4.24 4.24" />
                    </svg>
                </a>
            )}

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
