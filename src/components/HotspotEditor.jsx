import { useState, useRef } from 'react'
import { X, Save } from 'lucide-react'
import './HotspotEditor.css'

/**
 * HotspotEditor Component
 * Allows editing hotspots by double-clicking on a scene image
 */
export function HotspotEditor({ scene, onSave, onClose }) {
    const [hotspots, setHotspots] = useState(scene.hotspots || [])
    const [editingHotspot, setEditingHotspot] = useState(null)
    const imageRef = useRef(null)

    const handleDoubleClick = (e) => {
        if (!imageRef.current) return

        const rect = imageRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const newHotspot = {
            id: `hotspot-${Date.now()}`,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            label: ''
        }

        setHotspots([...hotspots, newHotspot])
        setEditingHotspot(newHotspot.id)
    }

    const updateHotspotLabel = (id, label) => {
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, label } : h
        ))
    }

    const deleteHotspot = (id) => {
        setHotspots(hotspots.filter(h => h.id !== id))
        if (editingHotspot === id) {
            setEditingHotspot(null)
        }
    }

    const handleSave = () => {
        onSave(hotspots)
    }

    return (
        <div className="hotspot-editor-overlay">
            <div className="hotspot-editor">
                <div className="editor-header">
                    <div>
                        <h3>Edit Hotspots: {scene.name}</h3>
                        <p className="editor-instructions">Double-click on the image to add a hotspot</p>
                    </div>
                    <div className="editor-actions">
                        <button className="editor-btn save-btn" onClick={handleSave}>
                            <Save size={16} strokeWidth={2} /> Save
                        </button>
                        <button className="editor-btn close-btn" onClick={onClose}>
                            <X size={16} strokeWidth={2} /> Close
                        </button>
                    </div>
                </div>

                <div className="editor-content">
                    <div className="editor-image-container">
                        <img
                            ref={imageRef}
                            src={scene.image}
                            alt={scene.name}
                            className="editor-image"
                            onDoubleClick={handleDoubleClick}
                        />
                        
                        {hotspots.map((hotspot) => (
                            <div
                                key={hotspot.id}
                                className="editor-hotspot"
                                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                            >
                                <div className="editor-hotspot-marker" />
                                <div className="editor-hotspot-label-container">
                                    {editingHotspot === hotspot.id ? (
                                        <input
                                            type="text"
                                            className="editor-hotspot-input"
                                            value={hotspot.label}
                                            onChange={(e) => updateHotspotLabel(hotspot.id, e.target.value)}
                                            onBlur={() => setEditingHotspot(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    setEditingHotspot(null)
                                                }
                                            }}
                                            autoFocus
                                            placeholder="Enter label..."
                                        />
                                    ) : (
                                        <div 
                                            className="editor-hotspot-label"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation()
                                                setEditingHotspot(hotspot.id)
                                            }}
                                        >
                                            {hotspot.label || 'Unnamed'}
                                        </div>
                                    )}
                                    <button
                                        className="editor-hotspot-delete"
                                        onClick={() => deleteHotspot(hotspot.id)}
                                    >
                                        <X size={12} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="editor-sidebar">
                        <h4>Hotspots ({hotspots.length})</h4>
                        <div className="editor-hotspot-list">
                            {hotspots.map((hotspot) => (
                                <div key={hotspot.id} className="editor-hotspot-item">
                                    <div className="editor-hotspot-item-info">
                                        <div className="editor-hotspot-item-label">
                                            {hotspot.label || 'Unnamed'}
                                        </div>
                                        <div className="editor-hotspot-item-coords">
                                            ({hotspot.x}%, {hotspot.y}%)
                                        </div>
                                        <div className="editor-hotspot-item-id">
                                            {hotspot.id}
                                        </div>
                                    </div>
                                    <button
                                        className="editor-hotspot-item-delete"
                                        onClick={() => deleteHotspot(hotspot.id)}
                                    >
                                        <X size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                            {hotspots.length === 0 && (
                                <div className="editor-empty-state">
                                    No hotspots yet. Double-click on the image to add one.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
