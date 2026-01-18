import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Gemini configuration
const GEMINI_API_KEY = process.env.VITE_GEMINI_IMAGE_API_KEY

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

// Chatbot endpoint using Gemini
app.post('/chat', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            res.status(500).send('Missing GEMINI API key')
            return
        }

        const { message } = req.body

        // System prompt for Lobo
        const systemPrompt = `You are Lobo, a helpful shopping assistant for Shopiverse, a 3D virtual store. 
You help customers find products, check availability, and answer questions about items in the store.

Guidelines:
- Be friendly, helpful, and concise
- When customers ask about products, help them navigate the store
- Provide product recommendations
- Keep responses brief and conversational`

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`
                        }]
                    }]
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response."

        // Stream response character by character for smooth UX
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        
        for (let i = 0; i < aiResponse.length; i++) {
            res.write(aiResponse[i])
            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 10))
        }

        res.end()
    } catch (e) {
        console.error('Chat error:', e)
        res.status(500).send(String(e?.message || e))
    }
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
})
