"""
Process single store_p2.png image to create .ply file using Sharp API
"""
from pathlib import Path
import modal

from sharp_api import app, SharpModel

@app.local_entrypoint()
def process_single():
    # Input file
    image_path = Path(r"C:\Users\nicky\OneDrive\Desktop\Web\UoftHacks13\shopiverse\frontend\public\store_images\store_p2.png")
    
    # Output directory
    output_dir = Path(r"C:\Users\nicky\OneDrive\Desktop\Web\UoftHacks13\shopiverse\test_outputs")
    output_dir.mkdir(exist_ok=True)
    
    print(f"Processing: {image_path.name}")
    
    # Initialize model
    model = SharpModel()
    
    # Read image
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    # Run prediction
    ply_bytes = model.predict.remote(image_bytes)
    
    # Save output
    output_path = output_dir / f"{image_path.stem}_gaussian.ply"
    with open(output_path, "wb") as f:
        f.write(ply_bytes)
    
    print(f"✓ Saved to: {output_path}")
