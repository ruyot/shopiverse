import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import './ProductDetail.css'

/**
 * ProductDetail Component
 * Glassmorphism modal showing product metadata with image carousel
 */
export function ProductDetail({ hotspot, onClose }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const images = hotspot.images || []
    const hasImages = images.length > 0

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <div className="product-detail-overlay" onClick={onClose}>
            <div className="product-detail-glass" onClick={(e) => e.stopPropagation()}>
                <button className="product-detail-close" onClick={onClose}>
                    <X size={20} strokeWidth={2} />
                </button>

                <div className="product-detail-content">
                    {hasImages && (
                        <div className="product-carousel">
                            <img
                                src={images[currentImageIndex]}
                                alt={hotspot.title || hotspot.label}
                                className="product-carousel-image"
                            />
                            
                            {images.length > 1 && (
                                <>
                                    <button className="carousel-btn carousel-prev" onClick={prevImage}>
                                        <ChevronLeft size={24} strokeWidth={2} />
                                    </button>
                                    <button className="carousel-btn carousel-next" onClick={nextImage}>
                                        <ChevronRight size={24} strokeWidth={2} />
                                    </button>
                                    
                                    <div className="carousel-indicators">
                                        {images.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
                                                onClick={() => setCurrentImageIndex(index)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="product-info">
                        <h2 className="product-title">
                            {hotspot.title || hotspot.label || 'Untitled Product'}
                        </h2>
                        
                        {hotspot.price && (
                            <div className="product-price">{hotspot.price}</div>
                        )}
                        
                        {hotspot.label && hotspot.title !== hotspot.label && (
                            <p className="product-label">{hotspot.label}</p>
                        )}

                        {!hasImages && (
                            <div className="product-no-images">
                                No product images available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
