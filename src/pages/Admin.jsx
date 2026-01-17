import { useState, useEffect } from 'react'
import { BarChart3, Palette, Zap, Gamepad2, Camera, RefreshCw, Settings, Terminal, X, ChevronDown, ChevronRight } from 'lucide-react'
import { getSettings, updateSettings } from '../config/settings'
import { navigationConfig } from '../config/navigation'
import { getSceneHotspots, saveSceneHotspots } from '../config/hotspots'
import { HotspotEditor } from '../components/HotspotEditor'
import './Admin.css'

/**
 * Admin Page
 * Control panel for managing the 3D store experience
 */
export default function Admin() {
    const [activeTab, setActiveTab] = useState('overview')
    const [showCommands, setShowCommands] = useState(false)

    return (
        <div className="admin-page">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-content">
                    <h1>Shopiverse Admin</h1>
                    <a href="/" className="back-to-store">
                        ← Back to Store
                    </a>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="admin-nav">
                <button 
                    className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'scenes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scenes')}
                >
                    3D Scenes
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </nav>

            {/* Content Area */}
            <main className="admin-content">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'scenes' && <ScenesTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </main>

            {/* Command Palette Toggle */}
            <button 
                className="command-toggle"
                onClick={() => setShowCommands(!showCommands)}
                title="Show Commands"
            >
                <Terminal size={20} strokeWidth={2} />
            </button>

            {/* Command Palette */}
            {showCommands && (
                <div className="command-palette">
                    <div className="command-header">
                        <h3>SYSTEM COMMANDS</h3>
                        <button 
                            className="command-close"
                            onClick={() => setShowCommands(false)}
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>
                    <div className="command-list">
                        <div className="command-section">
                            <div className="command-section-title">NAVIGATION</div>
                            <div className="command-item">
                                <span className="command-key">W</span>
                                <span className="command-desc">Move Forward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">A</span>
                                <span className="command-desc">Move Left</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">S</span>
                                <span className="command-desc">Move Backward</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">D</span>
                                <span className="command-desc">Move Right</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">MOUSE</span>
                                <span className="command-desc">Look Around</span>
                            </div>
                        </div>
                        <div className="command-section">
                            <div className="command-section-title">SHORTCUTS</div>
                            <div className="command-item">
                                <span className="command-key">ESC</span>
                                <span className="command-desc">Exit Store View</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">SPACE</span>
                                <span className="command-desc">Interact</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">TAB</span>
                                <span className="command-desc">Toggle UI</span>
                            </div>
                        </div>
                        <div className="command-section">
                            <div className="command-section-title">ADMIN</div>
                            <div className="command-item">
                                <span className="command-key">CTRL+R</span>
                                <span className="command-desc">Refresh Scenes</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">CTRL+N</span>
                                <span className="command-desc">New Scene</span>
                            </div>
                            <div className="command-item">
                                <span className="command-key">CTRL+S</span>
                                <span className="command-desc">Save Settings</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function OverviewTab() {
    return (
        <div className="admin-tab-content">
            <h2>Store Overview</h2>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><BarChart3 size={32} strokeWidth={2} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Total Scenes</div>
                        <div className="stat-value">7</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon"><Palette size={32} strokeWidth={2} /></div>
                    <div className="stat-info">
                        <div className="stat-label">3D Models</div>
                        <div className="stat-value">Active</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon"><Zap size={32} strokeWidth={2} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Performance</div>
                        <div className="stat-value">Optimal</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon"><Gamepad2 size={32} strokeWidth={2} /></div>
                    <div className="stat-info">
                        <div className="stat-label">Controls</div>
                        <div className="stat-value">WASD + Mouse</div>
                    </div>
                </div>
            </div>

            <div className="info-section">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                    <button className="action-btn">
                        <Camera size={16} strokeWidth={2} /> Generate New Scene
                    </button>
                    <button className="action-btn">
                        <RefreshCw size={16} strokeWidth={2} /> Refresh All Scenes
                    </button>
                    <button className="action-btn">
                        <Settings size={16} strokeWidth={2} /> Configure Settings
                    </button>
                </div>
            </div>
        </div>
    )
}

function ScenesTab() {
    const [settings, setSettings] = useState(() => getSettings())
    const [expandedScenes, setExpandedScenes] = useState({})
    const [editingScene, setEditingScene] = useState(null)
    const [sceneHotspots, setSceneHotspots] = useState({})

    const scenes = Object.values(navigationConfig)

    // Load hotspots from storage on mount
    useEffect(() => {
        const hotspots = {}
        scenes.forEach(scene => {
            hotspots[scene.id] = getSceneHotspots(scene.id)
        })
        setSceneHotspots(hotspots)
    }, [])

    // Listen for hotspot changes
    useEffect(() => {
        const handleHotspotsChange = () => {
            const hotspots = {}
            scenes.forEach(scene => {
                hotspots[scene.id] = getSceneHotspots(scene.id)
            })
            setSceneHotspots(hotspots)
        }

        window.addEventListener('hotspotsChanged', handleHotspotsChange)
        return () => window.removeEventListener('hotspotsChanged', handleHotspotsChange)
    }, [scenes])

    const toggleScene = (sceneId) => {
        setExpandedScenes(prev => ({
            ...prev,
            [sceneId]: !prev[sceneId]
        }))
    }

    const toggleHotspot = (hotspotId) => {
        const disabledHotspots = { ...settings.disabledHotspots }
        if (disabledHotspots[hotspotId]) {
            delete disabledHotspots[hotspotId]
        } else {
            disabledHotspots[hotspotId] = true
        }
        const updated = updateSettings({ disabledHotspots })
        setSettings(updated)
    }

    const handleEditScene = (scene) => {
        setEditingScene(scene)
    }

    const handleSaveHotspots = (hotspots) => {
        // Save to hotspot storage
        const success = saveSceneHotspots(editingScene.id, hotspots)
        
        if (success) {
            console.log('Hotspots saved successfully')
            // Update local state
            setSceneHotspots(prev => ({
                ...prev,
                [editingScene.id]: hotspots
            }))
        } else {
            console.error('Failed to save hotspots')
        }
        
        setEditingScene(null)
    }

    const handleCloseEditor = () => {
        setEditingScene(null)
    }

    return (
        <div className="admin-tab-content">
            <h2>3D Scene Management</h2>
            
            <div className="scenes-list">
                {scenes.map(scene => {
                    const hotspots = sceneHotspots[scene.id] || []
                    const hasHotspots = hotspots.length > 0
                    const isExpanded = expandedScenes[scene.id]
                    
                    // Create scene object with hotspots for editor
                    const sceneWithHotspots = { ...scene, hotspots }
                    
                    return (
                        <div key={scene.id} className="scene-item-wrapper">
                            <div className="scene-item">
                                <div className="scene-info">
                                    <div className="scene-name">{scene.name}</div>
                                    <div className="scene-id">{scene.id}</div>
                                    {hasHotspots && (
                                        <div className="scene-hotspot-count">
                                            {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                <div className="scene-status">
                                    <span className="status-badge active">Active</span>
                                </div>
                                <div className="scene-actions">
                                    {hasHotspots && (
                                        <button 
                                            className="scene-btn"
                                            onClick={() => toggleScene(scene.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown size={14} strokeWidth={2} />
                                            ) : (
                                                <ChevronRight size={14} strokeWidth={2} />
                                            )}
                                            Hotspots
                                        </button>
                                    )}
                                    <button 
                                        className="scene-btn"
                                        onClick={() => handleEditScene(sceneWithHotspots)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                            
                            {hasHotspots && isExpanded && (
                                <div className="hotspots-dropdown">
                                    <div className="hotspots-header">Product Hotspots</div>
                                    {hotspots.map(hotspot => (
                                        <div key={hotspot.id} className="hotspot-item">
                                            <label className="hotspot-label">
                                                <input
                                                    type="checkbox"
                                                    checked={!settings.disabledHotspots[hotspot.id]}
                                                    onChange={() => toggleHotspot(hotspot.id)}
                                                />
                                                <span className="hotspot-info">
                                                    <span className="hotspot-name">{hotspot.label}</span>
                                                    <span className="hotspot-id">{hotspot.id}</span>
                                                    <span className="hotspot-coords">({hotspot.x}%, {hotspot.y}%)</span>
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {editingScene && (
                <HotspotEditor
                    scene={editingScene}
                    onSave={handleSaveHotspots}
                    onClose={handleCloseEditor}
                />
            )}
        </div>
    )
}

function SettingsTab() {
    const [settings, setSettings] = useState(() => getSettings())

    const handleToggle = (key) => {
        const updated = updateSettings({ [key]: !settings[key] })
        setSettings(updated)
    }

    return (
        <div className="admin-tab-content">
            <h2>Settings</h2>
            
            <div className="settings-section">
                <h3>Display</h3>
                <div className="setting-item">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={settings.showHotspots}
                            onChange={() => handleToggle('showHotspots')}
                        />
                        Show Product Hotspots
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={settings.showNavigation}
                            onChange={() => handleToggle('showNavigation')}
                        />
                        Show Navigation Arrows
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h3>Rendering</h3>
                <div className="setting-item">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={settings.enableAntialiasing}
                            onChange={() => handleToggle('enableAntialiasing')}
                        />
                        Enable Anti-aliasing
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={settings.progressiveLoading}
                            onChange={() => handleToggle('progressiveLoading')}
                        />
                        Progressive Loading
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h3>Controls</h3>
                <div className="setting-item">
                    <label>
                        Movement Speed
                        <input type="range" min="0.01" max="0.1" step="0.01" defaultValue="0.05" />
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        Rotation Speed
                        <input type="range" min="0.01" max="0.05" step="0.01" defaultValue="0.02" />
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h3>Camera</h3>
                <div className="setting-item">
                    <label>
                        Initial Position Z
                        <input type="number" step="0.1" defaultValue="1" />
                    </label>
                </div>
            </div>
        </div>
    )
}
