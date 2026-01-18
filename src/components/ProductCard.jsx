import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import './ProductCard.css'

/**
 * ProductCard Component
 * Floating glassmorphism card that appears next to hotspots
 * Features a connecting triangle and image carousel
 */
export function ProductCard({ hotspot, position, onClose, onAddToCart }) {
    const images = hotspot.images || []
    const hasImage = images.length > 0
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Determine if card should appear on left or right of hotspot
    const isLeftSide = position.x > 50
    
    // Calculate triangle position - positioned to touch the card
    const triangleStyle = {
        left: isLeftSide ? `calc(${position.x}% - 40px)` : `calc(${position.x}% + 12px)`,
        top: `${position.y}%`,
        transform: 'translateY(-50%)',
    }

    const nextImage = (e) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = (e) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const handleAddToCart = (e) => {
        e.stopPropagation()
        if (onAddToCart) {
            onAddToCart(hotspot)
            // Close the card after adding to cart for better UX
            setTimeout(() => {
                onClose()
            }, 300)
        }
    }

    return (
        <>
            {/* Invisible overlay to detect clicks outside */}
            <div className="product-card-backdrop" onClick={onClose} />
            
            {/* Connecting triangle */}
            <div 
                className={`card-connector-triangle ${isLeftSide ? 'point-right' : 'point-left'}`} 
                style={triangleStyle}
            />
            
            <div 
                className={`product-card ${isLeftSide ? 'left-side' : 'right-side'}`}
                style={{
                    left: isLeftSide ? `calc(${position.x}% - 250px)` : `calc(${position.x}% + 50px)`,
                    top: `${position.y}%`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Triangle pointer */}
                <div className={`card-pointer ${isLeftSide ? 'pointer-right' : 'pointer-left'}`} />
                
                {/* Close button */}
                <button className="card-close" onClick={onClose}>
                    <X size={14} strokeWidth={2.5} />
                </button>

                {/* Product image carousel */}
                {hasImage && (
                    <div className="card-image-container">
                        <img
                            src={images[currentImageIndex]}
                            alt={hotspot.title || hotspot.label}
                            className="card-image"
                        />
                        
                        {images.length > 1 && (
                            <>
                                <button className="card-carousel-btn card-carousel-prev" onClick={prevImage}>
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                <button className="card-carousel-btn card-carousel-next" onClick={nextImage}>
                                    <ChevronRight size={16} strokeWidth={2.5} />
                                </button>
                                
                                <div className="card-carousel-dots">
                                    {images.map((_, index) => (
                                        <span 
                                            key={index} 
                                            className={`card-carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Product info */}
                <div className="card-info">
                    <h3 className="card-title">
                        {hotspot.title || hotspot.label || 'Product'}
                    </h3>
                    
                    {hotspot.price && (
                        <div className="card-price">{hotspot.price}</div>
                    )}
                    
                    {!hotspot.price && (
                        <div className="card-price">$49.99</div>
                    )}
                    
                    {/* Add to Cart Button */}
                    <button className="card-add-to-cart" onClick={handleAddToCart}>
                        <ShoppingCart size={16} strokeWidth={2.5} />
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </>
    )
}
