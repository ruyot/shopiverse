const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_IMAGE_API_KEY;

let conversationHistory = [];
let currentInventory = {};

export async function sendChatMessage(message, onChunk, inventory = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Store inventory for product extraction
  currentInventory = inventory;

  // Build inventory context for LLM
  const inventoryText = Object.entries(inventory)
    .map(([scene, items]) => {
      if (!items || items.length === 0) return '';
      return `${scene}: ${items.map(item => `${item.title || item.label} (ID: ${item.id})`).join(', ')}`;
    })
    .filter(Boolean)
    .join('\n');

  // Add user message to history
  conversationHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  // System prompt with inventory and JSON instruction
  const systemPrompt = `You are Lobo, a friendly shopping assistant for Shopiverse. Keep responses under 2 sentences.

Available Products:
${inventoryText}

IMPORTANT: If the user asks about products, end your response with a JSON block like this:
PRODUCTS: ["item-id-1", "item-id-2"]

Only include product IDs that are relevant to the user's question.`;

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

    // Extract product IDs from response
    const productIds = extractProductIds(aiResponse);
    const products = productIds.map(id => findProductById(id, currentInventory)).filter(Boolean);

    // Remove PRODUCTS: line from display text
    let displayText = aiResponse.replace(/PRODUCTS:\s*\[.*?\]/g, '').trim();

    // Stream response character by character
    for (let i = 0; i < displayText.length; i++) {
      onChunk?.(displayText[i]);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return { text: displayText, products };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export function resetThread() {
  conversationHistory = [];
}

// Extract product IDs from LLM response
function extractProductIds(text) {
  const match = text.match(/PRODUCTS:\s*\[(.*?)\]/);
  if (!match) return [];
  
  try {
    const idsString = match[1];
    return idsString.split(',').map(id => id.trim().replace(/['"]/g, '')).filter(Boolean);
  } catch (e) {
    return [];
  }
}

// Find product by ID in inventory
function findProductById(productId, inventory) {
  for (const [sceneName, items] of Object.entries(inventory)) {
    if (!items || items.length === 0) continue;
    
    const product = items.find(item => item.id === productId);
    if (product) {
      return {
        ...product,
        scene: sceneName,
        sceneName: formatSceneName(sceneName)
      };
    }
  }
  return null;
}

function formatSceneName(sceneName) {
  return sceneName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
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

