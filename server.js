import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors())
app.use(express.json())

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cartItems } = req.body

        // Convert cart items to Stripe line items
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: item.image ? [item.image.startsWith('http') ? item.image : `http://localhost:5173${item.image}`] : [],
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }))

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:5173/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/?canceled=true`,
        })

        res.json({ url: session.url })
    } catch (error) {
        console.error('Error creating checkout session:', error)
        res.status(500).json({ error: error.message })
    }
})

// Retrieve session details after payment
app.get('/session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
        res.json({ session })
    } catch (error) {
        console.error('Error retrieving session:', error)
        res.status(500).json({ error: error.message })
    }
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
})
