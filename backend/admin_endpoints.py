"""
Admin API Endpoints
Handles product/hotspot data management for the Shopiverse admin panel.
Allows changes made in the admin panel to persist across all users.

Usage:
    # Run with Flask
    pip install flask flask-cors
    python admin_endpoints.py

    # Or run with uvicorn (FastAPI)
    pip install fastapi uvicorn
    uvicorn admin_endpoints:app --reload --port 5000
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Path to store hotspots data
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
HOTSPOTS_FILE = os.path.join(DATA_DIR, 'hotspots.json')

# Default hotspots (fallback if no saved data)
DEFAULT_HOTSPOTS = {
    "storeP1Left": [
        {"id": "jeans-1", "x": 38, "y": 42, "label": "Classic Denim", "title": "Classic Denim Jeans", "images": []},
        {"id": "jeans-2", "x": 28, "y": 42, "label": "Classic Denim", "title": "Classic Denim Jeans", "images": []},
        {"id": "jeans-3", "x": 28, "y": 65, "label": "Classic Denim", "title": "Classic Denim Jeans", "images": []},
        {"id": "jeans-4", "x": 39, "y": 64, "label": "Classic Denim", "title": "Classic Denim Jeans", "images": []}
    ],
    "storeP1Right": [
        {"id": "item-r1-1", "x": 30, "y": 35, "label": "Wallet", "title": "Wallet", "images": ["/wallet-black.png", "/wallet-dark-brown.jpg", "/wallet-grey.jpg", "/wallet-light-brown.jpg"]},
        {"id": "item-r1-2", "x": 50, "y": 45, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "item-r1-3", "x": 70, "y": 40, "label": "Product 3", "title": "Product 3", "images": []}
    ],
    "storeP2Left": [
        {"id": "item-l2-1", "x": 21, "y": 45, "label": "Wallet", "title": "Wallet", "images": ["/wallet-black.png", "/wallet-dark-brown.jpg", "/wallet-grey.jpg", "/wallet-light-brown.jpg"]},
        {"id": "item-l2-2", "x": 30, "y": 35, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "item-l2-3", "x": 80, "y": 55, "label": "Product 3", "title": "Product 3", "images": []}
    ],
    "storeP2Right": [
        {"id": "item-r2-1", "x": 39, "y": 50, "label": "Wallet", "title": "Wallet", "images": ["/wallet-black.png", "/wallet-dark-brown.jpg", "/wallet-grey.jpg", "/wallet-light-brown.jpg"]},
        {"id": "item-r2-2", "x": 57, "y": 46, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "item-r2-3", "x": 68, "y": 42, "label": "Product 3", "title": "Product 3", "images": []}
    ]
}


def ensure_data_dir():
    """Create data directory if it doesn't exist"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)


def load_hotspots():
    """Load hotspots from file or return defaults"""
    ensure_data_dir()
    if os.path.exists(HOTSPOTS_FILE):
        try:
            with open(HOTSPOTS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return DEFAULT_HOTSPOTS
    return DEFAULT_HOTSPOTS


def save_hotspots(hotspots):
    """Save hotspots to file"""
    ensure_data_dir()
    with open(HOTSPOTS_FILE, 'w') as f:
        json.dump(hotspots, f, indent=2)


# ============== API ENDPOINTS ==============

@app.route('/api/hotspots', methods=['GET'])
def get_all_hotspots():
    """Get all hotspots for all scenes"""
    hotspots = load_hotspots()
    return jsonify(hotspots)


@app.route('/api/hotspots/<scene_id>', methods=['GET'])
def get_scene_hotspots(scene_id):
    """Get hotspots for a specific scene"""
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    return jsonify(scene_hotspots)


@app.route('/api/hotspots/<scene_id>', methods=['PUT'])
def update_scene_hotspots(scene_id):
    """Update hotspots for a specific scene"""
    hotspots = load_hotspots()
    hotspots[scene_id] = request.json
    save_hotspots(hotspots)
    return jsonify({"success": True, "message": f"Updated hotspots for {scene_id}"})


@app.route('/api/hotspots/<scene_id>/<hotspot_id>', methods=['PUT'])
def update_hotspot(scene_id, hotspot_id):
    """Update a single hotspot"""
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    # Find and update the hotspot
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            scene_hotspots[i] = {**h, **request.json}
            updated = True
            break
    
    if not updated:
        return jsonify({"success": False, "message": "Hotspot not found"}), 404
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return jsonify({"success": True, "message": f"Updated hotspot {hotspot_id}"})


@app.route('/api/hotspots/<scene_id>/<hotspot_id>/images', methods=['PUT'])
def update_hotspot_images(scene_id, hotspot_id):
    """
    Update images for a specific hotspot.
    
    Request body: { "images": ["/image1.jpg", "/image2.jpg"] }
    """
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    # Find and update the hotspot's images
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            scene_hotspots[i]['images'] = request.json.get('images', [])
            updated = True
            break
    
    if not updated:
        return jsonify({"success": False, "message": "Hotspot not found"}), 404
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return jsonify({
        "success": True, 
        "message": f"Updated images for hotspot {hotspot_id}",
        "images": request.json.get('images', [])
    })


@app.route('/api/hotspots/<scene_id>/<hotspot_id>/images', methods=['POST'])
def add_hotspot_image(scene_id, hotspot_id):
    """
    Add a single image to a hotspot.
    
    Request body: { "image": "/new-image.jpg" }
    """
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    image_url = request.json.get('image')
    if not image_url:
        return jsonify({"success": False, "message": "No image URL provided"}), 400
    
    # Find and update the hotspot's images
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            if 'images' not in scene_hotspots[i]:
                scene_hotspots[i]['images'] = []
            scene_hotspots[i]['images'].append(image_url)
            updated = True
            break
    
    if not updated:
        return jsonify({"success": False, "message": "Hotspot not found"}), 404
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return jsonify({
        "success": True, 
        "message": f"Added image to hotspot {hotspot_id}",
        "image": image_url
    })


@app.route('/api/hotspots/<scene_id>/<hotspot_id>/images/<int:image_index>', methods=['DELETE'])
def delete_hotspot_image(scene_id, hotspot_id, image_index):
    """Delete an image from a hotspot by index"""
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    # Find the hotspot
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            images = h.get('images', [])
            if 0 <= image_index < len(images):
                removed = images.pop(image_index)
                scene_hotspots[i]['images'] = images
                updated = True
            else:
                return jsonify({"success": False, "message": "Image index out of range"}), 400
            break
    
    if not updated:
        return jsonify({"success": False, "message": "Hotspot not found"}), 404
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return jsonify({
        "success": True, 
        "message": f"Deleted image at index {image_index}",
        "removed": removed
    })


@app.route('/api/hotspots/reset', methods=['POST'])
def reset_hotspots():
    """Reset all hotspots to defaults"""
    save_hotspots(DEFAULT_HOTSPOTS)
    return jsonify({"success": True, "message": "Hotspots reset to defaults"})


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "shopiverse-admin"})


if __name__ == '__main__':
    print("🚀 Starting Shopiverse Admin API on http://localhost:5000")
    print("📁 Data directory:", DATA_DIR)
    app.run(host='0.0.0.0', port=5000, debug=True)
