import React, { useState } from 'react'
import './ImageUpload.css'

function ImageUpload({ onFileSelect, imagePreview }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP)')
      return
    }
    onFileSelect(file)
  }

  return (
    <div className="upload-container">
      {!imagePreview ? (
        <div 
          className={`upload-section ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <div className="upload-icon">📸</div>
          <div className="upload-text">Click to upload or drag & drop an image</div>
          <div className="upload-hint">Supports JPG, PNG, WebP • Best results with clear, well-lit objects</div>
          <input 
            type="file" 
            id="fileInput" 
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="preview-section">
          <h2>Selected Image:</h2>
          <img src={imagePreview} alt="Preview" className="image-preview" />
        </div>
      )}
    </div>
  )
}

export default ImageUpload
