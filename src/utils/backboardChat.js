const BACKBOARD_API_KEY = import.meta.env.VITE_BACKBOARD_API_KEY;
const BACKBOARD_BASE_URL = 'https://app.backboard.io/api';

let assistantId = null;
let threadId = null;
let currentInventory = {};

export async function sendChatMessage(message, onChunk, inventory = {}) {
  if (!BACKBOARD_API_KEY) {
    throw new Error('Backboard API key not configured');
  }

  console.log('[Chat] Using Backboard API');

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

  const systemPrompt = `You are Lobo, a professional shopping assistant. Use formal, polite language. Keep responses to 1 brief sentence.

CRITICAL RULE - YOU MUST FOLLOW THIS EXACTLY:
When user asks about ANY product (wallet, shirt, shoes, etc.), you MUST include this EXACT format at the end:
PRODUCTS: ["exact-item-id"]

Example response format:
"I recommend the Blue Wallet.
PRODUCTS: ["item-l2-1"]"

NEVER say "ID: item-l2-1" or "with ID: item-l2-1" - ONLY use the PRODUCTS: format above.
Select the SINGLE BEST matching product ID from the available products list.`;

  const inventoryBlock = inventoryText || 'None listed.';
  const userContent = `Available Products:
${inventoryBlock}

User: ${message}`;

  try {
    await ensureAssistant(systemPrompt);
    await ensureThread();

    const formData = new FormData();
    formData.append('content', userContent);
    formData.append('stream', 'false');
    formData.append('memory', 'off');

    const response = await fetch(`${BACKBOARD_BASE_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'X-API-Key': BACKBOARD_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backboard API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.content || data.message || "I'm sorry, I couldn't generate a response.";

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
    console.error('Backboard API error:', error);
    throw error;
  }
}

export function resetThread() {
  threadId = null;
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

async function ensureAssistant(systemPrompt) {
  if (assistantId) return;

  const response = await fetch(`${BACKBOARD_BASE_URL}/assistants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BACKBOARD_API_KEY
    },
    body: JSON.stringify({
      name: 'Shopiverse Assistant',
      system_prompt: systemPrompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backboard API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  assistantId = data.assistant_id || data.assistantId;
  if (!assistantId) {
    throw new Error('Backboard API error: missing assistant_id');
  }
}

async function ensureThread() {
  if (threadId) return;
  if (!assistantId) {
    throw new Error('Backboard API error: assistant not initialized');
  }

  const response = await fetch(`${BACKBOARD_BASE_URL}/assistants/${assistantId}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BACKBOARD_API_KEY
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backboard API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  threadId = data.thread_id || data.threadId;
  if (!threadId) {
    throw new Error('Backboard API error: missing thread_id');
  }
}

