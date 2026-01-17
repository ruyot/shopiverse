import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'

/**
 * PLYViewer Component
 * 
 * Renders a PLY 3D model using Three.js when a ply path is provided.
 * Falls back to showing nothing if no PLY is available (image is shown behind).
 */
export function PLYViewer({ plyPath, isActive }) {
    const containerRef = useRef(null)
    const sceneRef = useRef(null)
    const rendererRef = useRef(null)
    const cameraRef = useRef(null)
    const meshRef = useRef(null)

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current || !plyPath) return

        // Scene setup
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0f)
        sceneRef.current = scene

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.set(0, 1.6, 3)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 10, 7)
        scene.add(directionalLight)

        // Load PLY
        const loader = new PLYLoader()
        loader.load(
            plyPath,
            (geometry) => {
                geometry.computeVertexNormals()

                const material = new THREE.MeshStandardMaterial({
                    vertexColors: geometry.hasAttribute('color'),
                    side: THREE.DoubleSide
                })

                const mesh = new THREE.Mesh(geometry, material)
                mesh.rotation.x = -Math.PI / 2 // PLY files often need rotation
                scene.add(mesh)
                meshRef.current = mesh

                // Center the model
                geometry.computeBoundingBox()
                const center = new THREE.Vector3()
                geometry.boundingBox.getCenter(center)
                mesh.position.sub(center)
            },
            (progress) => {
                console.log('Loading PLY:', (progress.loaded / progress.total * 100).toFixed(0) + '%')
            },
            (error) => {
                console.error('Error loading PLY:', error)
            }
        )

        // Mouse controls for orbit
        let isDragging = false
        let prevX = 0, prevY = 0
        let rotY = 0, rotX = 0

        const onMouseDown = (e) => {
            isDragging = true
            prevX = e.clientX
            prevY = e.clientY
        }

        const onMouseMove = (e) => {
            if (!isDragging) return
            const dx = e.clientX - prevX
            const dy = e.clientY - prevY
            rotY += dx * 0.005
            rotX += dy * 0.005
            rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX))

            camera.position.x = 3 * Math.sin(rotY) * Math.cos(rotX)
            camera.position.y = 1.6 + 3 * Math.sin(rotX)
            camera.position.z = 3 * Math.cos(rotY) * Math.cos(rotX)
            camera.lookAt(0, 0, 0)

            prevX = e.clientX
            prevY = e.clientY
        }

        const onMouseUp = () => { isDragging = false }

        const onWheel = (e) => {
            const factor = 1 + e.deltaY * 0.001
            camera.position.multiplyScalar(factor)
            camera.position.clampLength(1, 20)
        }

        renderer.domElement.addEventListener('mousedown', onMouseDown)
        renderer.domElement.addEventListener('mousemove', onMouseMove)
        renderer.domElement.addEventListener('mouseup', onMouseUp)
        renderer.domElement.addEventListener('mouseleave', onMouseUp)
        renderer.domElement.addEventListener('wheel', onWheel)

        // Animation loop
        let animationId
        const animate = () => {
            animationId = requestAnimationFrame(animate)
            renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', handleResize)
            renderer.domElement.removeEventListener('mousedown', onMouseDown)
            renderer.domElement.removeEventListener('mousemove', onMouseMove)
            renderer.domElement.removeEventListener('mouseup', onMouseUp)
            renderer.domElement.removeEventListener('mouseleave', onMouseUp)
            renderer.domElement.removeEventListener('wheel', onWheel)

            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement)
            }
            renderer.dispose()
            if (meshRef.current) {
                meshRef.current.geometry.dispose()
                meshRef.current.material.dispose()
            }
        }
    }, [plyPath])

    // Don't render if no PLY path
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
                transition: 'opacity 0.3s ease'
            }}
        />
    )
}
