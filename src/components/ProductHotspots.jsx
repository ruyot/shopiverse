import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'
import './ProductHotspots.css'

export function ProductHotspots() {
    const { currentPivotId, setSelectedProduct, isTransitioning } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    if (!currentPivot || isTransitioning) return null

    return (
        <group>
            {currentPivot.hotspots.map((hotspot) => {
                const product = storeConfig.products.find(p => p.id === hotspot.productId)
                if (!product) return null

                return (
                    <ProductHotspot
                        key={hotspot.id}
                        hotspot={hotspot}
                        product={product}
                        onSelect={() => setSelectedProduct(product)}
                    />
                )
            })}
        </group>
    )
}

function ProductHotspot({ hotspot, product, onSelect }) {
    const groupRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Pulsing animation
    useFrame((state) => {
        if (groupRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
            groupRef.current.scale.setScalar(hovered ? 1.2 : pulse)
        }
    })

    return (
        <group
            ref={groupRef}
            position={[hotspot.position.x, hotspot.position.y, hotspot.position.z]}
        >
            {/* Hotspot marker */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial
                    color={hovered ? '#f59e0b' : '#fbbf24'}
                    emissive={hovered ? '#f59e0b' : '#fbbf24'}
                    emissiveIntensity={hovered ? 1 : 0.6}
                />
            </mesh>

            {/* Outer ring */}
            <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.2, 0.02, 8, 32]} />
                <meshBasicMaterial
                    color="#fbbf24"
                    transparent
                    opacity={hovered ? 0.8 : 0.4}
                />
            </mesh>

            {/* Label */}
            <Html
                position={[0, 0.4, 0]}
                center
                distanceFactor={8}
                className="hotspot-label"
                style={{ pointerEvents: 'none' }}
            >
                <div className={`hotspot-content ${hovered ? 'expanded' : ''}`}>
                    <span className="hotspot-name">{product.name}</span>
                    {hovered && (
                        <span className="hotspot-price">
                            ${product.price.toFixed(2)}
                        </span>
                    )}
                </div>
            </Html>
        </group>
    )
}
