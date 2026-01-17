import base64
import requests
from pathlib import Path

# Configuration
SHARP_API_ENDPOINT = 'https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run'
INPUT_IMAGE = 'frontend/public/store_images/store_front.png'
OUTPUT_PLY = 'frontend/public/photos/store_front.ply'

print(f"Testing Sharp API with {INPUT_IMAGE}...")
print(f"Reading image...")

# Read the image file
with open(INPUT_IMAGE, 'rb') as f:
    image_bytes = f.read()

print(f"Image size: {len(image_bytes) / 1024 / 1024:.2f} MB")

# Encode image as base64
print(f"Encoding to base64...")
image_base64 = base64.b64encode(image_bytes).decode('utf-8')
print(f"Base64 size: {len(image_base64) / 1024 / 1024:.2f} MB")

# Send to Sharp API
print(f"Sending to Sharp API (this may take 1-2 minutes)...")
try:
    response = requests.post(
        SHARP_API_ENDPOINT,
        json={'image': image_base64},
        timeout=300
    )
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success') and 'ply' in result:
            ply_bytes = base64.b64decode(result['ply'])
            
            # Save the PLY file
            Path(OUTPUT_PLY).parent.mkdir(parents=True, exist_ok=True)
            with open(OUTPUT_PLY, 'wb') as f:
                f.write(ply_bytes)
            
            print(f"✓ Success! Saved {len(ply_bytes) / 1024 / 1024:.2f} MB PLY to {OUTPUT_PLY}")
        else:
            print(f"✗ API returned error: {result.get('error', 'Unknown error')}")
            print(f"Full response: {result}")
    else:
        print(f"✗ HTTP error {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"✗ Exception: {str(e)}")
    import traceback
    traceback.print_exc()
