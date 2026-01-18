import { useState, useEffect } from 'react'
import { BarChart3, Palette, Zap, Gamepad2, Camera, RefreshCw, TrendingUp, X, ChevronDown, ChevronRight, Download, Upload, Plus } from 'lucide-react'
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
                    className={`admin-tab ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                >
                    Insights
                </button>
            </nav>

            {/* Content Area */}
            <main className="admin-content">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'scenes' && <ScenesTab />}
                {activeTab === 'insights' && <InsightsTab />}
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
                        <TrendingUp size={16} strokeWidth={2} /> View Insights
                    </button>
                </div>
            </div>
        </div>
    )
}

function ScenesTab() {
    const [sceneHotspots, setSceneHotspots] = useState({})
    const [expandedScenes, setExpandedScenes] = useState({})
    const [editingScene, setEditingScene] = useState(null)
    const [roomToggleWarning, setRoomToggleWarning] = useState(null)
    const [backgroundChanger, setBackgroundChanger] = useState(null)
    const [settings, setSettings] = useState(() => getSettings())
    const [selectedNode, setSelectedNode] = useState(null)
    const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
    const [nodePositions, setNodePositions] = useState({
        storeFront: { x: 400, y: 50 },
        storeP1: { x: 400, y: 230 },
        storeP1Left: { x: 200, y: 230 },
        storeP1Right: { x: 600, y: 230 },
        storeP2: { x: 400, y: 430 },
        storeP2Left: { x: 150, y: 530 },
        storeP2Right: { x: 650, y: 530 }
    })
    const [draggingNode, setDraggingNode] = useState(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [connectionEditMode, setConnectionEditMode] = useState(false)
    const [connectingFrom, setConnectingFrom] = useState(null)
    const [customScenes, setCustomScenes] = useState({}) // Store custom scenes created in admin
    const [customConnections, setCustomConnections] = useState([]) // Store custom connections

    const scenes = Object.values(navigationConfig).filter(scene => scene.id)

    useEffect(() => {
        const loadHotspots = () => {
            const hotspots = {}
            scenes.forEach(scene => {
                hotspots[scene.id] = getSceneHotspots(scene.id)
            })
            setSceneHotspots(hotspots)
        }
        loadHotspots()

        const handleHotspotsChanged = () => loadHotspots()
        window.addEventListener('hotspotsChanged', handleHotspotsChanged)
        return () => window.removeEventListener('hotspotsChanged', handleHotspotsChanged)
    }, [scenes.length])

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

    const handleMouseDown = (nodeId, e) => {
        const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
        const pos = nodePositions[nodeId]
        setDraggingNode(nodeId)
        setDragOffset({
            x: (e.clientX - svgRect.left) - pos.x,
            y: (e.clientY - svgRect.top) - pos.y
        })
    }

    const handleMouseMove = (e) => {
        if (!draggingNode) return
        const svg = e.currentTarget
        const svgRect = svg.getBoundingClientRect()
        const newX = e.clientX - svgRect.left - dragOffset.x
        const newY = e.clientY - svgRect.top - dragOffset.y
        
        setNodePositions(prev => ({
            ...prev,
            [draggingNode]: { x: newX, y: newY }
        }))
    }

    const handleMouseUp = () => {
        setDraggingNode(null)
    }

    const handleAddNode = () => {
        const newId = `customScene_${Date.now()}`
        const sceneName = prompt('Enter scene name:') || 'New Scene'
        
        // Create new scene object
        const newScene = {
            id: newId,
            name: sceneName,
            image: `/scenes/${newId}.png`,
            ply: `/scenes/${newId}.ply`,
            connections: {}
        }
        
        // Add to custom scenes state
        setCustomScenes(prev => ({
            ...prev,
            [newId]: newScene
        }))
        
        // Add to graph at center position
        setNodePositions(prev => ({
            ...prev,
            [newId]: { x: 400, y: 300 }
        }))
        
        // Initialize empty hotspots
        setSceneHotspots(prev => ({
            ...prev,
            [newId]: []
        }))
        
        console.log('✅ Created new scene:', newId)
        
        // TODO: Persist to files
        // - Add to src/config/navigation.js navigationConfig object
        // - Add to src/config/hotspots.js defaultHotspots object
        // - Create/upload PLY file to /public/scenes/
        // - Requires backend API or manual file update
    }

    const handleDeleteNode = (nodeId) => {
        const confirmed = confirm(`Delete scene "${nodeId}"?\n\nThis will remove it from the graph.`)
        if (!confirmed) return
        
        // Remove from custom scenes
        setCustomScenes(prev => {
            const newScenes = { ...prev }
            delete newScenes[nodeId]
            return newScenes
        })
        
        // Remove from graph positions
        setNodePositions(prev => {
            const newPos = { ...prev }
            delete newPos[nodeId]
            return newPos
        })
        
        // Remove from hotspots
        setSceneHotspots(prev => {
            const newHotspots = { ...prev }
            delete newHotspots[nodeId]
            return newHotspots
        })
        
        // Remove any connections to/from this node
        setCustomConnections(prev => 
            prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId)
        )
        
        console.log('✅ Deleted scene:', nodeId)
        
        // TODO: Persist to files
        // - Remove from src/config/navigation.js navigationConfig object
        // - Remove from src/config/hotspots.js defaultHotspots object
        // - Update all connections in navigationConfig that point to this scene
        // - Delete PLY file from /public/scenes/
        // - Requires backend API or manual file update
    }

    const handleStartConnection = (nodeId) => {
        if (connectionEditMode) {
            if (!connectingFrom) {
                setConnectingFrom(nodeId)
                console.log('Starting connection from:', nodeId)
            } else if (connectingFrom !== nodeId) {
                const direction = prompt('Enter direction (forward/back/left/right):')
                
                if (direction && ['forward', 'back', 'left', 'right'].includes(direction)) {
                    // Create new connection
                    const newConnection = {
                        from: connectingFrom,
                        to: nodeId,
                        direction: direction
                    }
                    
                    setCustomConnections(prev => [...prev, newConnection])
                    
                    // Ask for bidirectional
                    const bidirectional = confirm('Create return path?')
                    if (bidirectional) {
                        const oppositeDir = {
                            forward: 'back',
                            back: 'forward',
                            left: 'right',
                            right: 'left'
                        }[direction]
                        
                        const returnConnection = {
                            from: nodeId,
                            to: connectingFrom,
                            direction: oppositeDir
                        }
                        
                        setCustomConnections(prev => [...prev, returnConnection])
                    }
                    
                    console.log('✅ Created connection:', connectingFrom, '→', nodeId, `(${direction})`)
                    
                    // TODO: Persist to files
                    // - Update src/config/navigation.js navigationConfig[from].connections[direction] = to
                    // - Requires backend API or manual file update
                }
                
                setConnectingFrom(null)
            }
        }
    }

    // TODO: Implement delete connection functionality
    // This will REMOVE A NAVIGATION PATH between rooms in the virtual world
    // 
    // Steps to implement:
    // 1. Make arrow lines clickable (add onClick handler to <line> elements)
    // 2. When clicked, identify which connection it represents
    // 3. Confirm deletion with user
    // 4. Remove from navigationConfig:
    //    delete navigationConfig[fromNode].connections[direction]
    //    Example: delete navigationConfig['storeP1'].connections.forward
    // 5. Remove arrow line from graph visualization
    // 6. Save updated navigationConfig to file
    // 7. Users will no longer be able to navigate this path in the virtual store
    const handleDeleteConnection = (fromNode, toNode) => {
        console.log('TODO: Delete navigation path from', fromNode, 'to', toNode)
        alert(`TODO: This will REMOVE the navigation path.\n\nFrom: ${fromNode}\nTo: ${toNode}\n\nImplementation needed:\n- Remove from navigationConfig.connections\n- Update arrow visualization\n- Save to navigation.js\n\nUsers won't be able to use this path anymore!`)
        // Find which direction this connection is
        // const scene = navigationConfig[fromNode]
        // const direction = Object.keys(scene.connections).find(
        //     dir => scene.connections[dir] === toNode
        // )
        // if (direction) {
        //     const confirmed = confirm(`Delete navigation path?\n${fromNode} → ${toNode} (${direction})`)
        //     if (confirmed) {
        //         delete navigationConfig[fromNode].connections[direction]
        //         // Would need to write to navigation.js file
        //     }
        // }
    }

    // TODO: Implement save layout functionality
    // This will PERSIST the visual graph layout AND all virtual world changes
    // 
    // Steps to implement:
    // 1. Save nodePositions to localStorage for graph visualization
    // 2. Export updated navigationConfig to JSON file
    // 3. Export updated hotspots data
    // 4. Provide download link for backup files
    // 5. Optionally: Send to backend API to update actual config files
    // 6. Show success message with what was saved
    // 
    // What gets saved:
    // - Graph node positions (visual only)
    // - All scene definitions (affects virtual world)
    // - All navigation connections (affects virtual world)
    // - All hotspot data (affects virtual world)
    const handleSaveLayout = () => {
        console.log('TODO: Save layout and virtual world configuration')
        alert('TODO: This will SAVE all changes to the virtual store.\n\nWhat gets saved:\n- Graph layout positions\n- Scene definitions\n- Navigation connections\n- Hotspot data\n\nImplementation needed:\n- Export navigationConfig\n- Export hotspots\n- Save to files or backend')
        // const layoutData = {
        //     nodePositions,
        //     navigationConfig,
        //     hotspots: getAllHotspots(),
        //     timestamp: new Date().toISOString()
        // }
        // localStorage.setItem('scene_layout', JSON.stringify(nodePositions))
        // 
        // // Export as downloadable JSON
        // const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' })
        // const url = URL.createObjectURL(blob)
        // const a = document.createElement('a')
        // a.href = url
        // a.download = `store_layout_${Date.now()}.json`
        // a.click()
    }

    // TODO: Implement load layout functionality
    // This will RESTORE a previously saved virtual world configuration
    // 
    // Steps to implement:
    // 1. Prompt user to upload saved JSON file
    // 2. Parse and validate the data
    // 3. Restore nodePositions for graph visualization
    // 4. Restore navigationConfig (updates virtual world navigation)
    // 5. Restore hotspots data (updates virtual world products)
    // 6. Validate all PLY files exist for loaded scenes
    // 7. Show warning if any scenes are missing files
    // 8. Refresh the graph and scene list
    // 
    // This allows restoring previous virtual store configurations
    const handleLoadLayout = () => {
        console.log('TODO: Load saved virtual world configuration')
        alert('TODO: This will RESTORE a saved virtual store configuration.\n\nWhat gets restored:\n- Graph layout\n- Scene definitions\n- Navigation paths\n- Hotspot data\n\nImplementation needed:\n- File upload dialog\n- Parse and validate JSON\n- Update navigationConfig\n- Refresh visualization')
        // const input = document.createElement('input')
        // input.type = 'file'
        // input.accept = '.json'
        // input.onchange = (e) => {
        //     const file = e.target.files[0]
        //     const reader = new FileReader()
        //     reader.onload = (event) => {
        //         try {
        //             const data = JSON.parse(event.target.result)
        //             setNodePositions(data.nodePositions)
        //             // Would need to update navigationConfig and hotspots
        //             // Validate all PLY files exist
        //             alert('Layout restored successfully!')
        //         } catch (error) {
        //             alert('Error loading layout: ' + error.message)
        //         }
        //     }
        //     reader.readAsText(file)
        // }
        // input.click()
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
            
            {/* Store Layout Graph - Side by Side */}
            <div className={`scenes-layout ${isGraphFullscreen ? 'fullscreen' : ''}`}>
                <div className="store-graph-container">
                    <div className="graph-header">
                        <h3>Store Layout</h3>
                        <div className="graph-toolbar">
                            <button 
                                className="graph-tool-btn"
                                onClick={handleAddNode}
                                title="Add New Scene (TODO)"
                            >
                                <Plus size={14} strokeWidth={2} />
                                Add Scene
                            </button>
                            <button 
                                className={`graph-tool-btn ${connectionEditMode ? 'active' : ''}`}
                                onClick={() => {
                                    setConnectionEditMode(!connectionEditMode)
                                    setConnectingFrom(null)
                                }}
                                title="Connection Edit Mode (TODO)"
                            >
                                <Zap size={14} strokeWidth={2} />
                                {connectionEditMode ? 'Exit Connect' : 'Connect Nodes'}
                            </button>
                            <button 
                                className="graph-tool-btn"
                                onClick={handleSaveLayout}
                                title="Save Layout (TODO)"
                            >
                                <Download size={14} strokeWidth={2} />
                            </button>
                            <button 
                                className="expand-graph-btn"
                                onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                                title={isGraphFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                {isGraphFullscreen ? <X size={16} strokeWidth={2} /> : <Camera size={16} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>
                    <svg 
                        className="store-graph" 
                        viewBox="0 0 800 600"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                            <polygon points="0 0, 10 3, 0 6" fill="#FF6B35" />
                        </marker>
                    </defs>
                    
                    {/* Connection lines - dynamically positioned */}
                    {/* storeFront -> storeP1 */}
                    <line 
                        x1={nodePositions.storeFront.x} 
                        y1={nodePositions.storeFront.y + 30} 
                        x2={nodePositions.storeP1.x} 
                        y2={nodePositions.storeP1.y - 30} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* storeP1 -> storeP2 */}
                    <line 
                        x1={nodePositions.storeP1.x} 
                        y1={nodePositions.storeP1.y + 30} 
                        x2={nodePositions.storeP2.x} 
                        y2={nodePositions.storeP2.y - 30} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* storeP1 -> storeP1Left */}
                    <line 
                        x1={nodePositions.storeP1.x - 40} 
                        y1={nodePositions.storeP1.y + 20} 
                        x2={nodePositions.storeP1Left.x + 40} 
                        y2={nodePositions.storeP1Left.y - 20} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* storeP1 -> storeP1Right */}
                    <line 
                        x1={nodePositions.storeP1.x + 40} 
                        y1={nodePositions.storeP1.y + 20} 
                        x2={nodePositions.storeP1Right.x - 40} 
                        y2={nodePositions.storeP1Right.y - 20} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* storeP2 -> storeP2Left */}
                    <line 
                        x1={nodePositions.storeP2.x - 40} 
                        y1={nodePositions.storeP2.y + 20} 
                        x2={nodePositions.storeP2Left.x + 40} 
                        y2={nodePositions.storeP2Left.y - 20} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* storeP2 -> storeP2Right */}
                    <line 
                        x1={nodePositions.storeP2.x + 40} 
                        y1={nodePositions.storeP2.y + 20} 
                        x2={nodePositions.storeP2Right.x - 40} 
                        y2={nodePositions.storeP2Right.y - 20} 
                        stroke="#FF6B35" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                    />
                    
                    {/* Custom connections created by user */}
                    {customConnections.map((conn, idx) => {
                        const fromPos = nodePositions[conn.from]
                        const toPos = nodePositions[conn.to]
                        if (!fromPos || !toPos) return null
                        
                        return (
                            <line 
                                key={idx}
                                x1={fromPos.x} 
                                y1={fromPos.y} 
                                x2={toPos.x} 
                                y2={toPos.y} 
                                stroke="#10B981" 
                                strokeWidth="2" 
                                markerEnd="url(#arrowhead)" 
                                strokeDasharray="5,5"
                            />
                        )
                    })}
                    
                    {/* Scene nodes - rectangles (includes custom scenes) */}
                    {Object.keys(nodePositions).map(nodeId => {
                        const scene = navigationConfig[nodeId] || customScenes[nodeId]
                        if (!scene) return null
                        
                        const hotspots = sceneHotspots[nodeId] || []
                        const isSelected = selectedNode === nodeId
                        const pos = nodePositions[nodeId]
                        const node = { id: nodeId, name: scene.name }
                        
                        return (
                            <g key={node.id}>
                                <g
                                    onClick={() => {
                                        if (connectionEditMode) {
                                            handleStartConnection(node.id)
                                        } else {
                                            setSelectedNode(node.id)
                                        }
                                    }} 
                                    onMouseDown={(e) => !connectionEditMode && handleMouseDown(node.id, e)}
                                    style={{ 
                                        cursor: connectionEditMode ? 'crosshair' : (draggingNode === node.id ? 'grabbing' : 'grab')
                                    }}
                                >
                                    <rect
                                        x={pos.x - 60}
                                        y={pos.y - 30}
                                        width="120"
                                        height="60"
                                        rx="8"
                                        fill={connectingFrom === node.id ? '#FFA500' : (isSelected ? '#FF6B35' : '#fff')}
                                        stroke={connectingFrom === node.id ? '#FF8C00' : '#FF6B35'}
                                        strokeWidth="3"
                                        className="scene-node"
                                    />
                                    <text
                                        x={pos.x}
                                        y={pos.y - 5}
                                        textAnchor="middle"
                                        fill={isSelected || connectingFrom === node.id ? '#fff' : '#333'}
                                        fontSize="12"
                                        fontWeight="600"
                                        pointerEvents="none"
                                    >
                                        {node.name}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 12}
                                        textAnchor="middle"
                                        fill={isSelected || connectingFrom === node.id ? '#fff' : '#666'}
                                        fontSize="10"
                                        pointerEvents="none"
                                    >
                                        {hotspots.length} hotspots
                                    </text>
                                </g>
                                
                                {/* Delete button (TODO: Implement) */}
                                <g 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteNode(node.id)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    className="node-delete-btn"
                                >
                                    <circle
                                        cx={pos.x + 50}
                                        cy={pos.y - 20}
                                        r="10"
                                        fill="#EF4444"
                                        stroke="#fff"
                                        strokeWidth="2"
                                    />
                                    <line
                                        x1={pos.x + 46}
                                        y1={pos.y - 24}
                                        x2={pos.x + 54}
                                        y2={pos.y - 16}
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1={pos.x + 54}
                                        y1={pos.y - 24}
                                        x2={pos.x + 46}
                                        y2={pos.y - 16}
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </g>
                            </g>
                        )
                    })}
                </svg>
                </div>

                {/* Selected Scene Details */}
                {!isGraphFullscreen && selectedNode && (() => {
                const scene = navigationConfig[selectedNode] || customScenes[selectedNode]
                if (!scene) return null
                const hotspots = sceneHotspots[selectedNode] || []
                const sceneWithHotspots = { ...scene, hotspots }
                
                return (
                    <div className="scene-details-panel">
                        <div className="scene-details-header">
                            <div>
                                <h3>{scene.name}</h3>
                                <span className="scene-id-badge">{scene.id}</span>
                            </div>
                        </div>
                        
                        <div className="scene-details-content">
                            <div className="scene-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Hotspots</span>
                                    <span className="stat-value">{hotspots.length}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Connections</span>
                                    <span className="stat-value">{Object.keys(scene.connections || {}).length}</span>
                                </div>
                            </div>
                            
                            <div className="scene-actions-grid">
                                <button 
                                    className="action-btn-grid"
                                    onClick={() => handleEditScene(sceneWithHotspots)}
                                >
                                    <Camera size={16} strokeWidth={2} />
                                    Edit Hotspots
                                </button>
                                <button 
                                    className="action-btn-grid"
                                    onClick={() => setBackgroundChanger(scene)}
                                >
                                    <Palette size={16} strokeWidth={2} />
                                    Change Background
                                </button>
                                <button 
                                    className="action-btn-grid"
                                    onClick={() => setRoomToggleWarning(scene)}
                                >
                                    <Zap size={16} strokeWidth={2} />
                                    Toggle Room
                                </button>
                            </div>
                            
                            {hotspots.length > 0 && (
                                <div className="hotspots-list-compact">
                                    <h4>Product Hotspots</h4>
                                    {hotspots.map(hotspot => (
                                        <div key={hotspot.id} className="hotspot-compact">
                                            <input
                                                type="checkbox"
                                                checked={!settings.disabledHotspots[hotspot.id]}
                                                onChange={() => toggleHotspot(hotspot.id)}
                                            />
                                            <span className="hotspot-compact-name">{hotspot.label}</span>
                                            <span className="hotspot-compact-coords">({hotspot.x}%, {hotspot.y}%)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })()}
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

function InsightsTab() {
    const [timeRange, setTimeRange] = useState('7d')
    
    // Sample insights data
    const topProducts = [
        { name: 'Denim Jeans', views: 342, clicks: 89, conversions: 23 },
        { name: 'Leather Wallet', views: 298, clicks: 76, conversions: 19 },
        { name: 'Canvas Sneakers', views: 267, clicks: 65, conversions: 15 },
        { name: 'Cotton T-Shirt', views: 234, clicks: 54, conversions: 12 },
        { name: 'Wool Sweater', views: 189, clicks: 42, conversions: 8 }
    ]

    const sceneMetrics = [
        { scene: 'Living Room', avgTime: '2m 34s', bounceRate: '23%', engagement: 87 },
        { scene: 'Bedroom', avgTime: '1m 58s', bounceRate: '31%', engagement: 76 },
        { scene: 'Kitchen', avgTime: '1m 42s', bounceRate: '28%', engagement: 72 },
        { scene: 'Bathroom', avgTime: '1m 15s', bounceRate: '42%', engagement: 58 }
    ]

    const userBehavior = {
        avgSessionTime: '5m 23s',
        pagesPerSession: 3.4,
        returnRate: '34%',
        mobileUsers: '62%'
    }

    return (
        <div className="admin-tab-content">
            <div className="insights-header">
                <h2>Insights & Analytics</h2>
                <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="time-range-select"
                >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                </select>
            </div>

            {/* User Behavior Overview */}
            <div className="insights-section">
                <h3>User Behavior</h3>
                <div className="metrics-grid-4">
                    <div className="metric-card">
                        <div className="metric-label">Avg Session Time</div>
                        <div className="metric-value">{userBehavior.avgSessionTime}</div>
                        <div className="metric-change positive">+12% vs last period</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Pages/Session</div>
                        <div className="metric-value">{userBehavior.pagesPerSession}</div>
                        <div className="metric-change positive">+8% vs last period</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Return Rate</div>
                        <div className="metric-value">{userBehavior.returnRate}</div>
                        <div className="metric-change negative">-3% vs last period</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Mobile Users</div>
                        <div className="metric-value">{userBehavior.mobileUsers}</div>
                        <div className="metric-change positive">+5% vs last period</div>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="insights-section">
                <h3>Top Performing Products</h3>
                <div className="insights-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Views</th>
                                <th>Clicks</th>
                                <th>Conversions</th>
                                <th>Conv. Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product, idx) => (
                                <tr key={idx}>
                                    <td className="product-name">{product.name}</td>
                                    <td>{product.views}</td>
                                    <td>{product.clicks}</td>
                                    <td>{product.conversions}</td>
                                    <td className="conversion-rate">
                                        {((product.conversions / product.clicks) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scene Performance */}
            <div className="insights-section">
                <h3>Scene Performance</h3>
                <div className="insights-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Scene</th>
                                <th>Avg Time</th>
                                <th>Bounce Rate</th>
                                <th>Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sceneMetrics.map((scene, idx) => (
                                <tr key={idx}>
                                    <td className="scene-name">{scene.scene}</td>
                                    <td>{scene.avgTime}</td>
                                    <td>{scene.bounceRate}</td>
                                    <td>
                                        <div className="engagement-bar">
                                            <div 
                                                className="engagement-fill" 
                                                style={{ width: `${scene.engagement}%` }}
                                            />
                                            <span className="engagement-text">{scene.engagement}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
