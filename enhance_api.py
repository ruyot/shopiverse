"""
Gemini AI Image Enhancement API

This API enhances images for optimal 3D Gaussian splat reconstruction.
It uses Google's Gemini AI to optimize composition, depth, and lighting.

Usage:
    python enhance_api.py
    
Then send POST requests to http://localhost:5000/enhance
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import base64
import os
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# System prompt optimized for 3D reconstruction
DEPTH_SYSTEM_PROMPT = """Enhance this image for optimal 3D reconstruction. The output will be converted into an interactive 3D Gaussian splat scene.

CRITICAL ENHANCEMENTS:

COMPOSITION:
- Center the main subject with breathing room on all edges
- Show the complete subject - never crop parts
- Use a slight 3/4 overhead angle for better depth perception
- Ensure the scene looks coherent from all viewing angles

DEPTH & STRUCTURE:
- Create clear separation between foreground, middle ground, and background
- Add overlapping elements to reinforce spatial relationships
- Include objects at varying distances
- Avoid large flat surfaces facing the camera directly

MATERIALS & SURFACES:
- Use solid, opaque materials with rich surface detail
- Add fine textures that reward close inspection
- Prefer matte and semi-matte surfaces
- Enhance surface details and micro-textures

LIGHTING:
- Apply soft, diffused lighting (like overcast daylight)
- Avoid harsh directional shadows
- Ensure even illumination across the scene
- Remove any extreme highlights or dark shadows

MUST REMOVE/AVOID:
- Text, signs, logos, watermarks, or writing
- Transparent materials (glass, water, ice)
- Highly reflective surfaces (mirrors, chrome)
- Volumetric effects (smoke, fog, fire, clouds)
- Motion blur or depth-of-field blur
- Over-saturated or neon colors
- Heavy HDR effects or artificial glow

OUTPUT: Return an enhanced version of this image optimized for 3D reconstruction, maintaining the original subject and scene but improving depth cues, composition, and material properties."""


@app.route('/enhance', methods=['POST'])
def enhance_image():
    """
    Enhance an image for 3D reconstruction using Gemini AI.
    
    Request body:
        {
            "image": "<base64-encoded image data>"
        }
        
    Response:
        {
            "success": true,
            "enhanced_image": "<base64-encoded enhanced image>",
            "message": "Image enhanced successfully"
        }
    """
    try:
        # Check for Gemini API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'GEMINI_API_KEY not configured',
                'setup': 'Get your API key from https://aistudio.google.com/apikey'
            }), 500
        
        # Parse request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        image_base64 = data['image']
        
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode image
        image_bytes = base64.b64decode(image_base64)
        
        # Determine image format
        img = Image.open(BytesIO(image_bytes))
        img_format = img.format or 'PNG'
        mime_type = f'image/{img_format.lower()}'
        
        print(f"Enhancing image with Gemini AI ({img.size[0]}x{img.size[1]}, {img_format})...")
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Use Gemini 2.0 Flash for image editing
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Create the request with image and prompt
        response = model.generate_content([
            {
                'mime_type': mime_type,
                'data': image_base64
            },
            DEPTH_SYSTEM_PROMPT
        ])
        
        # Extract enhanced image from response
        if not response.parts:
            return jsonify({
                'success': False,
                'error': 'No response from Gemini AI'
            }), 500
        
        # Find the image part in response
        enhanced_image_data = None
        for part in response.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                enhanced_image_data = part.inline_data.data
                break
        
        if not enhanced_image_data:
            # If no image in response, return original with warning
            print("Warning: Gemini didn't return an enhanced image, using original")
            return jsonify({
                'success': True,
                'enhanced_image': image_base64,
                'message': 'Image enhancement not available, using original',
                'warning': 'Gemini API did not return an enhanced image'
            })
        
        print("Image enhanced successfully!")
        
        return jsonify({
            'success': True,
            'enhanced_image': enhanced_image_data,
            'message': 'Image enhanced for 3D reconstruction'
        })
        
    except Exception as e:
        print(f"Enhancement error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    api_key = os.getenv('GEMINI_API_KEY')
    return jsonify({
        'status': 'ok',
        'service': 'Gemini AI Image Enhancement',
        'api_key_configured': bool(api_key)
    })


if __name__ == '__main__':
    print("=" * 60)
    print("Gemini AI Image Enhancement API")
    print("=" * 60)
    print("Starting server on http://localhost:5000")
    print()
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("⚠️  WARNING: GEMINI_API_KEY not set!")
        print("   Get your API key: https://aistudio.google.com/apikey")
        print("   Set it: export GEMINI_API_KEY='your-key-here'")
        print()
    else:
        print("✓ GEMINI_API_KEY configured")
        print()
    
    print("Endpoints:")
    print("  POST /enhance - Enhance image for 3D reconstruction")
    print("  GET  /health  - Health check")
    print("=" * 60)
    print()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
