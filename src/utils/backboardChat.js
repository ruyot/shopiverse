const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_IMAGE_API_KEY;

let conversationHistory = [];

export async function sendChatMessage(message, onChunk) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Add user message to history
  conversationHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  // System prompt
  const systemPrompt = `You are Lobo, a friendly shopping assistant. Keep all responses under 2 sentences. Be helpful but extremely brief.`;

  // Build contents for API
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
    },
    ...conversationHistory
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: contents
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // Add assistant response to history
    conversationHistory.push({
      role: 'model',
      parts: [{ text: aiResponse }]
    });

    // Stream response character by character
    for (let i = 0; i < aiResponse.length; i++) {
      onChunk?.(aiResponse[i]);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return aiResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export function resetThread() {
  conversationHistory = [];
}

export async function loadInventory() {
  try {
    const response = await fetch('http://localhost:5000/api/hotspots')
    if (!response.ok) {
      throw new Error('Failed to load inventory')
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading inventory:', error)
    return {}
  }
}
