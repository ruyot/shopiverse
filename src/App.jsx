import { useStoreState } from './stores/useStoreState'
import { PlayCanvasViewer } from './components/PlayCanvasViewer'
import { NavigationOverlay } from './components/NavigationOverlay'
import { NavigationUI } from './components/NavigationUI'

function App() {
    return (
        <div className="app">
            {/* PlayCanvas Model Viewer - supports Gaussian Splats */}
            <PlayCanvasViewer />

            {/* Navigation arrows overlaid on top */}
            <NavigationOverlay />

            {/* UI elements (header, location, minimap) */}
            <NavigationUI />
        </div>
    )
}

export default App
