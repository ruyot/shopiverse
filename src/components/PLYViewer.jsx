import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { SplatMesh } from '@sparkjsdev/spark'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/**
 * PLYViewer Component
 * 
 * Renders Gaussian Splat PLY files using @sparkjsdev/spark
 * Integrates Three.js meshes with splats for proper hotspot rendering.
 */
export function PLYViewer({ plyPath, isActive, hotspots = [], onHotspotClick }) {
    const containerRef = useRef(null)
    const canvasContainerRef = useRef(null)
    const cameraRef = useRef(null)
    const controlsRef = useRef(null)
    const splatRef = useRef(null)
    const hotspotMeshesRef = useRef([])
    const animationIdRef = useRef(null)
    const rendererRef = useRef(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [showContent, setShowContent] = useState(false)
    const keysPressed = useRef(new Set())

    // Initialize Three.js scene
    useEffect(() => {
        if (!canvasContainerRef.current || !plyPath) return

        setIsLoaded(false)
        setShowContent(false)

        // Clean up previous scene
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
        }
        if (rendererRef.current) {
            rendererRef.current.dispose()
        }
        canvasContainerRef.current.innerHTML = ''
        if (splatRef.current) {
            splatRef.current.dispose?.()
            splatRef.current = null
        }

        // Create renderer with Spark-optimized settings
        const renderer = new THREE.WebGLRenderer({
            antialias: false, // Splats don't benefit from MSAA, adds overhead
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        })
        renderer.setSize(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight)
        // Limit pixel ratio - splats are dense enough without high DPI
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        canvasContainerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Create scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000000)

        // Create camera - more zoomed in view
        const camera = new THREE.PerspectiveCamera(
            40, // Even narrower FOV for more zoom
            canvasContainerRef.current.clientWidth / canvasContainerRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.set(0, 0, 0) // Even closer
        camera.up.set(0, 1, 0)
        cameraRef.current = camera

        // Create orbit controls with slower rotation
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.target.set(0, 0, -2)
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.rotateSpeed = 0.3 // Slower cursor rotation (default: 1.0)
        controls.minAzimuthAngle = -Math.PI / 9
        controls.maxAzimuthAngle = Math.PI / 9
        controls.minPolarAngle = (Math.PI / 2) - (Math.PI / 9)
        controls.maxPolarAngle = (Math.PI / 2) + (Math.PI / 9)
        controlsRef.current = controls

        // Add hotspot spheres - small white orbs
        const hotspotMeshes = []
        if (hotspots && hotspots.length > 0) {
            const sphereGeometry = new THREE.SphereGeometry(0.06, 12, 12) // Larger orbs
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff, // White
                transparent: true,
                opacity: 0.9
            })

            hotspots.forEach(hotspot => {
                if (!hotspot.position) return

                const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial.clone())
                mesh.position.set(...hotspot.position)
                mesh.userData = { hotspot }

                scene.add(mesh)
                hotspotMeshes.push(mesh)
            })
        }
        hotspotMeshesRef.current = hotspotMeshes

        // Load splat using Spark with performance optimizations
        const splat = new SplatMesh({
            url: plyPath,
            maxStdDev: Math.sqrt(5) // Reduce Gaussian extent for better perf (default: sqrt(8))
        })
        splat.quaternion.set(1, 0, 0, 0) // 180 deg X rotation
        splat.scale.set(2.5, 2.5, 2.5)
        scene.add(splat)
        splatRef.current = splat

        // Fade-in animation on load
        splat.addEventListener('load', () => {
            // Try to apply fade-in if material supports it
            if (splat.material && typeof splat.material.opacity !== 'undefined') {
                splat.material.transparent = true
                splat.material.opacity = 0

                let opacity = 0
                const fadeIn = () => {
                    opacity += 0.03
                    splat.material.opacity = Math.min(opacity, 1)
                    if (opacity < 1) {
                        requestAnimationFrame(fadeIn)
                    } else {
                        splat.material.transparent = false
                    }
                }
                fadeIn()
            }

            setIsLoaded(true)
            setTimeout(() => setShowContent(true), 200)
        })

        // Raycaster for hotspot clicks
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const handleClick = (event) => {
            if (hotspotMeshes.length === 0) return

            const rect = containerRef.current.getBoundingClientRect()
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(hotspotMeshes)

            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object
                const clickedHotspot = clickedMesh.userData.hotspot
                
                // Calculate 2D screen position from 3D world position
                const worldPos = clickedMesh.position.clone()
                const screenPos = worldPos.project(camera)
                
                // Convert from normalized device coordinates (-1 to 1) to screen pixels
                const x = ((screenPos.x + 1) / 2) * rect.width
                const y = ((-screenPos.y + 1) / 2) * rect.height
                
                if (onHotspotClick) {
                    // Add screen position to hotspot data
                    onHotspotClick({ ...clickedHotspot, x, y })
                }
            }
        }
        renderer.domElement.addEventListener('click', handleClick)

        // Handle window resize
        const handleResize = () => {
            if (!canvasContainerRef.current) return
            const width = canvasContainerRef.current.clientWidth
            const height = canvasContainerRef.current.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }
        window.addEventListener('resize', handleResize)

        // Animation loop with WASD controls
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate)

            const keys = keysPressed.current
            const moveSpeed = 0.03 // Slower, more controlled movement

            if (keys.size > 0) {
                // Get camera's forward and right vectors
                const forward = new THREE.Vector3()
                camera.getWorldDirection(forward)
                const right = new THREE.Vector3()
                right.crossVectors(forward, camera.up).normalize()

                // W/S - move forward/backward
                if (keys.has('w')) {
                    camera.position.addScaledVector(forward, moveSpeed)
                    controls.target.addScaledVector(forward, moveSpeed)
                }
                if (keys.has('s')) {
                    camera.position.addScaledVector(forward, -moveSpeed)
                    controls.target.addScaledVector(forward, -moveSpeed)
                }

                // A/D - strafe left/right
                if (keys.has('a')) {
                    camera.position.addScaledVector(right, -moveSpeed)
                    controls.target.addScaledVector(right, -moveSpeed)
                }
                if (keys.has('d')) {
                    camera.position.addScaledVector(right, moveSpeed)
                    controls.target.addScaledVector(right, moveSpeed)
                }

                // Q/E - move up/down
                if (keys.has('q')) {
                    camera.position.y += moveSpeed
                    controls.target.y += moveSpeed
                }
                if (keys.has('e')) {
                    camera.position.y -= moveSpeed
                    controls.target.y -= moveSpeed
                }
            }

            // Pulsating effect for hotspot orbs
            const time = Date.now() * 0.003
            hotspotMeshes.forEach((mesh, index) => {
                // Offset each orb's pulse slightly for variety
                const pulse = Math.sin(time + index * 0.5) * 0.3 + 1 // Oscillates between 0.7 and 1.3
                mesh.scale.setScalar(pulse)
                // Also pulse opacity slightly
                if (mesh.material) {
                    mesh.material.opacity = 0.7 + Math.sin(time + index * 0.5) * 0.3 // 0.4 to 1.0
                }
            })

            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Cleanup
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            renderer.domElement.removeEventListener('click', handleClick)
            window.removeEventListener('resize', handleResize)
            if (splatRef.current) {
                splatRef.current.dispose?.()
            }
            controls.dispose()
            renderer.dispose()
        }

    }, [plyPath, hotspots, onHotspotClick])

    // WASD keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }
            const key = e.key.toLowerCase()
            if (['w', 'a', 's', 'd', 'q', 'e'].includes(key)) {
                keysPressed.current.add(key)
            }

            // Debug: Log camera position and target on 'P'
            if (key === 'p' && cameraRef.current && controlsRef.current) {
                const cam = cameraRef.current
                const target = controlsRef.current.target
                console.log(`📸 Camera Position: [${cam.position.x.toFixed(5)}, ${cam.position.y.toFixed(5)}, ${cam.position.z.toFixed(5)}]`)
                console.log(`🎯 Looking At: [${target.x.toFixed(5)}, ${target.y.toFixed(5)}, ${target.z.toFixed(5)}]`)
            }
        }

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase()
            keysPressed.current.delete(key)
        }

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
                overflow: 'hidden'
            }}
        >
            {/* Canvas container - separate so innerHTML clear doesn't affect UI */}
            <div
                ref={canvasContainerRef}
                style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            />
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
