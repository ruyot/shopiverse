import { useState, useRef } from 'react'
import { X, Save, Edit2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import './HotspotEditor.css'

/**
 * HotspotEditor Component
 * Allows editing hotspots by double-clicking on a scene image
 */
export function HotspotEditor({ scene, onSave, onClose }) {
    const [hotspots, setHotspots] = useState(scene.hotspots || [])
    const [editingHotspot, setEditingHotspot] = useState(null)
    const [editingMetadata, setEditingMetadata] = useState(null)
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
            label: '',
            title: '',
            images: []
        }

        setHotspots([...hotspots, newHotspot])
        setEditingHotspot(newHotspot.id)
    }

    const updateHotspotLabel = (id, label) => {
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, label } : h
        ))
    }

    const updateHotspotMetadata = (id, metadata) => {
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, ...metadata } : h
        ))
    }

    const addImageToHotspot = (id, imageUrl) => {
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, images: [...(h.images || []), imageUrl] } : h
        ))
    }

    const removeImageFromHotspot = (id, imageIndex) => {
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, images: h.images.filter((_, i) => i !== imageIndex) } : h
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
                                    <div className="editor-hotspot-item-actions">
                                        <button
                                            className="editor-hotspot-item-edit"
                                            onClick={() => setEditingMetadata(hotspot)}
                                            title="Edit metadata"
                                        >
                                            <Edit2 size={14} strokeWidth={2} />
                                        </button>
                                        <button
                                            className="editor-hotspot-item-delete"
                                            onClick={() => deleteHotspot(hotspot.id)}
                                            title="Delete hotspot"
                                        >
                                            <X size={14} strokeWidth={2} />
                                        </button>
                                    </div>
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

                {/* Metadata Editor Modal */}
                {editingMetadata && (
                    <MetadataEditor
                        hotspot={editingMetadata}
                        onSave={(metadata) => {
                            updateHotspotMetadata(editingMetadata.id, metadata)
                            setEditingMetadata(null)
                        }}
                        onClose={() => setEditingMetadata(null)}
                        onAddImage={(url) => addImageToHotspot(editingMetadata.id, url)}
                        onRemoveImage={(index) => removeImageFromHotspot(editingMetadata.id, index)}
                    />
                )}
            </div>
        </div>
    )
}

/**
 * MetadataEditor Component
 * Glassmorphism modal for editing hotspot metadata
 */
function MetadataEditor({ hotspot, onSave, onClose, onAddImage, onRemoveImage }) {
    const [title, setTitle] = useState(hotspot.title || '')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const handleSave = () => {
        onSave({ title })
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        console.log(`📸 Processing ${files.length} image(s)...`)
        setUploading(true)

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // Generate unique filename
                    const timestamp = Date.now()
                    const randomStr = Math.random().toString(36).substring(7)
                    const extension = file.name.split('.').pop()
                    const filename = `${hotspot.id}_${timestamp}_${randomStr}.${extension}`
                    const filepath = `/uploads/${filename}`
                    
                    // Create a download link to save the file
                    const compressed = await compressImage(file)
                    downloadImageToFolder(compressed, filename)
                    
                    // Store the file path (not base64)
                    console.log(`✅ Image ready: ${filename} - Save to public/uploads/`)
                    onAddImage(filepath)
                } catch (error) {
                    console.error('❌ Error processing image:', error)
                }
            }
        }

        setUploading(false)
        console.log(`📁 Save downloaded images to: public/uploads/`)
        console.log(`✅ Paths stored in metadata`)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    
                    // Max dimensions
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    
                    let width = img.width
                    let height = img.height
                    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }
                    
                    canvas.width = width
                    canvas.height = height
                    ctx.drawImage(img, 0, 0, width, height)
                    
                    canvas.toBlob((blob) => {
                        resolve(blob)
                    }, 'image/jpeg', 0.85)
                }
                img.onerror = reject
                img.src = e.target.result
            }
            reader.onerror = reject
        })
    }

    const downloadImageToFolder = (blob, filename) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="metadata-editor-overlay">
            <div className="metadata-editor-glass">
                <div className="metadata-editor-header">
                    <h3>Edit Product Metadata</h3>
                    <button className="metadata-close" onClick={onClose}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="metadata-editor-content">
                    <div className="metadata-field">
                        <label>Product Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter product title..."
                            className="metadata-input"
                        />
                    </div>

                    <div className="metadata-field">
                        <label>Product Images</label>
                        <div className="metadata-images-list">
                            {(hotspot.images || []).map((img, index) => (
                                <div key={index} className="metadata-image-item">
                                    <img src={img} alt={`Product ${index + 1}`} className="metadata-image-preview" />
                                    <button
                                        className="metadata-image-remove"
                                        onClick={() => onRemoveImage(index)}
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="metadata-add-image">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="metadata-file-input"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="metadata-upload-label">
                                <ImageIcon size={16} strokeWidth={2} />
                                Choose Images
                            </label>
                            {uploading && <span className="metadata-uploading">Uploading...</span>}
                        </div>
                    </div>
                </div>

                <div className="metadata-editor-footer">
                    <button className="metadata-save-btn" onClick={handleSave}>
                        <Save size={16} strokeWidth={2} />
                        Save Metadata
                    </button>
                </div>
            </div>
        </div>
    )
}
