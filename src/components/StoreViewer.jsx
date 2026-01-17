import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { useStoreState } from '../stores/useStoreState'
import { StoreEnvironment } from './StoreEnvironment'
import { NavigationArrows } from './NavigationArrows'
import { LoadingScreen } from './LoadingScreen'
import './StoreViewer.css'

export function StoreViewer() {
    const { isTransitioning } = useStoreState()

    return (
        <div className="store-viewer">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 1.6, 0]} fov={75} />

                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.3} />
                    <directionalLight
                        position={[5, 10, 5]}
                        intensity={0.5}
                    />

                    {/* Store environment (placeholder for Gaussian images) */}
                    <StoreEnvironment />

                    {/* Navigation arrows - Street View style */}
                    <NavigationArrows />
                </Suspense>

                {/* Camera controls - look around freely */}
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={0.1}
                    maxDistance={2}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 1.2}
                    rotateSpeed={0.4}
                    target={[0, 1, -3]}
                />
            </Canvas>

            {/* Transition overlay */}
            <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`} />

            {/* Loading indicator */}
            <LoadingScreen />
        </div>
    )
}
