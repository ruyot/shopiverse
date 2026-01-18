const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_IMAGE_API_KEY || ''

export function isGeminiInsightsConfigured() {
  return !!GEMINI_API_KEY
}

function stripCodeFence(text) {
  const trimmed = text.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
}

export async function generateInsights(analyticsPayload) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  const systemPrompt = `You are an ecommerce analytics assistant.
Return ONLY valid JSON (no markdown) with this schema:
{
  "summary": "1-2 sentence overview",
  "insights": ["3-6 short bullets"],
  "risks": ["2-5 short bullets"],
  "opportunities": ["2-5 short bullets"],
  "nextSteps": ["2-5 short bullets"]
}
Keep each bullet under 16 words. Use plain ASCII.`

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
    },
    {
      role: 'user',
      parts: [{ text: JSON.stringify(analyticsPayload) }]
    }
  ]

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({ contents })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = stripCodeFence(text)

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    return {
      summary: '',
      insights: [],
      risks: [],
      opportunities: [],
      nextSteps: [],
      raw: cleaned
    }
  }
}
