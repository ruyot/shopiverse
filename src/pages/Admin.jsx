import { useState } from 'react'
import { BarChart3, Palette, Zap, Gamepad2, Camera, RefreshCw, Settings, Terminal, X } from 'lucide-react'
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
    const scenes = [
        { id: 'storeFront', name: 'Store Entrance', status: 'Active' },
        { id: 'storeP1', name: 'Inside - Position 1', status: 'Active' },
        { id: 'storeP1Left', name: 'Inside - Left View', status: 'Active' },
        { id: 'storeP1Right', name: 'Inside - Right View', status: 'Active' },
        { id: 'storeP2', name: 'Inside - Position 2', status: 'Active' },
        { id: 'storeP2Left', name: 'Inside - Left View 2', status: 'Active' },
        { id: 'storeP2Right', name: 'Inside - Right View 2', status: 'Active' },
    ]

    return (
        <div className="admin-tab-content">
            <h2>3D Scene Management</h2>
            
            <div className="scenes-list">
                {scenes.map(scene => (
                    <div key={scene.id} className="scene-item">
                        <div className="scene-info">
                            <div className="scene-name">{scene.name}</div>
                            <div className="scene-id">{scene.id}</div>
                        </div>
                        <div className="scene-status">
                            <span className="status-badge active">{scene.status}</span>
                        </div>
                        <div className="scene-actions">
                            <button className="scene-btn">Edit</button>
                            <button className="scene-btn">Regenerate</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SettingsTab() {
    return (
        <div className="admin-tab-content">
            <h2>Settings</h2>
            
            <div className="settings-section">
                <h3>Rendering</h3>
                <div className="setting-item">
                    <label>
                        <input type="checkbox" defaultChecked />
                        Enable Anti-aliasing
                    </label>
                </div>
                <div className="setting-item">
                    <label>
                        <input type="checkbox" defaultChecked />
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
