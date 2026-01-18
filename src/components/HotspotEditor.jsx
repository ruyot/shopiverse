import { useState, useRef } from 'react'
import { X, Save, Edit2, Image as ImageIcon, Plus, Trash2, Zap, RefreshCw } from 'lucide-react'
import { generateImage } from '../utils/geminiImageGen'
import { getSceneHotspotsAsync } from '../config/hotspots.js'
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

    const addImageToHotspot = async (id, imageUrl) => {
        // Update local state
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, images: [...(h.images || []), imageUrl] } : h
        ))
        
        // Persist to API immediately
        try {
            const response = await fetch(`http://localhost:5000/api/hotspots/${scene.id}/${id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageUrl })
            })
            if (response.ok) {
                console.log(`✅ Image saved to API: ${imageUrl}`)
            }
        } catch (error) {
            console.error('Failed to save image to API:', error)
        }
    }

    const removeImageFromHotspot = async (id, imageIndex) => {
        // Get the image path before removing
        const hotspot = hotspots.find(h => h.id === id)
        const imagePath = hotspot?.images?.[imageIndex]
        
        // Remove from state
        setHotspots(hotspots.map(h => 
            h.id === id ? { ...h, images: h.images.filter((_, i) => i !== imageIndex) } : h
        ))
        
        // Delete from API
        try {
            const response = await fetch(`http://localhost:5000/api/hotspots/${scene.id}/${id}/images/${imageIndex}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                console.log(`✅ Image removed from API`)
            }
        } catch (error) {
            console.error('Failed to remove image from API:', error)
        }
        
        // Delete file from server if it's an uploaded file (starts with / and has underscore pattern)
        if (imagePath && imagePath.startsWith('/') && imagePath.includes('_')) {
            const filename = imagePath.substring(1) // Remove leading /
            try {
                await fetch(`http://localhost:5000/api/upload/${filename}`, {
                    method: 'DELETE'
                })
                console.log(`🗑️ Deleted file: ${filename}`)
            } catch (error) {
                console.error('Failed to delete file from server:', error)
            }
        }
    }

    const deleteHotspot = (id) => {
        setHotspots(hotspots.filter(h => h.id !== id))
        if (editingHotspot === id) {
            setEditingHotspot(null)
        }
    }

    const handleSave = async () => {
        // Debug: print full hotspots array being saved
        console.log('[HotspotEditor] Saving hotspots:', JSON.stringify(hotspots, null, 2));
        await onSave(hotspots)
        // Always reload latest hotspots from backend after save
        const updated = await getSceneHotspotsAsync(scene.id)
        console.log('[HotspotEditor] Reloaded hotspots from backend:', JSON.stringify(updated, null, 2));
        setHotspots(updated)
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
                        hotspot={hotspots.find(h => h.id === editingMetadata.id) || editingMetadata}
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
    const [price, setPrice] = useState(hotspot.price || '')
    const [uploading, setUploading] = useState(false)
    const [imageMode, setImageMode] = useState('upload') // 'upload' or 'generate'
    const [aiPrompt, setAiPrompt] = useState('')
    const [generating, setGenerating] = useState(false)
    const fileInputRef = useRef(null)

    const handleSave = () => {
        onSave({ title, price })
    }

    const handleGenerateImage = async () => {
        if (!aiPrompt.trim()) {
            alert('Please enter a prompt for image generation')
            return
        }

        const apiKey = import.meta.env.VITE_GEMINI_IMAGE_API_KEY
        
        if (!apiKey) {
            alert('AI Image Generation: Please configure Gemini Image API in your .env file.\n\nAdd VITE_GEMINI_IMAGE_API_KEY to enable this feature.')
            return
        }

        setGenerating(true)
        try {
            console.log('🎨 Generating image with Gemini AI...')
            
            // Generate image using Gemini API
            const imageDataUrl = await generateImage(aiPrompt)
            
            // Add the generated image to the hotspot
            onAddImage(imageDataUrl)
            
            // Clear the prompt
            setAiPrompt('')
            
            console.log('✅ Image generated and added successfully!')
        } catch (error) {
            console.error('❌ Error generating image:', error)
            alert('Failed to generate image: ' + error.message)
        } finally {
            setGenerating(false)
        }
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        console.log(`📸 Uploading ${files.length} image(s)...`)
        setUploading(true)

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // Compress the image
                    const compressed = await compressImage(file)
                    // Use the original filename
                    const formData = new FormData()
                    formData.append('file', compressed, file.name)
                    // Upload to backend
                    const response = await fetch('http://localhost:5000/api/upload', {
                        method: 'POST',
                        body: formData
                    })
                    if (!response.ok) {
                        throw new Error('Upload failed')
                    }
                    const result = await response.json()
                    console.log(`✅ Uploaded: ${result.path}`)
                    onAddImage(result.path)
                } catch (error) {
                    console.error('❌ Error uploading image:', error)
                    alert('Failed to upload image: ' + error.message)
                }
            }
        }

        setUploading(false)
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
                        <label>Price</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="$0.00"
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
                        
                        <div className="image-mode-toggle">
                            <button 
                                className={`mode-btn ${imageMode === 'upload' ? 'active' : ''}`}
                                onClick={() => setImageMode('upload')}
                            >
                                <ImageIcon size={14} strokeWidth={2} />
                                Upload
                            </button>
                            <button 
                                className={`mode-btn ${imageMode === 'generate' ? 'active' : ''}`}
                                onClick={() => setImageMode('generate')}
                            >
                                <Zap size={14} strokeWidth={2} />
                                AI Generate
                            </button>
                        </div>

                        {imageMode === 'upload' ? (
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
                        ) : (
                            <div className="ai-generate-section">
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Describe the image you want to generate... (e.g., 'Professional product photo of blue denim jeans on white background')"
                                    className="ai-prompt-input"
                                    rows="3"
                                />
                                <button 
                                    className="ai-generate-btn"
                                    onClick={handleGenerateImage}
                                    disabled={generating || !aiPrompt.trim()}
                                >
                                    {generating ? (
                                        <>
                                            <RefreshCw size={16} strokeWidth={2} className="spinning" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={16} strokeWidth={2} />
                                            Generate Image
                                        </>
                                    )}
                                </button>
                                <p className="ai-hint">
                                    💡 Tip: Be specific about style, lighting, and background for best results
                                </p>
                            </div>
                        )}
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
