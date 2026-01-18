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
import zlib

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
SCENES_FILE = os.path.join(DATA_DIR, 'scenes.json')

# Path to public folder (for serving images via Vite)
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
PLY_DIR = os.path.join(PUBLIC_DIR, 'scenes')

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
    eventId: Optional[str] = None
    deviceType: Optional[str] = None
    page: Optional[str] = None
    scene: Optional[str] = None
    productId: Optional[str] = None
    orderTotal: Optional[float] = None
    cartValue: Optional[float] = None
    messageText: Optional[str] = None


class SceneUpdate(BaseModel):
    image: Optional[str] = None
    ply: Optional[str] = None
    name: Optional[str] = None


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


def load_scene_overrides():
    """Load scene overrides from file"""
    ensure_data_dir()
    if os.path.exists(SCENES_FILE):
        try:
            with open(SCENES_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_scene_overrides(overrides):
    """Save scene overrides to file"""
    ensure_data_dir()
    with open(SCENES_FILE, 'w') as f:
        json.dump(overrides, f, indent=2)


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


# ============== SCENE OVERRIDES ==============

@app.get("/api/scenes")
def get_scene_overrides():
    """Get all scene overrides"""
    return load_scene_overrides()


@app.get("/api/scenes/{scene_id}")
def get_scene_override(scene_id: str):
    """Get a specific scene override"""
    overrides = load_scene_overrides()
    return overrides.get(scene_id, {})


@app.put("/api/scenes/{scene_id}")
def update_scene_override(scene_id: str, data: SceneUpdate):
    """Update a scene override (image/ply/name)"""
    overrides = load_scene_overrides()
    current = overrides.get(scene_id, {})
    payload = data.dict(exclude_unset=True)
    for key, value in payload.items():
        if value is None:
            continue
        current[key] = value
    overrides[scene_id] = current
    save_scene_overrides(overrides)
    return {"success": True, "scene_id": scene_id, "override": current}


@app.delete("/api/scenes/{scene_id}")
def delete_scene_override(scene_id: str):
    """Delete a scene override"""
    overrides = load_scene_overrides()
    if scene_id in overrides:
        del overrides[scene_id]
        save_scene_overrides(overrides)
    return {"success": True, "scene_id": scene_id}


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


@app.post("/api/upload-ply")
async def upload_ply(file: UploadFile = File(...)):
    """
    Upload a PLY file to public/scenes
    Returns the path to use in navigation config
    """
    filename = file.filename or ''
    if not filename.lower().endswith('.ply'):
        raise HTTPException(status_code=400, detail="File must be a .ply")

    os.makedirs(PLY_DIR, exist_ok=True)
    file_path = os.path.join(PLY_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "filename": filename,
            "path": f"/scenes/{filename}"
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

ANALYTICS_HEADERS = [
    'timestamp',
    'session_id',
    'user_id',
    'session_duration',
    'action',
    'data',
    'event_id',
    'device_type',
    'page',
    'scene',
    'product_id',
    'order_total',
    'cart_value',
    'message_text'
]


def _safe_float(value, default=0.0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _stable_hash(value: str) -> int:
    return zlib.crc32(value.encode('utf-8')) & 0xFFFFFFFF


def _infer_device_type(user_agent: str) -> str:
    if not user_agent:
        return 'desktop'
    ua = user_agent.lower()
    if 'mobile' in ua or 'iphone' in ua or 'android' in ua:
        return 'mobile'
    if 'ipad' in ua or 'tablet' in ua:
        return 'tablet'
    return 'desktop'


def _default_order_total(seed: str) -> float:
    if not seed:
        return 49.99
    return round((_stable_hash(seed) % 8000) / 100 + 20, 2)


def _normalize_event_fields(event: AnalyticsEvent):
    data = event.data or {}
    timestamp = event.timestamp or datetime.now().isoformat()
    session_id = event.sessionId or ""
    user_id = event.userId or ""
    session_duration = event.sessionDuration if event.sessionDuration is not None else ""
    event_id = event.eventId or f"evt_{_stable_hash(f'{session_id}_{timestamp}')}"
    user_agent = data.get('userAgent') or data.get('user_agent') or ''
    device_type = event.deviceType or _infer_device_type(user_agent)
    page = event.page or data.get('page') or data.get('referrer') or 'store'
    scene = event.scene or data.get('scene') or data.get('sceneId') or data.get('toScene') or data.get('fromScene') or ''
    product_id = event.productId or data.get('productId') or data.get('hotspotId') or ''
    order_total = event.orderTotal
    if order_total is None:
        order_total = _safe_float(data.get('total'), None)
    if (order_total is None or order_total <= 0) and event.action in ('start_checkout', 'complete_checkout'):
        order_total = _default_order_total(session_id or product_id or timestamp)
    if order_total is None:
        order_total = 0.0
    cart_value = event.cartValue
    if cart_value is None:
        cart_value = _safe_float(data.get('total'), None)
    if cart_value is None and isinstance(data.get('price'), (int, float)):
        qty = _safe_float(data.get('quantity'), 1.0)
        cart_value = round(_safe_float(data.get('price')) * qty, 2)
    if (cart_value is None or cart_value <= 0) and event.action in ('add_to_cart', 'start_checkout', 'update_quantity', 'complete_checkout'):
        cart_value = round(_default_order_total(product_id or session_id or timestamp) / 2, 2)
    if cart_value is None:
        cart_value = 0.0
    message_text = event.messageText or data.get('messageText') or data.get('message') or ''
    if message_text:
        message_text = str(message_text)[:200]

    return {
        'timestamp': timestamp,
        'session_id': session_id,
        'user_id': user_id,
        'session_duration': session_duration,
        'action': event.action,
        'data': json.dumps(data) if data else "",
        'event_id': event_id,
        'device_type': device_type,
        'page': page,
        'scene': scene,
        'product_id': product_id,
        'order_total': order_total,
        'cart_value': cart_value,
        'message_text': message_text
    }


def _migrate_analytics_file():
    if not os.path.exists(ANALYTICS_FILE):
        return
    with open(ANALYTICS_FILE, 'r', newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    if not rows:
        return
    existing_headers = rows[0]
    if existing_headers == ANALYTICS_HEADERS:
        return
    data_rows = rows[1:]
    with open(ANALYTICS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(ANALYTICS_HEADERS)
        for row in data_rows:
            row_map = {}
            for idx, header in enumerate(existing_headers):
                if idx < len(row):
                    row_map[header] = row[idx]
            data_json = row_map.get('data') or ''
            try:
                data_obj = json.loads(data_json) if data_json else {}
            except json.JSONDecodeError:
                data_obj = {}
            event_stub = AnalyticsEvent(
                action=row_map.get('action', '') or 'unknown',
                timestamp=row_map.get('timestamp') or datetime.now().isoformat(),
                sessionId=row_map.get('session_id'),
                userId=row_map.get('user_id'),
                sessionDuration=int(row_map['session_duration']) if row_map.get('session_duration') else None,
                data=data_obj,
                eventId=row_map.get('event_id'),
                deviceType=row_map.get('device_type'),
                page=row_map.get('page'),
                scene=row_map.get('scene'),
                productId=row_map.get('product_id'),
                orderTotal=_safe_float(row_map.get('order_total'), None),
                cartValue=_safe_float(row_map.get('cart_value'), None),
                messageText=row_map.get('message_text')
            )
            normalized = _normalize_event_fields(event_stub)
            writer.writerow([
                normalized['timestamp'],
                normalized['session_id'],
                normalized['user_id'],
                normalized['session_duration'],
                normalized['action'],
                normalized['data'],
                normalized['event_id'],
                normalized['device_type'],
                normalized['page'],
                normalized['scene'],
                normalized['product_id'],
                normalized['order_total'],
                normalized['cart_value'],
                normalized['message_text']
            ])


def ensure_analytics_file():
    """Create analytics CSV with headers if it doesn't exist"""
    ensure_data_dir()
    if not os.path.exists(ANALYTICS_FILE):
        with open(ANALYTICS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(ANALYTICS_HEADERS)
        return
    _migrate_analytics_file()


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

    normalized = _normalize_event_fields(event)

    with open(ANALYTICS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            normalized['timestamp'],
            normalized['session_id'],
            normalized['user_id'],
            normalized['session_duration'],
            normalized['action'],
            normalized['data'],
            normalized['event_id'],
            normalized['device_type'],
            normalized['page'],
            normalized['scene'],
            normalized['product_id'],
            normalized['order_total'],
            normalized['cart_value'],
            normalized['message_text']
        ])

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
                'data': json.loads(row['data']) if row.get('data') else None,
                'eventId': row.get('event_id', ''),
                'deviceType': row.get('device_type', ''),
                'page': row.get('page', ''),
                'scene': row.get('scene', ''),
                'productId': row.get('product_id', ''),
                'orderTotal': _safe_float(row.get('order_total'), None),
                'cartValue': _safe_float(row.get('cart_value'), None),
                'messageText': row.get('message_text', '')
            }
            events.append(event)

    return {"events": events, "count": len(events)}


@app.get("/api/analytics/summary")
def get_analytics_summary():
    """Get aggregated analytics summary by session and user"""
    ensure_analytics_file()

    sessions = {}
    users = {}
    events_by_session = {}
    session_start_times = {}
    session_earliest = {}
    session_last_action = {}
    session_last_time = {}
    session_actions = {}
    session_scenes = {}
    session_first_action_time = {}
    funnel_sessions = {
        'view_product': set(),
        'add_to_cart': set(),
        'start_checkout': set(),
        'complete_checkout': set()
    }
    product_funnel = {}
    transition_counts = {}
    add_to_cart_time = {}
    start_checkout_time = {}
    complete_checkout_time = {}
    peak_hours = {str(i): 0 for i in range(24)}
    peak_days = {str(i): 0 for i in range(7)}
    device_breakdown = {}
    referrer_counts = {}
    chat_intents = {}

    with open(ANALYTICS_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            session_id = row.get('session_id', '')
            user_id = row.get('user_id', '')
            action = row.get('action', '')
            data = json.loads(row['data']) if row.get('data') else {}
            timestamp = row.get('timestamp', '')
            product_id = row.get('product_id') or data.get('productId') or data.get('hotspotId') or ''
            scene = row.get('scene') or data.get('scene') or data.get('sceneId') or data.get('toScene') or ''
            device_type = row.get('device_type') or _infer_device_type(data.get('userAgent', ''))
            referrer = data.get('referrer') or row.get('page') or ''
            message_text = row.get('message_text') or data.get('messageText') or data.get('message') or ''

            def parse_ts(value):
                if not value:
                    return None
                try:
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    return None

            ts = parse_ts(timestamp)

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
                session_actions.setdefault(session_id, 0)
                session_actions[session_id] += 1
                if scene:
                    session_scenes.setdefault(session_id, set())
                    session_scenes[session_id].add(scene)

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

            if session_id:
                events_by_session.setdefault(session_id, []).append({
                    'timestamp': timestamp,
                    'ts': ts,
                    'action': action,
                    'data': data,
                    'productId': product_id,
                    'scene': scene
                })
                if ts:
                    if session_id not in session_earliest or ts < session_earliest[session_id]:
                        session_earliest[session_id] = ts
                if action == 'session_start' and ts:
                    if session_id not in session_start_times or ts < session_start_times[session_id]:
                        session_start_times[session_id] = ts
                if ts:
                    if session_id not in session_last_time or ts > session_last_time[session_id]:
                        session_last_time[session_id] = ts
                        session_last_action[session_id] = action

            if action in funnel_sessions and session_id:
                funnel_sessions[action].add(session_id)

            if product_id:
                if product_id not in product_funnel:
                    product_funnel[product_id] = {'productId': product_id, 'views': 0, 'addToCart': 0, 'startCheckout': 0, 'purchased': 0}
                if action == 'view_product':
                    product_funnel[product_id]['views'] += 1
                if action == 'add_to_cart':
                    product_funnel[product_id]['addToCart'] += 1
                if action == 'start_checkout':
                    product_funnel[product_id]['startCheckout'] += 1
                if action == 'complete_checkout':
                    product_funnel[product_id]['purchased'] += 1

            if action == 'navigate':
                from_scene = data.get('fromScene') or ''
                to_scene = data.get('toScene') or ''
                if from_scene and to_scene:
                    key = f"{from_scene} -> {to_scene}"
                    transition_counts[key] = transition_counts.get(key, 0) + 1

            if ts and action == 'session_start':
                peak_hours[str(ts.hour)] = peak_hours.get(str(ts.hour), 0) + 1
                peak_days[str(ts.weekday())] = peak_days.get(str(ts.weekday()), 0) + 1

            if action == 'session_start' and device_type:
                device_breakdown[device_type] = device_breakdown.get(device_type, 0) + 1

            if action == 'session_start' and referrer:
                referrer_counts[referrer] = referrer_counts.get(referrer, 0) + 1

            if action == 'send_chat_message' and message_text:
                text = message_text.lower()
                intent = 'other'
                if any(k in text for k in ['price', 'cost', 'expensive', 'cheap', '$']):
                    intent = 'pricing'
                elif any(k in text for k in ['size', 'fit', 'dimension', 'measurement']):
                    intent = 'sizing'
                elif any(k in text for k in ['ship', 'delivery', 'arrive', 'track']):
                    intent = 'shipping'
                elif any(k in text for k in ['return', 'refund', 'exchange']):
                    intent = 'returns'
                elif any(k in text for k in ['stock', 'available', 'availability']):
                    intent = 'availability'
                elif any(k in text for k in ['material', 'fabric', 'color']):
                    intent = 'product_details'
                chat_intents[intent] = chat_intents.get(intent, 0) + 1

            if action == 'add_to_cart' and session_id and ts:
                if session_id not in add_to_cart_time:
                    add_to_cart_time[session_id] = ts
            if action == 'start_checkout' and session_id and ts:
                if session_id not in start_checkout_time:
                    start_checkout_time[session_id] = ts
            if action == 'complete_checkout' and session_id and ts:
                if session_id not in complete_checkout_time:
                    complete_checkout_time[session_id] = ts

            if session_id and action != 'session_start' and ts:
                if session_id not in session_first_action_time:
                    session_first_action_time[session_id] = ts

    time_to_first = []
    for session_id, first_action_ts in session_first_action_time.items():
        start_ts = session_start_times.get(session_id) or session_earliest.get(session_id)
        if start_ts and first_action_ts:
            delta = (first_action_ts - start_ts).total_seconds()
            if delta >= 0:
                time_to_first.append(delta)

    time_to_checkout = []
    time_to_purchase = []
    for session_id, add_ts in add_to_cart_time.items():
        start_ts = start_checkout_time.get(session_id)
        if add_ts and start_ts:
            delta = (start_ts - add_ts).total_seconds()
            if delta >= 0:
                time_to_checkout.append(delta)
    for session_id, start_ts in start_checkout_time.items():
        complete_ts = complete_checkout_time.get(session_id)
        if start_ts and complete_ts:
            delta = (complete_ts - start_ts).total_seconds()
            if delta >= 0:
                time_to_purchase.append(delta)

    def _avg(values):
        return round(sum(values) / len(values), 2) if values else 0

    def _median(values):
        if not values:
            return 0
        vals = sorted(values)
        mid = len(vals) // 2
        if len(vals) % 2 == 0:
            return round((vals[mid - 1] + vals[mid]) / 2, 2)
        return round(vals[mid], 2)

    def _p90(values):
        if not values:
            return 0
        vals = sorted(values)
        idx = int(len(vals) * 0.9) - 1
        idx = max(min(idx, len(vals) - 1), 0)
        return round(vals[idx], 2)

    actions_per_session = [count for count in session_actions.values()]
    scenes_per_session = [len(scenes) for scenes in session_scenes.values()]

    drop_offs = {}
    for action in session_last_action.values():
        drop_offs[action] = drop_offs.get(action, 0) + 1

    top_transitions = sorted(
        [{'path': k, 'count': v} for k, v in transition_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:10]

    top_products = sorted(
        product_funnel.values(),
        key=lambda x: x['views'],
        reverse=True
    )[:10]

    user_session_counts = [len(user['sessions']) for user in users.values()]
    returning_users = len([count for count in user_session_counts if count > 1])
    total_users = len(users)
    return_rate = round((returning_users / total_users) * 100, 2) if total_users else 0

    insights = {
        'funnel': {
            'viewProductSessions': len(funnel_sessions['view_product']),
            'addToCartSessions': len(funnel_sessions['add_to_cart']),
            'startCheckoutSessions': len(funnel_sessions['start_checkout']),
            'completeCheckoutSessions': len(funnel_sessions['complete_checkout'])
        },
        'dropOffs': sorted(
            [{'action': k, 'count': v} for k, v in drop_offs.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:10],
        'sceneTransitions': top_transitions,
        'timeToFirstAction': {
            'averageSeconds': _avg(time_to_first),
            'medianSeconds': _median(time_to_first),
            'p90Seconds': _p90(time_to_first)
        },
        'timeToCheckout': {
            'addToCheckoutAvgSeconds': _avg(time_to_checkout),
            'checkoutToPurchaseAvgSeconds': _avg(time_to_purchase)
        },
        'cartAbandonment': {
            'startCheckoutSessions': len(start_checkout_time),
            'completeCheckoutSessions': len(complete_checkout_time),
            'abandonmentRate': round(
                (1 - (len(complete_checkout_time) / len(start_checkout_time))) * 100, 2
            ) if start_checkout_time else 0
        },
        'engagement': {
            'actionsPerSessionAvg': _avg(actions_per_session),
            'actionsPerSessionMedian': _median(actions_per_session),
            'actionsPerSessionP90': _p90(actions_per_session),
            'scenesPerSessionAvg': _avg(scenes_per_session),
            'scenesPerSessionMedian': _median(scenes_per_session),
            'scenesPerSessionP90': _p90(scenes_per_session)
        },
        'peakHours': peak_hours,
        'peakDays': peak_days,
        'repeatUsers': {
            'returningUsers': returning_users,
            'returnRate': return_rate,
            'avgSessionsPerUser': _avg(user_session_counts)
        },
        'topChatIntents': sorted(
            [{'intent': k, 'count': v} for k, v in chat_intents.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:8],
        'topReferrers': sorted(
            [{'referrer': k, 'count': v} for k, v in referrer_counts.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:8],
        'deviceBreakdown': device_breakdown,
        'productFunnel': top_products
    }

    return {
        'sessions': sessions,
        'users': users,
        'totalSessions': len(sessions),
        'totalUsers': len(users),
        'insights': insights
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
    print("🚀 Starting Shopiverse Admin API on http://localhost:5001")
    print("📁 Data directory:", DATA_DIR)
    print("📚 API docs available at http://localhost:5001/docs")
    uvicorn.run(app, host='0.0.0.0', port=5001)
