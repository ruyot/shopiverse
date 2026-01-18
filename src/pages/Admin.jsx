import { useState, useEffect } from 'react'
import { BarChart3, Palette, Zap, Gamepad2, Camera, RefreshCw, Settings, X, ChevronDown, ChevronRight, Download, Upload } from 'lucide-react'
import { getSettings, updateSettings } from '../config/settings'
import { navigationConfig } from '../config/navigation'
import { getSceneHotspots, saveSceneHotspots, exportHotspots, importHotspots } from '../config/hotspots'
import { HotspotEditor } from '../components/HotspotEditor'
import { generateImage } from '../utils/geminiImageGen'
import './Admin.css'

/**
 * Admin Page
 * Control panel for managing the 3D store experience
 */
export default function Admin() {
    const [activeTab, setActiveTab] = useState('overview')

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
        </div>
    )
}

function OverviewTab() {
    const [timeRange, setTimeRange] = useState('7d')
    const [isRefreshing, setIsRefreshing] = useState(false)
    
    // Sample data for daily users graph
    const dailyUsers = [45, 52, 48, 61, 58, 72, 68]
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const maxUsers = Math.max(...dailyUsers)
    const totalVisitors = dailyUsers.reduce((a, b) => a + b, 0)
    const avgDaily = Math.round(totalVisitors / dailyUsers.length)
    
    const handleRefresh = () => {
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <div className="admin-tab-content modern">
            {/* Header with actions */}
            <div className="content-header">
                <div>
                    <h2 className="page-title">Dashboard Overview</h2>
                    <p className="page-subtitle">Monitor your store performance and analytics</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
                        Refresh
                    </button>
                    <button className="btn-primary">
                        <Download size={16} />
                        Export Data
                    </button>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="stats-grid modern">
                <div className="stat-card modern">
                    <div className="stat-icon-wrapper orange">
                        <BarChart3 size={24} strokeWidth={2.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Visitors</div>
                        <div className="stat-value">{totalVisitors}</div>
                        <div className="stat-trend positive">
                            <span className="trend-arrow">↑</span>
                            <span className="trend-value">12.5%</span>
                            <span className="trend-label">vs last week</span>
                        </div>
                    </div>
                </div>
                
                <div className="stat-card modern">
                    <div className="stat-icon-wrapper blue">
                        <Palette size={24} strokeWidth={2.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Active Scenes</div>
                        <div className="stat-value">7</div>
                        <div className="stat-trend neutral">
                            <span className="trend-label">All systems operational</span>
                        </div>
                    </div>
                </div>
                
                <div className="stat-card modern">
                    <div className="stat-icon-wrapper purple">
                        <Zap size={24} strokeWidth={2.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Top Product</div>
                        <div className="stat-value-text">Classic Denim</div>
                        <div className="stat-trend positive">
                            <span className="trend-arrow">↑</span>
                            <span className="trend-value">8.2%</span>
                            <span className="trend-label">engagement</span>
                        </div>
                    </div>
                </div>
                
                <div className="stat-card modern">
                    <div className="stat-icon-wrapper gray">
                        <Gamepad2 size={24} strokeWidth={2.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Avg Session</div>
                        <div className="stat-value">4.2<span className="stat-unit">min</span></div>
                        <div className="stat-trend positive">
                            <span className="trend-arrow">↑</span>
                            <span className="trend-value">15%</span>
                            <span className="trend-label">vs last week</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section modern">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Visitor Analytics</h3>
                        <p className="chart-subtitle">Daily visitor trends over time</p>
                    </div>
                    <div className="time-range-selector">
                        <button 
                            className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
                            onClick={() => setTimeRange('7d')}
                        >
                            7D
                        </button>
                        <button 
                            className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
                            onClick={() => setTimeRange('30d')}
                        >
                            30D
                        </button>
                        <button 
                            className={`range-btn ${timeRange === '90d' ? 'active' : ''}`}
                            onClick={() => setTimeRange('90d')}
                        >
                            90D
                        </button>
                        <button 
                            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
                            onClick={() => setTimeRange('all')}
                        >
                            All
                        </button>
                    </div>
                </div>
                
                <div className="chart-container">
                    <svg className="line-chart" viewBox="0 0 700 250" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map(i => (
                            <line 
                                key={i}
                                x1="0" 
                                y1={i * 50} 
                                x2="700" 
                                y2={i * 50} 
                                stroke="#E5E7EB" 
                                strokeWidth="1"
                            />
                        ))}
                        
                        {/* Area fill */}
                        <path
                            d={`M 0 ${250 - (dailyUsers[0] / maxUsers * 180)} ${dailyUsers.map((users, i) => 
                                `L ${(i / (dailyUsers.length - 1)) * 700} ${250 - (users / maxUsers * 180)}`
                            ).join(' ')} L 700 250 L 0 250 Z`}
                            fill="url(#chartGradient)"
                        />
                        
                        {/* Line */}
                        <path
                            d={`M 0 ${250 - (dailyUsers[0] / maxUsers * 180)} ${dailyUsers.map((users, i) => 
                                `L ${(i / (dailyUsers.length - 1)) * 700} ${250 - (users / maxUsers * 180)}`
                            ).join(' ')}`}
                            fill="none"
                            stroke="#FF6B35"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {dailyUsers.map((users, i) => (
                            <g key={i}>
                                <circle
                                    cx={(i / (dailyUsers.length - 1)) * 700}
                                    cy={250 - (users / maxUsers * 180)}
                                    r="5"
                                    fill="#fff"
                                    stroke="#FF6B35"
                                    strokeWidth="2.5"
                                    className="data-point"
                                />
                            </g>
                        ))}
                    </svg>
                    
                    <div className="chart-x-axis">
                        {days.map((day, i) => (
                            <span key={i} className="axis-label">{day}</span>
                        ))}
                    </div>
                </div>
                
                <div className="chart-footer">
                    <span className="chart-date">
                        {new Date().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="action-buttons modern">
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
    const [roomToggleWarning, setRoomToggleWarning] = useState(null)
    const [backgroundChanger, setBackgroundChanger] = useState(null)

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
            console.log('💾 Hotspots saved successfully for scene:', editingScene.id)
            console.log('📊 Total hotspots:', hotspots.length)
            hotspots.forEach((h, i) => {
                console.log(`  ${i + 1}. ${h.title || h.label} - ${h.images?.length || 0} image(s)`)
            })
            // Update local state
            setSceneHotspots(prev => ({
                ...prev,
                [editingScene.id]: hotspots
            }))
        } else {
            console.error('❌ Failed to save hotspots')
        }
        
        setEditingScene(null)
    }

    const handleCloseEditor = () => {
        setEditingScene(null)
    }

    const handleExport = () => {
        exportHotspots()
    }

    const handleImport = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = event.target.result
                importHotspots(json)
                // Reload hotspots
                const hotspots = {}
                scenes.forEach(scene => {
                    hotspots[scene.id] = getSceneHotspots(scene.id)
                })
                setSceneHotspots(hotspots)
                console.log('✅ Hotspot metadata imported')
            } catch (error) {
                console.error('❌ Error importing metadata:', error)
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="admin-tab-content">
            <div className="scenes-header">
                <h2>3D Scene Management</h2>
                <div className="scenes-actions">
                    <button className="action-btn" onClick={handleExport}>
                        <Download size={16} strokeWidth={2} /> Export Metadata
                    </button>
                    <label className="action-btn" style={{ cursor: 'pointer' }}>
                        <Upload size={16} strokeWidth={2} /> Import Metadata
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>
            
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
                                <div className="scene-actions">
                                    <button 
                                        className="scene-btn room-toggle"
                                        onClick={() => setRoomToggleWarning(scene)}
                                        title="Toggle Room Visibility"
                                    >
                                        Toggle Room
                                    </button>
                                    <button 
                                        className="scene-btn bg-changer"
                                        onClick={() => setBackgroundChanger(scene)}
                                        title="Change Background"
                                    >
                                        Change Background
                                    </button>
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

            {/* Room Toggle Warning Modal */}
            {roomToggleWarning && (
                <div className="modal-overlay" onClick={() => setRoomToggleWarning(null)}>
                    <div className="modal-warning" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header warning">
                            <h3>⚠️ Warning: Disable Room</h3>
                            <button className="modal-close" onClick={() => setRoomToggleWarning(null)}>
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <p>You are about to disable the room:</p>
                            <div className="modal-scene-info">
                                <strong>{roomToggleWarning.name}</strong>
                                <span className="modal-scene-id">{roomToggleWarning.id}</span>
                            </div>
                            <p className="modal-warning-text">
                                This will hide the room from the store navigation. Users will not be able to access this scene.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn cancel"
                                onClick={() => setRoomToggleWarning(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="modal-btn confirm-danger"
                                onClick={() => {
                                    console.log('Room disabled:', roomToggleWarning.id)
                                    setRoomToggleWarning(null)
                                }}
                            >
                                Disable Room
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Changer Modal */}
            {backgroundChanger && (() => {
                const [bgMode, setBgMode] = useState('upload')
                const [bgPrompt, setBgPrompt] = useState('')
                const [bgGenerating, setBgGenerating] = useState(false)
                
                const handleGenerateBg = async () => {
                    if (!bgPrompt.trim()) {
                        alert('Please enter a prompt for background generation')
                        return
                    }
                    
                    const apiKey = import.meta.env.VITE_GEMINI_IMAGE_API_KEY
                    
                    if (!apiKey) {
                        alert('AI Image Generation: Please configure Gemini Image API in your .env file.\n\nAdd VITE_GEMINI_IMAGE_API_KEY to enable this feature.')
                        return
                    }
                    
                    setBgGenerating(true)
                    try {
                        console.log('🎨 Generating background with Gemini AI...')
                        
                        // Generate image using Gemini API
                        const imageDataUrl = await generateImage(bgPrompt)
                        
                        // Convert data URL to blob for download
                        const response = await fetch(imageDataUrl)
                        const blob = await response.blob()
                        const filename = `${backgroundChanger.id}_bg_${Date.now()}.png`
                        
                        // Create download link
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = filename
                        a.click()
                        URL.revokeObjectURL(url)
                        
                        console.log('✅ Background generated and downloaded:', filename)
                        console.log('📁 Move to: public/')
                        console.log('🔧 Update navigation config path to:', `/${filename}`)
                        
                        alert(`Background generated successfully!\n\nFile: ${filename}\n\n1. Move the downloaded file to public/ folder\n2. Update navigation config with: /${filename}`)
                        
                        // Clear prompt
                        setBgPrompt('')
                    } catch (error) {
                        console.error('❌ Error generating background:', error)
                        alert('Failed to generate background: ' + error.message)
                    } finally {
                        setBgGenerating(false)
                    }
                }
                
                return (
                    <div className="modal-overlay" onClick={() => setBackgroundChanger(null)}>
                        <div className="modal-bg-changer" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Change Background</h3>
                                <button className="modal-close" onClick={() => setBackgroundChanger(null)}>
                                    <X size={18} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="modal-content">
                                <div className="modal-scene-info">
                                    <strong>{backgroundChanger.name}</strong>
                                    <span className="modal-scene-id">{backgroundChanger.id}</span>
                                </div>
                                
                                <div className="bg-preview-section">
                                    <label>Current Background</label>
                                    <div className="bg-preview">
                                        <img src={backgroundChanger.image} alt={backgroundChanger.name} />
                                        <div className="bg-path">{backgroundChanger.image}</div>
                                    </div>
                                </div>

                                <div className="bg-input-section">
                                    <div className="image-mode-toggle">
                                        <button 
                                            className={`mode-btn ${bgMode === 'upload' ? 'active' : ''}`}
                                            onClick={() => setBgMode('upload')}
                                        >
                                            <Camera size={14} strokeWidth={2} />
                                            Upload
                                        </button>
                                        <button 
                                            className={`mode-btn ${bgMode === 'generate' ? 'active' : ''}`}
                                            onClick={() => setBgMode('generate')}
                                        >
                                            <Zap size={14} strokeWidth={2} />
                                            AI Generate
                                        </button>
                                    </div>

                                    {bgMode === 'upload' ? (
                                        <>
                                            <label>Upload New Background</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="modal-file-input"
                                                id="new-bg-file"
                                            />
                                            <label htmlFor="new-bg-file" className="modal-upload-btn">
                                                <Camera size={16} strokeWidth={2} />
                                                Choose Background Image
                                            </label>
                                            <p className="modal-help-text">
                                                Image will be saved to public/ folder. Use the filename in your navigation config.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="ai-generate-section">
                                            <label>Generate Background with AI</label>
                                            <textarea
                                                value={bgPrompt}
                                                onChange={(e) => setBgPrompt(e.target.value)}
                                                placeholder="Describe the background scene... (e.g., 'Modern retail store interior with warm lighting and wooden shelves')"
                                                className="ai-prompt-input"
                                                rows="3"
                                            />
                                            <button 
                                                className="ai-generate-btn"
                                                onClick={handleGenerateBg}
                                                disabled={bgGenerating || !bgPrompt.trim()}
                                            >
                                                {bgGenerating ? (
                                                    <>
                                                        <RefreshCw size={16} strokeWidth={2} className="spinning" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={16} strokeWidth={2} />
                                                        Generate Background
                                                    </>
                                                )}
                                            </button>
                                            <p className="ai-hint">
                                                💡 Tip: Describe the style, lighting, and atmosphere for best results
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="modal-btn cancel"
                                    onClick={() => setBackgroundChanger(null)}
                                >
                                    Cancel
                                </button>
                                {bgMode === 'upload' && (
                                    <button 
                                        className="modal-btn confirm"
                                        onClick={() => {
                                            const fileInput = document.getElementById('new-bg-file')
                                            if (fileInput.files.length > 0) {
                                                const file = fileInput.files[0]
                                                const filename = `${backgroundChanger.id}_bg_${Date.now()}.${file.name.split('.').pop()}`
                                                
                                                const url = URL.createObjectURL(file)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = filename
                                                a.click()
                                                URL.revokeObjectURL(url)
                                                
                                                console.log('📥 Background image downloaded:', filename)
                                                console.log('📁 Move to: public/')
                                                console.log('🔧 Update navigation config path to:', `/${filename}`)
                                            }
                                            setBackgroundChanger(null)
                                        }}
                                    >
                                        Download & Update
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}
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
