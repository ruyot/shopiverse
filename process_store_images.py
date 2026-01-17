"""
Batch process store images to create .ply files using Sharp API
"""
from pathlib import Path
import modal

# Import the Sharp app and model
from sharp_api import app, SharpModel

@app.local_entrypoint()
def batch_process():
    # Input directory
    input_dir = Path(r"C:\Users\nicky\OneDrive\Desktop\Web\UoftHacks13\shopiverse\frontend\public\store_images")
    
    # Output directory
    output_dir = Path(r"C:\Users\nicky\OneDrive\Desktop\Web\UoftHacks13\shopiverse\test_outputs")
    output_dir.mkdir(exist_ok=True)
    
    # Get all image files
    image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.heic'}
    image_files = [f for f in input_dir.iterdir() if f.suffix.lower() in image_extensions]
    
    print(f"Found {len(image_files)} images to process:")
    for img in image_files:
        print(f"  - {img.name}")
    
    print("\nProcessing images...")
    
    # Initialize model
    model = SharpModel()
    
    # Process each image
    for i, image_path in enumerate(image_files, 1):
        print(f"\n[{i}/{len(image_files)}] Processing: {image_path.name}")
        
        try:
            # Read image
            with open(image_path, "rb") as f:
                image_bytes = f.read()
            
            # Run prediction
            ply_bytes = model.predict.remote(image_bytes)
            
            # Save output
            output_path = output_dir / f"{image_path.stem}_gaussian.ply"
            with open(output_path, "wb") as f:
                f.write(ply_bytes)
            
            print(f"  ✓ Saved to: {output_path.name}")
            
        except Exception as e:
            print(f"  ✗ Error processing {image_path.name}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n✓ Processing complete! Output saved to: {output_dir}")
