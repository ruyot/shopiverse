import React, { useState } from 'react'
import './App.css'
import ImageUpload from './components/ImageUpload'
import Viewer3D from './components/Viewer3D'

const SHARP_API_ENDPOINT = 'https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run'
const ENHANCE_API_ENDPOINT = 'http://localhost:5000/enhance'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState(null)
  const [plyData, setPlyData] = useState(null)
  const [useAiEnhancement, setUseAiEnhancement] = useState(true)
  const [enhancedImage, setEnhancedImage] = useState(null)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setError(null)
      setEnhancedImage(null)
      
      // Generate timestamp for filenames
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const baseName = selectedFile.name.split('.')[0]
      
      // Convert image to base64
      const base64Image = await fileToBase64(selectedFile)
      let imageToProcess = base64Image.split(',')[1]
      let enhancedImageData = null

      // Step 1: AI Enhancement (optional)
      if (useAiEnhancement) {
        setStatusMessage('Step 1/2: Enhancing image with AI for better 3D reconstruction...')
        
        try {
          const enhanceResponse = await fetch(ENHANCE_API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image
            })
          })

          if (enhanceResponse.ok) {
            const enhanceResult = await enhanceResponse.json()
            if (enhanceResult.success && enhanceResult.enhanced_image) {
              imageToProcess = enhanceResult.enhanced_image
              enhancedImageData = enhanceResult.enhanced_image
              setEnhancedImage(`data:image/png;base64,${enhanceResult.enhanced_image}`)
              console.log('Image enhanced successfully!')
              
              // Auto-save enhanced image
              downloadFile(
                `data:image/png;base64,${enhanceResult.enhanced_image}`,
                `${baseName}_enhanced_${timestamp}.png`
              )
            } else {
              console.warn('AI enhancement failed, using original image')
            }
          } else {
            console.warn('AI enhancement service unavailable, using original image')
          }
        } catch (enhanceError) {
          console.warn('AI enhancement error, using original image:', enhanceError)
        }
      }
      
      // Step 2: 3D Conversion
      setStatusMessage(useAiEnhancement ? 
        'Step 2/2: Converting to 3D Gaussian splat... (30-60 seconds)' : 
        'Converting to 3D Gaussian splat... (30-60 seconds)')

      const response = await fetch(SHARP_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageToProcess
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate 3D Gaussian splat')
      }

      setStatusMessage('Saving files and rendering 3D viewer...')
      setPlyData(result.ply_base64)
      
      // Auto-save PLY file
      const plyBlob = base64ToBlob(result.ply, 'application/octet-stream')
      const plyUrl = URL.createObjectURL(plyBlob)
      downloadFile(plyUrl, `${baseName}_gaussian_${timestamp}.ply`)
      
      setLoading(false)

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const base64ToBlob = (base64, contentType) => {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType })
  }

  const downloadFile = (url, filename) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Clean up blob URLs
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleReset = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setPlyData(null)
    setError(null)
    setStatusMessage('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌟 Shopiverse</h1>
        <p className="subtitle">3D Gaussian Splat Gallery</p>
      </header>

      <main className="main-content">
        {!plyData ? (
          <>
            <ImageUpload 
              onFileSelect={handleFileSelect}
              imagePreview={imagePreview}
            />

            {imagePreview && (
              <div className="action-section">
                <div className="enhancement-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={useAiEnhancement}
                      onChange={(e) => setUseAiEnhancement(e.target.checked)}
                    />
                    <span>Use AI Enhancement (Recommended for better 3D quality)</span>
                  </label>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={loading || !selectedFile}
                  className="generate-button"
                >
                  {loading ? 'Processing...' : '🚀 Generate 3D Gaussian Splat (Local)'}
                </button>

                {loading && (
                  <div className="status-message">
                    {statusMessage}
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    ❌ {error}
                  </div>
                )}

                {enhancedImage && (
                  <div className="info-box">
                    <h3>✨ AI Enhancement Applied</h3>
                    <p>Your image has been optimized for 3D reconstruction and auto-downloaded.</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Viewer3D 
            plyFiles={[`data:application/octet-stream;base64,${plyData}`]}
            title="Your 3D Gaussian Splat"
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
