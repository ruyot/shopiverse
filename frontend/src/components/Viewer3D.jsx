import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import './Viewer3D.css'

function Viewer3D({ plyFiles = ['/test.ply', '/test.ply', '/test.ply'], title = '3D Gallery', onReset }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const initializingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  useEffect(() => {
    if (!containerRef.current || initializingRef.current) return

    initializingRef.current = true
    let disposed = false
    let animationFrameId

    const initViewer = async () => {
      try {
        setIsLoading(true)
        setLoadProgress(0)

        const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d')

        if (disposed || !containerRef.current) return

        const container = containerRef.current
        const width = container.clientWidth
        const height = container.clientHeight

        // Create renderer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        
        // Clear any existing canvas elements before appending
        const existingCanvas = container.querySelector('canvas')
        if (existingCanvas) {
          existingCanvas.remove()
        }
        
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Create camera - positioned inside the room to see all 3 walls
        const camera = new THREE.PerspectiveCamera(
          75,
          width / height,
          0.01,
          500,
        )
        camera.position.set(0, 0, -0.5)
        camera.up.set(0, -1, 0)
        camera.lookAt(0, 0, 0)

        // Create controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.rotateSpeed = 0.8
        controls.enableZoom = false
        controls.minDistance = 0
        controls.maxDistance = Infinity
        controls.enablePan = true
        controls.panSpeed = 0.8
        controls.screenSpacePanning = true
        controls.target.set(0, 0, 0)
        controls.minPolarAngle = 0.1
        controls.maxPolarAngle = Math.PI - 0.1
        controls.enabled = true
        controlsRef.current = controls

        // Custom wheel handler for flying through scene
        const handleWheel = (e) => {
          e.preventDefault()
          const dollySpeed = 0.002
          const delta = e.deltaY * dollySpeed

          const forward = new THREE.Vector3()
          camera.getWorldDirection(forward)

          camera.position.addScaledVector(forward, -delta)
          controls.target.addScaledVector(forward, -delta)
        }

        renderer.domElement.addEventListener('wheel', handleWheel, {
          passive: false,
        })

        // Create a Three.js scene for additional objects (corner markers)
        const scene = new THREE.Scene()
        
        // Add invisible 3D grid for positioning reference
        // This helps align objects but won't be visible in the final render
        const gridSize = 10
        const gridDivisions = 20
        
        // Floor grid (XZ plane)
        const floorGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222)
        floorGrid.position.y = -1.5
        floorGrid.material.transparent = true
        floorGrid.material.opacity = 0.2
        scene.add(floorGrid)
        
        // Vertical grid on XY plane (back wall reference)
        const backGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222)
        backGrid.rotation.x = Math.PI / 2
        backGrid.position.z = 2
        backGrid.material.transparent = true
        backGrid.material.opacity = 0.1
        scene.add(backGrid)
        
        // Vertical grid on YZ plane (side wall reference)
        const sideGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222)
        sideGrid.rotation.z = Math.PI / 2
        sideGrid.position.x = -2
        sideGrid.material.transparent = true
        sideGrid.material.opacity = 0.1
        scene.add(sideGrid)

        // Create Gaussian Splats viewer
        const viewer = new GaussianSplats3D.Viewer({
          renderer: renderer,
          camera: camera,
          selfDrivenMode: false,
          useBuiltInControls: false,
          sharedMemoryForWorkers: false,
          dynamicScene: true,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          antialiased: true,
          focalAdjustment: 1.0,
        })

        viewerRef.current = { viewer, camera, renderer, controls, scene }

        // Load multiple PLY files to form 3 walls of a square room
        // Position walls close together to create a boxed-in feeling
        // Typical Gaussian Splat width is ~2 units, so we position them at 1 unit from center
        const wallDistance = 1.5
        const positions = [
          [-wallDistance, 0, 0],  // Left wall
          [0, 0, wallDistance],   // Back wall
          [wallDistance, 0, 0]    // Right wall
        ]
        
        const rotations = [
          [0, -0.7071, 0, 0.7071],  // Left wall - rotate -90° around Y axis (quaternion)
          [0, 1, 0, 0],              // Back wall - rotate 180° around Y axis
          [0, 0.7071, 0, 0.7071]    // Right wall - rotate 90° around Y axis
        ]

        let totalLoaded = 0
        const totalFiles = plyFiles.length

        for (let i = 0; i < plyFiles.length; i++) {
          if (disposed) return
          
          const sceneIndex = await viewer.addSplatScene(plyFiles[i], {
            splatAlphaRemovalThreshold: 5,
            showLoadingUI: false,
            progressiveLoad: false,
            position: positions[i],
            rotation: rotations[i],
            scale: [1, 1, 1],
            onProgress: (progress) => {
              const fileProgress = (totalLoaded + progress / 100) / totalFiles
              setLoadProgress(Math.min(100, Math.round(fileProgress * 100)))
            },
          })
          
          // Get the scene info to check dimensions and add corner markers
          const scene = viewer.getSplatScene(sceneIndex)
          if (scene) {
            const bounds = scene.splatMesh.getBoundingBox()
            const size = new THREE.Vector3()
            bounds.getSize(size)
            const center = bounds.getCenter(new THREE.Vector3())
            
            console.log(`Scene ${i} dimensions:`, {
              width: size.x.toFixed(2),
              height: size.y.toFixed(2),
              depth: size.z.toFixed(2),
              center: center
            })
            
            // Add glowing blue corner markers
            const cornerGeometry = new THREE.SphereGeometry(0.05, 8, 8)
            const cornerMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x00ffff,
              emissive: 0x00ffff,
              emissiveIntensity: 2
            })
            
            // Create 8 corners of the bounding box
            const halfSize = size.clone().multiplyScalar(0.5)
            const corners = [
              new THREE.Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
              new THREE.Vector3(halfSize.x, -halfSize.y, -halfSize.z),
              new THREE.Vector3(-halfSize.x, halfSize.y, -halfSize.z),
              new THREE.Vector3(halfSize.x, halfSize.y, -halfSize.z),
              new THREE.Vector3(-halfSize.x, -halfSize.y, halfSize.z),
              new THREE.Vector3(halfSize.x, -halfSize.y, halfSize.z),
              new THREE.Vector3(-halfSize.x, halfSize.y, halfSize.z),
              new THREE.Vector3(halfSize.x, halfSize.y, halfSize.z)
            ]
            
            corners.forEach(cornerPos => {
              const cornerMesh = new THREE.Mesh(cornerGeometry, cornerMaterial)
              // Position relative to the splat's position and center
              const worldPos = cornerPos.clone().add(center).add(new THREE.Vector3(...positions[i]))
              cornerMesh.position.copy(worldPos)
              viewerRef.current.scene.add(cornerMesh)
            })
          }
          
          totalLoaded++
          
          // Small delay between loads to ensure completion
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (disposed) return

        setIsLoading(false)

        // Add teleport spheres (Google Maps style navigation)
        const teleportGeometry = new THREE.SphereGeometry(0.08, 16, 16)
        const teleportMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          emissive: 0xffffff,
          emissiveIntensity: 0.5
        })
        
        const teleportSpheres = []
        
        // Add sphere at center of each splat (3 spheres)
        positions.forEach((pos, i) => {
          const sphere = new THREE.Mesh(teleportGeometry, teleportMaterial)
          sphere.position.set(pos[0], 0, pos[2])
          // Teleport TO the sphere location, with a slight offset to look at the wall
          const lookAtTarget = new THREE.Vector3(pos[0], 0, pos[2]).add(
            new THREE.Vector3(...rotations[i]).normalize().multiplyScalar(0.5)
          )
          sphere.userData.teleportPosition = new THREE.Vector3(pos[0], 0, pos[2])
          sphere.userData.lookAtTarget = lookAtTarget
          sphere.userData.isTeleportSphere = true
          teleportSpheres.push(sphere)
          viewerRef.current.scene.add(sphere)
        })
        
        // Add sphere in the middle of the room (1 sphere)
        const centerSphere = new THREE.Mesh(teleportGeometry, teleportMaterial)
        centerSphere.position.set(0, 0, 0)
        centerSphere.userData.teleportPosition = new THREE.Vector3(0, 0, 0)
        centerSphere.userData.lookAtTarget = new THREE.Vector3(0, 0, 1.5)
        centerSphere.userData.isTeleportSphere = true
        teleportSpheres.push(centerSphere)
        viewerRef.current.scene.add(centerSphere)
        
        // Add click handler for teleportation
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        
        const handleClick = (event) => {
          const rect = renderer.domElement.getBoundingClientRect()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
          
          raycaster.setFromCamera(mouse, camera)
          const intersects = raycaster.intersectObjects(teleportSpheres)
          
          if (intersects.length > 0) {
            const clickedSphere = intersects[0].object
            if (clickedSphere.userData.isTeleportSphere) {
              const targetPos = clickedSphere.userData.teleportPosition
              // Calculate offset between current camera and controls target
              const currentOffset = new THREE.Vector3().subVectors(controls.target, camera.position)
              // Move camera to new position
              camera.position.copy(targetPos)
              // Maintain the same viewing direction by offsetting the target
              controls.target.copy(targetPos).add(currentOffset)
              controls.update()
            }
          }
        }
        
        renderer.domElement.addEventListener('click', handleClick)

        // Animation loop
        const animate = () => {
          if (disposed) return
          animationFrameId = requestAnimationFrame(animate)

          controls.update()
          
          // Render the scene with ground plane first
          renderer.autoClear = false
          renderer.clear()
          renderer.render(scene, camera)
          
          // Then render Gaussian Splats on top
          viewer.update()
          viewer.render()
        }
        animate()

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || disposed) return
          const newWidth = containerRef.current.clientWidth
          const newHeight = containerRef.current.clientHeight
          camera.aspect = newWidth / newHeight
          camera.updateProjectionMatrix()
          renderer.setSize(newWidth, newHeight)
        }

        window.addEventListener('resize', handleResize)

      } catch (err) {
        console.error('Error initializing viewer:', err)
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    initViewer()

    return () => {
      disposed = true
      initializingRef.current = false

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      if (viewerRef.current?.viewer?.dispose) {
        viewerRef.current.viewer.dispose()
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
      }

      if (controlsRef.current) {
        controlsRef.current.dispose()
      }

      viewerRef.current = null
      rendererRef.current = null
      controlsRef.current = null
    }
  }, [plyFiles])

  const handleDownload = () => {
    const filename = `gaussian_splat_${Date.now()}.ply`
    const a = document.createElement('a')
    a.href = '/test.ply'
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="viewer-container">
      <h2>{title}</h2>
      <div ref={containerRef} className="viewer-canvas">
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '8px' }}>Loading...</div>
            <div style={{ fontSize: '0.8rem' }}>{loadProgress}%</div>
          </div>
        )}
      </div>
      {onReset && (
        <div className="viewer-controls">
          <button onClick={onReset} className="btn-secondary">
            ← Upload New Image
          </button>
        </div>
      )}
    </div>
  )
}

export default Viewer3D
