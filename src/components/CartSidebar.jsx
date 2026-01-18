import { X, Plus, Minus, Trash2 } from 'lucide-react'
import './CartSidebar.css'

/**
 * CartSidebar Component
 * Sliding sidebar that displays cart items with quantity controls
 * Shows subtotal, tax, and total calculations
 */
export function CartSidebar({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) {
    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.13 // 13% tax
    const total = subtotal + tax

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="cart-backdrop" onClick={onClose} />
            )}

            {/* Sidebar */}
            <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="cart-header">
                    <h2>Shopping Cart</h2>
                    <button className="cart-close-btn" onClick={onClose}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <p>Your cart is empty</p>
                            <span>Add items to get started!</span>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                {/* Item Image */}
                                {item.image && (
                                    <div className="cart-item-image">
                                        <img src={item.image} alt={item.title} />
                                    </div>
                                )}

                                {/* Item Details */}
                                <div className="cart-item-details">
                                    <h3 className="cart-item-title">{item.title}</h3>
                                    <p className="cart-item-price">${item.price.toFixed(2)}</p>

                                    {/* Quantity Controls */}
                                    <div className="cart-item-quantity">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={14} strokeWidth={2.5} />
                                        </button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    className="cart-item-remove"
                                    onClick={() => onRemoveItem(item.id)}
                                    aria-label="Remove item"
                                >
                                    <Trash2 size={18} strokeWidth={2} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer with Totals */}
                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-totals">
                            <div className="cart-total-row">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="cart-total-row">
                                <span>Tax (13%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="cart-total-row cart-total-final">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            className="cart-checkout-btn" 
                            onClick={onCheckout}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
