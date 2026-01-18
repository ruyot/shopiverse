"""
Admin API Endpoints
Handles product/hotspot data management for the Shopiverse admin panel.
Allows changes made in the admin panel to persist across all users.

Usage:
    # Install dependencies
    pip install fastapi uvicorn python-multipart

    # Run the server
    python admin_endpoints.py
    
    # Or run with uvicorn directly
    uvicorn admin_endpoints:app --reload --port 5000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import json
import os
import shutil
import csv
from datetime import datetime

app = FastAPI(title="Shopiverse Admin API")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to store hotspots data
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
HOTSPOTS_FILE = os.path.join(DATA_DIR, 'hotspots.json')
ANALYTICS_FILE = os.path.join(DATA_DIR, 'analytics.csv')

# Path to public folder (for serving images via Vite)
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

# Default hotspots (fallback if no saved data)
DEFAULT_HOTSPOTS = {
    "storeP1": [
        {"id": "p1-1", "x": 65, "y": 50, "label": "Product 1", "title": "Product 1", "images": []},
        {"id": "p1-2", "x": 35, "y": 50, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "p1-3", "x": 50, "y": 50, "label": "Product 3", "title": "Product 3", "images": []}
    ],
    "storeP1Left": [
        {"id": "p1l-1", "x": 38, "y": 42, "label": "Product 1", "title": "Product 1", "images": []},
        {"id": "p1l-2", "x": 28, "y": 42, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "p1l-3", "x": 28, "y": 65, "label": "Product 3", "title": "Product 3", "images": []},
        {"id": "p1l-4", "x": 39, "y": 64, "label": "Product 4", "title": "Product 4", "images": []}
    ],
    "storeP1Right": [
        {"id": "p1r-1", "x": 30, "y": 35, "label": "Product 1", "title": "Product 1", "images": []},
        {"id": "p1r-2", "x": 50, "y": 45, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "p1r-3", "x": 70, "y": 40, "label": "Product 3", "title": "Product 3", "images": []}
    ],
    "storeP2Left": [
        {"id": "p2l-1", "x": 21, "y": 45, "label": "Product 1", "title": "Product 1", "images": []},
        {"id": "p2l-2", "x": 30, "y": 35, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "p2l-3", "x": 80, "y": 55, "label": "Product 3", "title": "Product 3", "images": []}
    ],
    "storeP2Right": [
        {"id": "p2r-1", "x": 39, "y": 50, "label": "Product 1", "title": "Product 1", "images": []},
        {"id": "p2r-2", "x": 57, "y": 46, "label": "Product 2", "title": "Product 2", "images": []},
        {"id": "p2r-3", "x": 68, "y": 42, "label": "Product 3", "title": "Product 3", "images": []}
    ]
}


# Pydantic models for request validation
class ImagesUpdate(BaseModel):
    images: List[str]

class ImageAdd(BaseModel):
    image: str

class Hotspot(BaseModel):
    id: str
    x: float
    y: float
    label: str
    title: str
    images: List[str] = []

    class Config:
        extra = "allow"  # Allow additional fields


class AnalyticsEvent(BaseModel):
    action: str  # e.g., "add_to_cart", "navigate", "view_product", "checkout"
    timestamp: Optional[str] = None
    sessionId: Optional[str] = None  # Unique session identifier
    userId: Optional[str] = None  # Persistent user identifier
    sessionDuration: Optional[int] = None  # Seconds since session start
    data: Optional[dict] = None  # Additional event data (product id, scene id, etc.)


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

@app.get("/api/hotspots")
def get_all_hotspots():
    """Get all hotspots for all scenes"""
    return load_hotspots()


@app.get("/api/hotspots/{scene_id}")
def get_scene_hotspots(scene_id: str):
    """Get hotspots for a specific scene"""
    hotspots = load_hotspots()
    return hotspots.get(scene_id, [])


@app.put("/api/hotspots/{scene_id}")
def update_scene_hotspots(scene_id: str, scene_hotspots: List[dict]):
    """Update hotspots for a specific scene"""
    hotspots = load_hotspots()
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return {"success": True, "message": f"Updated hotspots for {scene_id}"}


@app.put("/api/hotspots/{scene_id}/{hotspot_id}")
def update_hotspot(scene_id: str, hotspot_id: str, hotspot_data: dict):
    """Update a single hotspot"""
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    # Find and update the hotspot
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            scene_hotspots[i] = {**h, **hotspot_data}
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return {"success": True, "message": f"Updated hotspot {hotspot_id}"}


@app.put("/api/hotspots/{scene_id}/{hotspot_id}/images")
def update_hotspot_images(scene_id: str, hotspot_id: str, data: ImagesUpdate):
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
            scene_hotspots[i]['images'] = data.images
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return {
        "success": True, 
        "message": f"Updated images for hotspot {hotspot_id}",
        "images": data.images
    }


@app.post("/api/hotspots/{scene_id}/{hotspot_id}/images")
def add_hotspot_image(scene_id: str, hotspot_id: str, data: ImageAdd):
    """
    Add a single image to a hotspot.
    
    Request body: { "image": "/new-image.jpg" }
    """
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    if not data.image:
        raise HTTPException(status_code=400, detail="No image URL provided")
    
    # Find and update the hotspot's images
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            if 'images' not in scene_hotspots[i]:
                scene_hotspots[i]['images'] = []
            scene_hotspots[i]['images'].append(data.image)
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return {
        "success": True, 
        "message": f"Added image to hotspot {hotspot_id}",
        "image": data.image
    }


@app.delete("/api/hotspots/{scene_id}/{hotspot_id}/images/{image_index}")
def delete_hotspot_image(scene_id: str, hotspot_id: str, image_index: int):
    """Delete an image from a hotspot by index"""
    hotspots = load_hotspots()
    scene_hotspots = hotspots.get(scene_id, [])
    
    # Find the hotspot
    removed = None
    updated = False
    for i, h in enumerate(scene_hotspots):
        if h.get('id') == hotspot_id:
            images = h.get('images', [])
            if 0 <= image_index < len(images):
                removed = images.pop(image_index)
                scene_hotspots[i]['images'] = images
                updated = True
            else:
                raise HTTPException(status_code=400, detail="Image index out of range")
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    
    hotspots[scene_id] = scene_hotspots
    save_hotspots(hotspots)
    return {
        "success": True, 
        "message": f"Deleted image at index {image_index}",
        "removed": removed
    }


@app.post("/api/hotspots/reset")
def reset_hotspots():
    """Reset all hotspots to defaults"""
    save_hotspots(DEFAULT_HOTSPOTS)
    return {"success": True, "message": "Hotspots reset to defaults"}


# ============== FILE UPLOAD ENDPOINTS ==============

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload an image file to public/
    Returns the path to use in hotspots.json
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save file with original name to public folder
    file_path = os.path.join(PUBLIC_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the web-accessible path (just /filename for public folder)
        return {
            "success": True,
            "filename": file.filename,
            "path": f"/{file.filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@app.delete("/api/upload/{filename}")
def delete_file(filename: str):
    """
    Delete an image file from public/
    """
    file_path = os.path.join(PUBLIC_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": f"Deleted {filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


# ============== ANALYTICS ENDPOINTS ==============

ANALYTICS_HEADERS = ['timestamp', 'session_id', 'user_id', 'session_duration', 'action', 'data']


def ensure_analytics_file():
    """Create analytics CSV with headers if it doesn't exist"""
    ensure_data_dir()
    if not os.path.exists(ANALYTICS_FILE):
        with open(ANALYTICS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(ANALYTICS_HEADERS)


@app.post("/api/analytics")
def track_event(event: AnalyticsEvent):
    """
    Track a frontend event and append it to the CSV file.

    Request body: {
        "action": "navigate",
        "sessionId": "session_123",
        "userId": "user_456",
        "sessionDuration": 120,
        "data": { "fromScene": "storeFront", "toScene": "storeP1", "timeInPreviousScene": 45 }
    }
    """
    ensure_analytics_file()

    timestamp = event.timestamp or datetime.now().isoformat()
    session_id = event.sessionId or ""
    user_id = event.userId or ""
    session_duration = event.sessionDuration if event.sessionDuration is not None else ""
    data_json = json.dumps(event.data) if event.data else ""

    with open(ANALYTICS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([timestamp, session_id, user_id, session_duration, event.action, data_json])

    return {"success": True, "message": f"Tracked event: {event.action}"}


@app.get("/api/analytics")
def get_analytics():
    """Get all analytics events"""
    ensure_analytics_file()

    events = []
    with open(ANALYTICS_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            event = {
                'timestamp': row.get('timestamp', ''),
                'sessionId': row.get('session_id', ''),
                'userId': row.get('user_id', ''),
                'sessionDuration': int(row['session_duration']) if row.get('session_duration') else None,
                'action': row.get('action', ''),
                'data': json.loads(row['data']) if row.get('data') else None
            }
            events.append(event)

    return {"events": events, "count": len(events)}


@app.get("/api/analytics/summary")
def get_analytics_summary():
    """Get aggregated analytics summary by session and user"""
    ensure_analytics_file()

    sessions = {}
    users = {}

    with open(ANALYTICS_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            session_id = row.get('session_id', '')
            user_id = row.get('user_id', '')
            action = row.get('action', '')
            data = json.loads(row['data']) if row.get('data') else {}

            # Track sessions
            if session_id:
                if session_id not in sessions:
                    sessions[session_id] = {
                        'userId': user_id,
                        'startTime': row.get('timestamp'),
                        'actions': [],
                        'scenes': {},
                        'totalDuration': 0
                    }
                sessions[session_id]['actions'].append(action)

                # Track time in scenes
                if action == 'navigate' and 'timeInPreviousScene' in data:
                    from_scene = data.get('fromScene', 'unknown')
                    if from_scene not in sessions[session_id]['scenes']:
                        sessions[session_id]['scenes'][from_scene] = 0
                    sessions[session_id]['scenes'][from_scene] += data['timeInPreviousScene']

                # Track session end
                if action == 'session_end' and 'totalDuration' in data:
                    sessions[session_id]['totalDuration'] = data['totalDuration']

            # Track users
            if user_id:
                if user_id not in users:
                    users[user_id] = {'sessions': [], 'totalActions': 0}
                if session_id and session_id not in users[user_id]['sessions']:
                    users[user_id]['sessions'].append(session_id)
                users[user_id]['totalActions'] += 1

    return {
        'sessions': sessions,
        'users': users,
        'totalSessions': len(sessions),
        'totalUsers': len(users)
    }


@app.delete("/api/analytics")
def clear_analytics():
    """Clear all analytics data"""
    ensure_analytics_file()
    with open(ANALYTICS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(ANALYTICS_HEADERS)
    return {"success": True, "message": "Analytics data cleared"}


# Health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "shopiverse-admin"}


if __name__ == '__main__':
    import uvicorn
    print("🚀 Starting Shopiverse Admin API on http://localhost:5000")
    print("📁 Data directory:", DATA_DIR)
    print("📚 API docs available at http://localhost:5000/docs")
    uvicorn.run(app, host='0.0.0.0', port=5000)
