/**
 * Gemini AI Image Generation Utility
 * Provides image generation capabilities using Google's Gemini API
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_IMAGE_API_KEY = import.meta.env.VITE_GEMINI_IMAGE_API_KEY || '';

/**
 * Generate an image using Gemini AI
 * @param {string} prompt - The text prompt describing the desired image
 * @param {Object} options - Additional options for image generation
 * @returns {Promise<string>} - Base64 encoded image data with data URL prefix
 */
export async function generateImage(prompt, options = {}) {
    if (!GEMINI_IMAGE_API_KEY) {
        throw new Error('Gemini Image API key not configured. Please add VITE_GEMINI_IMAGE_API_KEY to your .env file');
    }

    console.log('🎨 Generating image with Gemini AI...');
    console.log('📝 Prompt:', prompt);

    const ai = new GoogleGenAI({
        apiKey: GEMINI_IMAGE_API_KEY
    });

    // Create a strong system-level instruction
    const systemPrompt = `You are a product photography AI. Generate ONLY images of products, items, and objects.

STRICT RULES:
- NO people, NO humans, NO models, NO body parts (hands, feet, etc.)
- ONLY show the product/item itself
- Product photography style: clean, professional, well-lit
- White background or simple neutral background
- Focus on the product alone
- Still life photography only
- Flat lay or studio product shot style

Generate the product image now.`;

    const fullPrompt = `${systemPrompt}

Product to photograph: ${prompt}

Remember: ONLY THE ITEM ITSELF. NO PEOPLE. NO HUMANS. NO MODELS.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{
            role: "user",
            parts: [{
                text: fullPrompt
            }]
        }],
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                const dataUrl = `data:${mimeType};base64,${imageData}`;
                console.log('✅ Image generated successfully');
                
                if (options.autoSave) {
                    saveImageToClient(dataUrl, prompt);
                }
                
                return dataUrl;
            }
        }
    }

    throw new Error('No image data in response');
}

/**
 * Save image data URL to localStorage
 * @param {string} dataUrl - The image data URL
 * @param {string} prompt - The prompt used to generate the image
 * @returns {string} - The key used to store the image
 */
export function saveImageToClient(dataUrl, prompt) {
    const timestamp = Date.now();
    const key = `generated_image_${timestamp}`;
    
    const imageData = {
        dataUrl,
        prompt,
        timestamp,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(imageData));
    
    // Maintain a list of all saved images
    const savedImagesList = getSavedImagesList();
    savedImagesList.push(key);
    localStorage.setItem('saved_images_list', JSON.stringify(savedImagesList));
    
    console.log('💾 Image saved to localStorage with key:', key);
    return key;
}

/**
 * Get a saved image from localStorage
 * @param {string} key - The key of the saved image
 * @returns {Object|null} - The saved image data or null if not found
 */
export function getSavedImage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Get list of all saved image keys
 * @returns {Array<string>} - Array of saved image keys
 */
export function getSavedImagesList() {
    const list = localStorage.getItem('saved_images_list');
    return list ? JSON.parse(list) : [];
}

/**
 * Get all saved images
 * @returns {Array<Object>} - Array of saved image objects
 */
export function getAllSavedImages() {
    const keys = getSavedImagesList();
    return keys.map(key => getSavedImage(key)).filter(Boolean);
}

/**
 * Delete a saved image
 * @param {string} key - The key of the image to delete
 * @returns {boolean} - True if deleted successfully
 */
export function deleteSavedImage(key) {
    localStorage.removeItem(key);
    
    const savedImagesList = getSavedImagesList();
    const updatedList = savedImagesList.filter(k => k !== key);
    localStorage.setItem('saved_images_list', JSON.stringify(updatedList));
    
    console.log('🗑️ Image deleted:', key);
    return true;
}

/**
 * Clear all saved images
 * @returns {boolean} - True if cleared successfully
 */
export function clearAllSavedImages() {
    const keys = getSavedImagesList();
    keys.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('saved_images_list');
    console.log('🗑️ All saved images cleared');
    return true;
}

/**
 * Download an image to the user's device
 * @param {string} dataUrl - The image data URL
 * @param {string} filename - The filename for the download
 */
export function downloadImage(dataUrl, filename = 'generated-image.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('📥 Image downloaded:', filename);
}

/**
 * Check if Gemini API is configured
 * @returns {boolean}
 */
export function isGeminiConfigured() {
    return !!GEMINI_IMAGE_API_KEY;
}

/**
 * Get suggested prompts for different contexts
 * @param {string} context - The context type ('product', 'background', 'hotspot')
 * @returns {Array<string>} - Array of prompt suggestions
 */
export function getImagePromptSuggestions(context) {
    const suggestions = {
        'product': [
            'Professional product photography on white background',
            'Lifestyle product shot in modern setting',
            'Close-up detail shot with soft lighting',
            'Product display on clean surface',
            'Premium product showcase with elegant lighting',
            'Minimalist product display on clean surface'
        ],
        'background': [
            'Modern retail store interior with warm lighting',
            'Minimalist boutique with clean design',
            'Luxury shopping space with marble floors',
            'Contemporary store with natural light',
            'Elegant shopping environment with soft colors',
            'Professional retail space with featured displays'
        ],
        'hotspot': [
            'Eye-catching product display',
            'Featured item with spotlight',
            'Premium product showcase',
            'Highlighted merchandise presentation',
            'Attention-grabbing product arrangement',
            'Featured collection with dramatic lighting'
        ]
    };

    return suggestions[context] || suggestions['product'];
}

/**
 * Validate and enhance a user's image prompt
 * @param {string} prompt - The user's prompt
 * @returns {string} - Enhanced prompt
 */
export function enhancePrompt(prompt) {
    if (!prompt || prompt.trim().length === 0) {
        return 'Professional product photography';
    }
    
    const qualityWords = ['professional', 'high-quality', 'detailed', 'premium', 'elegant'];
    const hasQuality = qualityWords.some(word => prompt.toLowerCase().includes(word));
    
    if (!hasQuality) {
        return `Professional ${prompt}`;
    }
    
    return prompt;
}