import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './NavigationArrows.css'

export function NavigationArrows() {
    const { currentPivotId, navigateTo, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    if (!currentPivot || isTransitioning) return null

    return (
        <group>
            {currentPivot.connections.map((connection) => (
                <StreetViewArrow
                    key={connection.target}
                    connection={connection}
                    onNavigate={() => navigateTo(connection.target)}
                />
            ))}
        </group>
    )
}

/**
 * Google Street View style arrow
 * Flat chevron on the ground that points in the direction of movement
 */
function StreetViewArrow({ connection, onNavigate }) {
    const groupRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Subtle pulsing animation
    useFrame((state) => {
        if (groupRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
            groupRef.current.scale.setScalar(hovered ? 1.15 : pulse)
        }
    })

    // Get rotation based on direction
    const rotation = useMemo(() => {
        switch (connection.direction) {
            case 'forward': return [0, 0, 0]
            case 'back': return [0, Math.PI, 0]
            case 'left': return [0, Math.PI / 2, 0]
            case 'right': return [0, -Math.PI / 2, 0]
            default: return [0, 0, 0]
        }
    }, [connection.direction])

    // Create chevron shape (like Google Street View arrow)
    const chevronShape = useMemo(() => {
        const shape = new THREE.Shape()
        // Chevron pointing forward (negative Z)
        const w = 0.4  // width
        const h = 0.5  // height/length
        const t = 0.12 // thickness

        // Outer chevron
        shape.moveTo(0, -h)
        shape.lineTo(w, 0)
        shape.lineTo(0, h * 0.3)
        shape.lineTo(-w, 0)
        shape.closePath()

        return shape
    }, [])

    return (
        <group
            ref={groupRef}
            position={[connection.position.x, 0.02, connection.position.z]}
            rotation={[0, rotation[1], 0]}
        >
            {/* Main chevron - flat on ground */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation()
                    onNavigate()
                }}
                onPointerOver={(e) => {
                    e.stopPropagation()
                    setHovered(true)
                    document.body.style.cursor = 'pointer'
                }}
                onPointerOut={(e) => {
                    setHovered(false)
                    document.body.style.cursor = 'default'
                }}
            >
                <shapeGeometry args={[chevronShape]} />
                <meshBasicMaterial
                    color={hovered ? '#ffffff' : '#e0e0e0'}
                    transparent
                    opacity={hovered ? 1 : 0.85}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Glow effect underneath */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <circleGeometry args={[0.7, 32]} />
                <meshBasicMaterial
                    color={hovered ? '#6366f1' : '#4f46e5'}
                    transparent
                    opacity={hovered ? 0.4 : 0.2}
                />
            </mesh>

            {/* Direction label on hover */}
            {hovered && (
                <Html
                    position={[0, 0.8, -0.3]}
                    center
                    distanceFactor={8}
                    className="nav-arrow-label"
                >
                    <div className="nav-label-content">
                        <span className="nav-label-direction">{connection.label}</span>
                    </div>
                </Html>
            )}
        </group>
    )
}
