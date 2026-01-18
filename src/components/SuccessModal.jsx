import { CheckCircle, X } from 'lucide-react'
import './SuccessModal.css'

/**
 * SuccessModal Component
 * Shows order confirmation after successful payment
 */
export function SuccessModal({ isOpen, onClose, orderDetails }) {
    if (!isOpen || !orderDetails) return null

    return (
        <>
            {/* Backdrop */}
            <div className="success-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="success-modal">
                {/* Success Icon */}
                <div className="success-icon">
                    <CheckCircle size={64} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="success-content">
                    <h2>Order Confirmed!</h2>
                    <p className="success-message">
                        Thank you for your purchase. Your order has been successfully processed.
                    </p>

                    {/* Order Details */}
                    <div className="success-details">
                        <div className="success-detail-row">
                            <span>Order Number</span>
                            <strong>{orderDetails.orderNumber}</strong>
                        </div>
                        <div className="success-detail-row">
                            <span>Email</span>
                            <strong>{orderDetails.customerEmail}</strong>
                        </div>
                        <div className="success-detail-row">
                            <span>Total Paid</span>
                            <strong className="success-total">${orderDetails.total.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Items Purchased */}
                    <div className="success-items">
                        <h3>Items Purchased</h3>
                        {orderDetails.items.map((item) => (
                            <div key={item.id} className="success-item">
                                <span>{item.title} × {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Confirmation Message */}
                    <p className="success-confirmation">
                        A confirmation email has been sent to <strong>{orderDetails.customerEmail}</strong>
                    </p>
                </div>

                {/* Close Button */}
                <button className="success-close-btn" onClick={onClose}>
                    Continue Shopping
                </button>

                {/* X Button */}
                <button className="success-x-btn" onClick={onClose}>
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>
        </>
    )
}
