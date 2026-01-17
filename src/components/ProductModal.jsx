import { useState } from 'react'
import './ProductModal.css'

export function ProductModal({ product, onClose }) {
    const [selectedVariant, setSelectedVariant] = useState(
        product.variants.find(v => v.inStock) || product.variants[0]
    )

    const handleCheckout = () => {
        // Build checkout URL with selected variant
        const checkoutUrl = `${product.checkoutUrl}&variant=${encodeURIComponent(
            `${selectedVariant.size}-${selectedVariant.color}`
        )}`

        // In production, this would redirect to actual checkout
        console.log('Checkout:', checkoutUrl)
        alert(`Redirecting to checkout for:\n${product.name}\nSize: ${selectedVariant.size}\nColor: ${selectedVariant.color}`)
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Group variants by attribute
    const sizes = [...new Set(product.variants.map(v => v.size))]
    const colors = [...new Set(product.variants.map(v => v.color))]

    const isVariantAvailable = (size, color) => {
        return product.variants.some(v => v.size === size && v.color === color && v.inStock)
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                {/* Close button */}
                <button className="modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="modal-body">
                    {/* Product image */}
                    <div className="product-image">
                        <div className="image-placeholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            <span>Product Image</span>
                        </div>
                    </div>

                    {/* Product info */}
                    <div className="product-info">
                        <span className="product-category">{product.category}</span>
                        <h2 className="product-name">{product.name}</h2>
                        <p className="product-price">
                            {product.currency === 'USD' ? '$' : product.currency}
                            {product.price.toFixed(2)}
                        </p>
                        <p className="product-description">{product.description}</p>

                        {/* Size selector */}
                        {sizes.length > 1 && (
                            <div className="variant-group">
                                <label className="variant-label">Size</label>
                                <div className="variant-options">
                                    {sizes.map(size => {
                                        const available = product.variants.some(
                                            v => v.size === size && v.color === selectedVariant.color && v.inStock
                                        )
                                        const isSelected = selectedVariant.size === size

                                        return (
                                            <button
                                                key={size}
                                                className={`variant-btn ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                                onClick={() => {
                                                    if (available) {
                                                        const variant = product.variants.find(
                                                            v => v.size === size && v.color === selectedVariant.color && v.inStock
                                                        )
                                                        if (variant) setSelectedVariant(variant)
                                                    }
                                                }}
                                                disabled={!available}
                                            >
                                                {size}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Color selector */}
                        {colors.length > 1 && (
                            <div className="variant-group">
                                <label className="variant-label">Color</label>
                                <div className="variant-options">
                                    {colors.map(color => {
                                        const available = product.variants.some(
                                            v => v.color === color && v.size === selectedVariant.size && v.inStock
                                        )
                                        const isSelected = selectedVariant.color === color

                                        return (
                                            <button
                                                key={color}
                                                className={`variant-btn ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                                                onClick={() => {
                                                    if (available) {
                                                        const variant = product.variants.find(
                                                            v => v.color === color && v.size === selectedVariant.size && v.inStock
                                                        )
                                                        if (variant) setSelectedVariant(variant)
                                                    }
                                                }}
                                                disabled={!available}
                                            >
                                                {color}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Selected variant summary */}
                        <div className="selected-variant">
                            Selected: {selectedVariant.size} / {selectedVariant.color}
                            {!selectedVariant.inStock && <span className="out-of-stock"> (Out of Stock)</span>}
                        </div>

                        {/* Checkout button */}
                        <button
                            className="btn checkout-btn"
                            onClick={handleCheckout}
                            disabled={!selectedVariant.inStock}
                        >
                            {selectedVariant.inStock ? 'Buy Now' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
