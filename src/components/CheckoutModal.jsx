import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { X, CreditCard, Lock } from 'lucide-react'
import './CheckoutModal.css'

/**
 * CheckoutModal Component
 * Embedded Stripe Elements checkout form
 * Handles card input and payment processing in test mode
 */
export function CheckoutModal({ isOpen, onClose, cartItems, total, onSuccess }) {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsProcessing(true)
        setError(null)

        const cardElement = elements.getElement(CardElement)

        try {
            // Create payment method
            const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                },
            })

            if (stripeError) {
                setError(stripeError.message)
                setIsProcessing(false)
                return
            }

            // In test mode, we simulate successful payment
            // In production, you'd send paymentMethod.id to your backend
            console.log('Payment Method Created:', paymentMethod)

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Success!
            const orderDetails = {
                orderNumber: `ORD-${Date.now()}`,
                paymentMethodId: paymentMethod.id,
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                items: cartItems,
                total: total,
                timestamp: new Date().toISOString()
            }

            onSuccess(orderDetails)
            setIsProcessing(false)
        } catch (err) {
            setError('Payment failed. Please try again.')
            setIsProcessing(false)
            console.error('Payment error:', err)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div className="checkout-backdrop" onClick={!isProcessing ? onClose : undefined} />

            {/* Modal */}
            <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="checkout-header">
                    <div className="checkout-header-content">
                        <Lock size={20} strokeWidth={2.5} />
                        <h2>Secure Checkout</h2>
                    </div>
                    <button 
                        className="checkout-close-btn" 
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="checkout-form">
                    {/* Customer Info */}
                    <div className="checkout-section">
                        <h3>Contact Information</h3>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={customerInfo.name}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                required
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                required
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="checkout-section">
                        <h3>Payment Details</h3>
                        <div className="form-group">
                            <label>
                                <CreditCard size={16} strokeWidth={2} />
                                Card Information
                            </label>
                            <div className="card-element-wrapper">
                                <CardElement
                                    options={{
                                        style: {
                                            base: {
                                                fontSize: '16px',
                                                color: 'rgba(255, 255, 255, 0.95)',
                                                '::placeholder': {
                                                    color: 'rgba(255, 255, 255, 0.4)',
                                                },
                                                iconColor: 'rgba(255, 255, 255, 0.7)',
                                            },
                                            invalid: {
                                                color: '#ff6b6b',
                                                iconColor: '#ff6b6b',
                                            },
                                        },
                                    }}
                                />
                            </div>
                            <p className="test-card-hint">
                                Test card: 4242 4242 4242 4242 | Any future date | Any CVC
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="checkout-section checkout-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-items">
                            {cartItems.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <span>{item.title} × {item.quantity}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-total">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="checkout-error">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="checkout-submit-btn"
                        disabled={!stripe || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <span className="processing-spinner"></span>
                                Processing...
                            </>
                        ) : (
                            <>Pay ${total.toFixed(2)}</>
                        )}
                    </button>
                </form>
            </div>
        </>
    )
}
