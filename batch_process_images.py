import os
import requests
from pathlib import Path

# Configuration
SHARP_API_ENDPOINT = 'https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run'
INPUT_DIR = 'frontend/public/store_images'
OUTPUT_DIR = 'frontend/public/photos'

def process_image_to_ply(image_path, output_path):
    """Convert an image to PLY using the Sharp API."""
    print(f"Processing {image_path}...")
    
    try:
        # Read the image file
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        # Encode image as base64
        import base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Send to Sharp API with base64 encoded image
        print(f"  Sending to Sharp API...")
        response = requests.post(
            SHARP_API_ENDPOINT,
            json={'image': image_base64},
            timeout=300  # 5 minute timeout
        )
        
        if response.status_code == 200:
            # Decode the base64 PLY response
            result = response.json()
            if result.get('success') and 'ply' in result:
                ply_bytes = base64.b64decode(result['ply'])
                # Save the PLY file
                with open(output_path, 'wb') as f:
                    f.write(ply_bytes)
                print(f"  ✓ Saved to {output_path}")
                return True
            else:
                print(f"  ✗ API error: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"  ✗ API error: {response.status_code}")
            print(f"     Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        return False

def main():
    """Process all images in the store_images directory."""
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Get all image files
    input_path = Path(INPUT_DIR)
    image_files = list(input_path.glob('*.png')) + list(input_path.glob('*.jpg')) + list(input_path.glob('*.jpeg'))
    
    print(f"Found {len(image_files)} images to process\n")
    
    successful = 0
    failed = 0
    
    for image_file in image_files:
        # Generate output filename (same name but .ply extension)
        output_filename = image_file.stem + '.ply'
        output_path = Path(OUTPUT_DIR) / output_filename
        
        # Process the image
        if process_image_to_ply(str(image_file), str(output_path)):
            successful += 1
        else:
            failed += 1
        
        print()  # Empty line between files
    
    print(f"\n{'='*50}")
    print(f"Processing complete!")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
