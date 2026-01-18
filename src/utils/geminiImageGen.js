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

    try {
        console.log('🎨 Generating image with Gemini AI...');
        console.log('📝 Prompt:', prompt);

        const ai = new GoogleGenAI({
            apiKey: GEMINI_IMAGE_API_KEY
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-exp", // Updated model name
            contents: prompt,
        });

        // Extract image data from response
        // Note: For text-to-image with Gemini 2.0 or Imagen, the response structure might differ.
        // This assumes the standard content generation API usage.

        // If the model returns text containing a URL or base64, we'd parse it.
        // But if using a specific Image Generation method, we'd use that.
        // For now, assuming standard generation.

        // Let's log the response to help debug if format changes
        console.log('Gemini Response:', response);

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const imageData = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const dataUrl = `data:${mimeType};base64,${imageData}`;
                    return dataUrl;
                }
            }
        }

        throw new Error('No image data found in response');

    } catch (error) {
        console.error('❌ Error generating image:', error);
        throw error;
    }
}

export function isGeminiConfigured() {
    return !!GEMINI_IMAGE_API_KEY;
}

export function getImagePromptSuggestions(context) {
    const suggestions = {
        'product': [
            'Professional product photography on white background',
            'Lifestyle product shot in modern setting',
            'Close-up detail shot with soft lighting',
            'Product in use by happy customer'
        ],
        'background': [
            'Modern retail store interior with warm lighting',
            'Minimalist boutique with clean design',
            'Luxury shopping space with marble floors',
            'Contemporary store with natural light'
        ],
        'hotspot': [
            'Eye-catching product display',
            'Featured item with spotlight',
            'Premium product showcase',
            'Highlighted merchandise presentation'
        ]
    };

    return suggestions[context] || suggestions['product'];
}
