import { useStoreState } from './stores/useStoreState'
import { StoreViewer } from './components/StoreViewer'
import { NavigationUI } from './components/NavigationUI'

function App() {
    return (
        <div className="app">
            <StoreViewer />
            <NavigationUI />
        </div>
    )
}

export default App
