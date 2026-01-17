import { useMemo } from 'react'
import { useStoreState } from '../stores/useStoreState'
import storeConfig from '../data/store-config.json'

/**
 * Clean 3D environment placeholder
 * In production, this will be replaced with ML-SHARP 3D Gaussians from actual store photos
 * For now, just a simple empty space to visualize navigation
 */
export function StoreEnvironment() {
    const { currentPivotId } = useStoreState()

    const currentPivot = useMemo(() => {
        return storeConfig.pivotPoints.find(p => p.id === currentPivotId)
    }, [currentPivotId])

    return (
        <group>
            {/* Floor - simple grid pattern */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial
                    color="#1a1a1f"
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Grid lines on floor for spatial reference */}
            <gridHelper
                args={[40, 40, '#2a2a35', '#1f1f25']}
                position={[0, 0.01, -5]}
            />

            {/* Ambient environment - subtle fog/atmosphere */}
            <fog attach="fog" args={['#0a0a0f', 5, 30]} />

            {/* Simple horizon indicator */}
            <mesh position={[0, 8, -20]}>
                <planeGeometry args={[80, 16]} />
                <meshBasicMaterial
                    color="#12121a"
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    )
}
